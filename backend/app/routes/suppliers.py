from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.supplier import Supplier
from app.utils.auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/suppliers", tags=["Suppliers"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

class SupplierCreate(BaseModel):
    supplier_name: str
    email: str = ""
    phone_number: str = ""
    location: str
    district: str
    state: str
    product_category: str
    unit_price: Optional[float] = 0
    auto_order_enabled: Optional[int] = 1

class SupplierUpdate(BaseModel):
    supplier_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    location: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    product_category: Optional[str] = None
    unit_price: Optional[float] = None
    auto_order_enabled: Optional[int] = None
    status: Optional[str] = None

@router.get("/")
def get_suppliers(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    suppliers = db.query(Supplier).filter(Supplier.user_id == user_id).all()
    return suppliers

@router.post("/")
def create_supplier(req: SupplierCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    supplier = Supplier(
        user_id=user_id,
        supplier_name=req.supplier_name,
        email=(req.email or "").strip(),
        phone_number=(req.phone_number or "").strip(),
        location=req.location,
        district=req.district,
        state=req.state,
        product_category=req.product_category,
        unit_price=req.unit_price or 0,
        auto_order_enabled=1 if req.auto_order_enabled is None else int(bool(req.auto_order_enabled)),
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}")
def update_supplier(supplier_id: int, req: SupplierUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id,
        Supplier.user_id == user_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in req.dict(exclude_none=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id,
        Supplier.user_id == user_id
    ).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted"}