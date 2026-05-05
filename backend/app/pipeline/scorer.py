import math
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.supplier import Supplier
from app.models.risk import RawEvent, ClassifiedRisk, SupplierRiskScore, Alert

# ── EXPANDED CATEGORY WEIGHTS (6 categories) ──────────────────────────────────
CATEGORY_WEIGHTS = {
    "weather":     0.30,
    "unrest":      0.25,
    "price":       0.20,
    "transport":   0.15,
    "agriculture": 0.05,
    "industrial":  0.05,
}

# ── PRODUCT CATEGORY TO RISK SENSITIVITY MAPPING ──────────────────────────────
# Some products are more sensitive to specific risk types
PRODUCT_SENSITIVITY = {
    "Rice":           {"weather": 1.4, "agriculture": 1.5, "transport": 1.2},
    "Wheat":          {"weather": 1.3, "agriculture": 1.5, "price": 1.3},
    "Sugar":          {"agriculture": 1.4, "price": 1.3, "industrial": 1.2},
    "Pulses":         {"weather": 1.2, "agriculture": 1.4, "price": 1.2},
    "Spices":         {"weather": 1.3, "agriculture": 1.3, "transport": 1.2},
    "Vegetables":     {"weather": 1.5, "price": 1.4, "transport": 1.3},
    "Dairy":          {"weather": 1.2, "transport": 1.3, "industrial": 1.1},
    "Packaged Foods": {"price": 1.2, "industrial": 1.3, "transport": 1.1},
    "Electronics":    {"industrial": 1.4, "transport": 1.3, "unrest": 1.2},
    "Textiles":       {"industrial": 1.3, "unrest": 1.2, "price": 1.1},
    "Raw Materials":  {"transport": 1.3, "industrial": 1.3, "unrest": 1.2},
    "Other":          {},
}

PRODUCT_KEYWORDS = {
    "Rice": ["rice", "paddy", "grain"],
    "Wheat": ["wheat", "atta", "flour"],
    "Sugar": ["sugar", "sugarcane", "jaggery"],
    "Pulses": ["pulse", "pulses", "dal", "lentil", "legume"],
    "Spices": ["spice", "masala", "pepper", "chilli", "turmeric", "cumin"],
    "Vegetables": ["vegetable", "vegetables", "produce", "tomato", "onion", "potato"],
    "Dairy": ["dairy", "milk", "paneer", "curd", "butter", "cheese"],
    "Packaged Foods": ["packaged", "fmcg", "grocery", "retail food"],
    "Electronics": ["electronics", "electronic", "appliance", "semiconductor", "chip"],
    "Textiles": ["textile", "garment", "fabric", "cloth", "yarn"],
    "Raw Materials": ["raw material", "raw materials", "commodity", "input material"],
    "Other": [],
}

def normalize_product_category(product_category: str) -> str:
    """
    Normalize free-form supplier product categories to scorer buckets.
    """
    text = (product_category or "").strip().lower()
    if not text:
        return "Other"

    if "rice" in text or "grain" in text:
        return "Rice"
    if "wheat" in text or "atta" in text:
        return "Wheat"
    if "sugar" in text or "jaggery" in text:
        return "Sugar"
    if "pulse" in text or "dal" in text or "lentil" in text:
        return "Pulses"
    if "spice" in text or "masala" in text:
        return "Spices"
    if "vegetable" in text or "fruit" in text or "produce" in text:
        return "Vegetables"
    if "dairy" in text or "milk" in text or "paneer" in text or "curd" in text:
        return "Dairy"
    if "packaged" in text or "fmcg" in text or "grocery" in text:
        return "Packaged Foods"
    if "electronic" in text or "appliance" in text:
        return "Electronics"
    if "textile" in text or "cloth" in text or "garment" in text:
        return "Textiles"
    if "raw material" in text:
        return "Raw Materials"
    return "Other"

def _norm(value: str) -> str:
    return (value or "").strip().lower()

def _contains_location(event_loc: str, supplier_loc: str) -> bool:
    """
    Safe containment check that avoids empty-string matches.
    """
    event_loc = _norm(event_loc)
    supplier_loc = _norm(supplier_loc)
    if not event_loc or not supplier_loc:
        return False
    return event_loc == supplier_loc or supplier_loc in event_loc or event_loc in supplier_loc

def _get_geo_match(supplier, event_location: str):
    """
    Returns (geo_weight, geo_label) for supplier-event pair.
    """
    loc = _norm(event_location)
    district = _norm(supplier.district)
    state = _norm(supplier.state)
    location = _norm(getattr(supplier, "location", ""))

    if _contains_location(loc, district):
        return 1.0, "district"
    if _contains_location(loc, state):
        return 0.6, "state"
    if _contains_location(loc, location):
        return 0.5, "location"
    if loc == "india":
        return 0.08, "national"
    return 0.0, ""

def geo_proximity(supplier_district: str, supplier_state: str, event_location: str) -> float:
    """
    Strict geographic proximity — returns 0 if no match.
    Checks district first, then state.
    """
    if not event_location or event_location in ["Unknown", "India"]:
        return 0.05  # very small weight for national-level news
    
    loc = _norm(event_location)
    district = _norm(supplier_district)
    state = _norm(supplier_state)

    # Exact district match
    if _contains_location(loc, district):
        return 1.0
    
    # State match
    if _contains_location(loc, state):
        return 0.6
    
    return 0.0

def temporal_decay(published_at: datetime) -> float:
    """Exponential decay — news older than 48hrs has zero weight."""
    if not published_at:
        return 0.0
    hours_old = (datetime.now() - published_at).total_seconds() / 3600
    if hours_old > 48:
        return 0.0
    # Fast decay — 24hr old news has ~30% weight
    return math.exp(-0.05 * hours_old)

def get_product_multiplier(product_category: str, risk_category: str) -> float:
    """Get sensitivity multiplier for product-risk combination."""
    normalized_category = normalize_product_category(product_category)
    sensitivity = PRODUCT_SENSITIVITY.get(normalized_category, {})
    return sensitivity.get(risk_category, 1.0)

def event_matches_supplier_product(supplier_product_category: str, event_title: str, event_description: str) -> bool:
    """
    Check if event text has product cues for the supplier category.
    Used to prevent the same India-level event from affecting unrelated suppliers.
    """
    normalized_category = normalize_product_category(supplier_product_category)
    keywords = PRODUCT_KEYWORDS.get(normalized_category, [])
    if not keywords:
        return False
    text = f"{event_title or ''} {event_description or ''}".lower()
    return any(keyword in text for keyword in keywords)

def calculate_risk_score(supplier, relevant: list) -> float:
    """
    Calculate composite risk score using:
    confidence × category_weight × geo_proximity × temporal_decay × product_sensitivity × 100
    """
    if not relevant:
        return 0.0

    total = 0.0
    for classified, event in relevant:
        confidence = float(classified.confidence or 0.5)
        weight = CATEGORY_WEIGHTS.get(classified.risk_category, 0.10)
        geo = geo_proximity(
            supplier.district,
            supplier.state,
            event.location_raw or ""
        )
        decay = temporal_decay(event.published_at)
        product_mult = get_product_multiplier(
            supplier.product_category or "Other",
            classified.risk_category
        )
        contribution = confidence * weight * geo * decay * product_mult * 100
        total += contribution

    return min(round(total, 2), 100.0)

def get_risk_level(score: float) -> str:
    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    elif score >= 15:
        return "low-medium"
    return "low"

def get_risk_level_normalized(score: float) -> str:
    """For DB storage — only 3 levels allowed in ENUM."""
    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    return "low"

def generate_alert_message(supplier, score, level, top_category, evidence_count):
    reasons = {
        "weather":     "weather or natural disaster events detected near supplier location",
        "unrest":      "political unrest or strike activity detected near supplier location",
        "price":       "commodity price surge or inflation signals detected",
        "transport":   "transport or road disruption detected near supplier route",
        "agriculture": "agricultural disruption or crop damage signals detected",
        "industrial":  "industrial disruption or factory shutdown signals detected",
    }
    actions = {
        "high":   "Consider stocking up immediately or identifying an alternate supplier.",
        "medium": "Monitor closely and check current stock levels.",
    }
    return (
        f"Your {supplier.product_category} supplier '{supplier.supplier_name}' "
        f"in {supplier.district}, {supplier.state} has been flagged at "
        f"{level.upper()} risk (score: {score}/100) based on {evidence_count} news signal(s). "
        f"Reason: {reasons.get(top_category, 'risk signals detected')}. "
        f"{actions.get(level, '')}"
    )

def run_scoring():
    db = SessionLocal()
    try:
        suppliers = db.query(Supplier).filter(
            Supplier.status == "active"
        ).all()
        print(f"[Scorer] Scoring {len(suppliers)} suppliers...")

        cutoff = datetime.now() - timedelta(hours=48)

        # Get ALL recent classified events once
        all_results = (
            db.query(ClassifiedRisk, RawEvent)
            .join(RawEvent, ClassifiedRisk.event_id == RawEvent.event_id)
            .filter(RawEvent.fetched_at >= cutoff)
            .all()
        )

        for supplier in suppliers:
            # ── BUILD SCORED EVENTS LIST WITH GEO WEIGHT ──────────────────
            scored_events = []

            for cr, ev in all_results:
                geo, geo_label = _get_geo_match(supplier, ev.location_raw or "")
                if geo <= 0:
                    continue  # Skip unrelated locations

                # India-level news — only include if product category is relevant
                product_mult = get_product_multiplier(
                    supplier.product_category or "Other",
                    cr.risk_category
                )
                if geo_label == "national" and product_mult < 1.2:
                    continue
                if geo_label == "national" and not event_matches_supplier_product(
                    supplier.product_category or "Other",
                    ev.title or "",
                    ev.description or "",
                ):
                    continue

                # Calculate this event's contribution to score
                confidence = float(cr.confidence or 0.5)
                weight = CATEGORY_WEIGHTS.get(cr.risk_category, 0.10)
                decay = temporal_decay(ev.published_at)
                contribution = confidence * weight * geo * decay * product_mult * 100

                scored_events.append({
                    "cr": cr,
                    "ev": ev,
                    "contribution": contribution,
                    "geo": geo,
                    "geo_label": geo_label,
                })

            # Sort by contribution — highest impact first
            scored_events.sort(key=lambda x: x["contribution"], reverse=True)

            # Total score = sum of all contributions, capped at 100
            total_score = min(
                round(sum(e["contribution"] for e in scored_events), 2),
                100.0
            )
            level_db = get_risk_level_normalized(total_score)

            # ── BUILD EVIDENCE — only articles that actually contributed ──
            evidence = []
            for item in scored_events[:5]:  # top 5 by contribution
                cr = item["cr"]
                ev = item["ev"]
                evidence.append({
                    "title": (ev.title or "")[:120],
                    "source": ev.source,
                    "location": ev.location_raw,
                    "category": cr.risk_category,
                    "confidence": float(cr.confidence or 0),
                    "contribution": round(item["contribution"], 2),
                    "geo_match": item["geo_label"],
                    "factors": {
                        "confidence": round(float(cr.confidence or 0), 3),
                        "category_weight": CATEGORY_WEIGHTS.get(cr.risk_category, 0.10),
                        "geo_weight": round(float(item["geo"]), 2),
                        "time_decay": round(float(temporal_decay(ev.published_at)), 3),
                        "product_multiplier": round(float(get_product_multiplier(supplier.product_category or "Other", cr.risk_category)), 2),
                    },
                    "url": ev.url or "",
                    "fetched_at": ev.fetched_at.isoformat() if ev.fetched_at else "",
                })

            # Delete old score, insert fresh
            db.query(SupplierRiskScore).filter(
                SupplierRiskScore.supplier_id == supplier.supplier_id
            ).delete()

            db.add(SupplierRiskScore(
                supplier_id=supplier.supplier_id,
                risk_score=total_score,
                risk_level=level_db,
                contributing_events={
                    "count": len(scored_events),
                    "evidence": evidence
                },
                scored_at=datetime.now()
            ))

            print(
                f"[Scorer] {supplier.supplier_name} "
                f"({supplier.district}, {supplier.state}) "
                f"-> {level_db} ({total_score}) "
                f"| {len(scored_events)} signals "
                f"[district:{sum(1 for e in scored_events if e['geo_label']=='district')} "
                f"state:{sum(1 for e in scored_events if e['geo_label']=='state')} "
                f"national:{sum(1 for e in scored_events if e['geo_label']=='national')}]"
            )

            # Alert if medium/high, no duplicate in 6hrs
            if level_db in ["high", "medium"] and scored_events:
                recent = db.query(Alert).filter(
                    Alert.supplier_id == supplier.supplier_id,
                    Alert.created_at >= datetime.now() - timedelta(hours=6)
                ).first()
                if not recent:
                    top = scored_events[0]
                    db.add(Alert(
                        user_id=supplier.user_id,
                        supplier_id=supplier.supplier_id,
                        message=generate_alert_message(
                            supplier,
                            total_score,
                            level_db,
                            top["cr"].risk_category,
                            len(scored_events)
                        ),
                        alert_type="inapp",
                        is_read=0
                    ))
                    print(f"[Scorer] Alert: {supplier.supplier_name}")

        db.commit()
        print("[Scorer] Complete.")
    except Exception as e:
        print(f"[Scorer] Error: {e}")
        db.rollback()
    finally:
        db.close()