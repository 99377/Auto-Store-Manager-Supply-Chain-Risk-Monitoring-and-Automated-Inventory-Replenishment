from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.risk import SupplierRiskScore, Alert
from app.models.supplier import Supplier
from app.utils.auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.pipeline.scheduler import run_full_pipeline

router = APIRouter(prefix="/api", tags=["Risks"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

@router.get("/risks/{supplier_id}")
def get_supplier_risk(supplier_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    score = (
        db.query(SupplierRiskScore)
        .filter(SupplierRiskScore.supplier_id == supplier_id)
        .order_by(SupplierRiskScore.scored_at.desc())
        .first()
    )
    if not score:
        return {"supplier_id": supplier_id, "risk_score": 0, "risk_level": "low", "scored_at": None}
    return {
        "supplier_id": score.supplier_id,
        "risk_score": float(score.risk_score),
        "risk_level": score.risk_level,
        "contributing_events": score.contributing_events,
        "scored_at": score.scored_at
    }

@router.get("/risks")
def get_all_risks(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    suppliers = db.query(Supplier).filter(Supplier.user_id == user_id).all()
    result = []
    for supplier in suppliers:
        score = (
            db.query(SupplierRiskScore)
            .filter(SupplierRiskScore.supplier_id == supplier.supplier_id)
            .order_by(SupplierRiskScore.scored_at.desc())
            .first()
        )
        result.append({
            "supplier_id": supplier.supplier_id,
            "supplier_name": supplier.supplier_name,
            "district": supplier.district,
            "state": supplier.state,
            "product_category": supplier.product_category,
            "risk_score": float(score.risk_score) if score else 0,
            "risk_level": score.risk_level if score else "low",
            "scored_at": score.scored_at if score else None,
            "evidence": score.contributing_events.get("evidence", []) if score and score.contributing_events else [],
            "evidence_count": score.contributing_events.get("count", 0) if score and score.contributing_events else 0,
        })
    return result

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    alerts = (
        db.query(Alert)
        .filter(Alert.user_id == user_id)
        .order_by(Alert.created_at.desc())
        .all()
    )
    return alerts

@router.put("/alerts/{alert_id}/read")
def mark_read(alert_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = 1
    db.commit()
    return {"message": "Marked as read"}

@router.post("/pipeline/trigger")
def trigger_pipeline(user=Depends(get_current_user)):
    """Manually trigger the full pipeline."""
    import threading
    thread = threading.Thread(target=run_full_pipeline)
    thread.start()
    return {"message": "Pipeline triggered. Results will be ready in ~60 seconds."}