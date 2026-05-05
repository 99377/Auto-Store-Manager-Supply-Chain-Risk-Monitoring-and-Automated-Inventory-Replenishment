from transformers import pipeline
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.risk import RawEvent, ClassifiedRisk

# ── 6 RISK CATEGORIES (expanded from 4) ───────────────────────────────────────
CANDIDATE_LABELS = [
    "flood storm cyclone earthquake natural disaster weather emergency",
    "strike protest bandh shutdown political unrest civil disturbance",
    "price rise inflation commodity shortage food price surge",
    "highway blocked road closed transport disruption logistics delay",
    "crop damage harvest failure agricultural loss food production",
    "factory shutdown power cut industrial disruption supply shortage",
]

LABEL_MAP = {
    0: "weather",
    1: "unrest",
    2: "price",
    3: "transport",
    4: "agriculture",
    5:"industrial",
}

# ── KEYWORD MATCHING FOR FAST PRE-CLASSIFICATION ───────────────────────────────
RISK_KEYWORDS = {
    "weather": [
        "flood", "cyclone", "storm", "drought", "rain", "earthquake",
        "landslide", "heatwave", "weather alert", "thunderstorm",
        "cloudburst", "inundation", "waterlogging", "submerged",
        "heavy rainfall", "snowfall", "cold wave", "heat wave"
    ],
    "unrest": [
        "strike", "protest", "bandh", "shutdown", "blockade", "riot",
        "unrest", "agitation", "demonstration", "curfew", "violence",
        "tension", "clash", "farmer protest", "trucker", "indefinite strike"
    ],
    "price": [
        "price rise", "inflation", "price hike", "commodity", "fuel price",
        "rate hike", "surge", "shortage", "expensive", "costly",
        "onion price", "tomato price", "wheat price", "rice price",
        "vegetable price", "edible oil", "petrol price", "diesel price",
        "price increase", "food inflation", "msp"
    ],
    "transport": [
        "highway blocked", "road closed", "transport", "rail disruption",
        "truck", "highway", "traffic", "route blocked", "freight",
        "port congestion", "supply chain", "logistics", "road blockade",
        "rail strike", "air cargo", "shipping delay"
    ],
    "agriculture": [
        "crop damage", "harvest", "agriculture", "farmer", "kisan",
        "crop failure", "pest attack", "locust", "yield", "sowing",
        "irrigation", "drought crop", "rabi", "kharif", "paddy",
        "wheat crop", "sugarcane", "cotton crop", "crop loss"
    ],
    "industrial": [
        "factory", "plant shutdown", "power cut", "electricity",
        "industrial", "manufacturing", "production halt", "mill",
        "refinery", "coal shortage", "gas supply", "power outage",
        "industrial accident", "explosion", "fire factory"
    ],
}

_classifier = None

def get_classifier():
    global _classifier
    if _classifier is None:
        print("[Classifier] Loading zero-shot model...")
        _classifier = pipeline(
            "zero-shot-classification",
            model="facebook/bart-large-mnli",
            device=-1
        )
        print("[Classifier] Model loaded.")
    return _classifier

def keyword_classify(text: str):
    """Fast keyword-based classification."""
    text_lower = text.lower()
    scores = {cat: 0 for cat in RISK_KEYWORDS}
    for cat, keywords in RISK_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[cat] += 1
    best = max(scores, key=scores.get)
    if scores[best] > 0:
        confidence = min(0.85, 0.5 + scores[best] * 0.1)
        return best, confidence
    return None, 0.0

def is_india_related(text: str) -> bool:
    """Check if article is India-related."""
    india_terms = [
        "india", "indian", "delhi", "mumbai", "bengaluru", "bangalore",
        "kolkata", "chennai", "hyderabad", "pune", "ahmedabad", "patna",
        "lucknow", "jaipur", "bhopal", "state", "district", "rupee",
        "crore", "lakh", "pm modi", "minister", "bjp", "congress"
    ]
    text_lower = text.lower()
    return any(term in text_lower for term in india_terms)

def classify_event(title: str, description: str, location_raw: str = "", source: str = ""):
    """Classify article — keyword first, then zero-shot NLP."""
    text = f"{title}. {description}".strip()

    # If ingestion already mapped to an India location, treat as India-related.
    # This avoids dropping valid risk events whose titles do not explicitly contain India terms.
    location_norm = (location_raw or "").strip().lower()
    india_by_location = location_norm not in ("", "unknown")

    # Skip clearly non-India articles only when both text and location fail India checks.
    if not india_by_location and not is_india_related(text):
        return None, 0.0

    # Keyword classification (fast)
    category, confidence = keyword_classify(text)
    if confidence >= 0.6:
        return category, confidence

    # Zero-shot NLP fallback
    try:
        clf = get_classifier()
        result = clf(text[:512], CANDIDATE_LABELS, multi_label=False)
        top_score = result["scores"][0]
        top_label = result["labels"][0]
        idx = CANDIDATE_LABELS.index(top_label)
        mapped = LABEL_MAP[idx]

        # If event already passed ingestion risk filters, keep it with relaxed floor.
        curated_source = (source or "").lower() in {"newsapi", "gdelt", "owm"}
        if top_score < 0.35 and not curated_source:
            return None, 0.0

        return mapped, round(max(top_score, 0.30), 3)
    except Exception as e:
        print(f"[Classifier] Error: {e}")
        return category, confidence

def run_classification():
    """Classify all recent unclassified events."""
    db = SessionLocal()
    classified = 0
    skipped = 0
    try:
        cutoff = datetime.now() - timedelta(hours=48)
        classified_ids = [r.event_id for r in db.query(ClassifiedRisk).all()]

        query = db.query(RawEvent).filter(RawEvent.fetched_at >= cutoff)
        if classified_ids:
            query = query.filter(~RawEvent.event_id.in_(classified_ids))
        events = query.all()

        print(f"[Classifier] Processing {len(events)} new events...")

        for event in events:
            title = event.title or ""
            description = event.description or ""
            category, confidence = classify_event(
                title,
                description,
                event.location_raw or "",
                event.source or "",
            )

            if category and confidence >= 0.30:
                db.add(ClassifiedRisk(
                    event_id=event.event_id,
                    risk_category=category,
                    confidence=confidence,
                    classifier_used="zeroshot"
                ))
                classified += 1
            else:
                skipped += 1

        db.commit()
        print(f"[Classifier] Classified: {classified}, Skipped (not risk-relevant): {skipped}")
    except Exception as e:
        print(f"[Classifier] Error: {e}")
        db.rollback()
    finally:
        db.close()
    return classified