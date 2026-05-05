from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from decimal import Decimal

from app.database import get_db
from app.models.supplier import Supplier
from app.models.inventory import ShopSettings, InventoryProduct
from app.models.order_supply import SupplyOrder, SupplierProductCatalog
from app.utils.auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.order_supplies import maybe_auto_order_for_product


router = APIRouter(prefix="/api/order-supplies", tags=["Order Supplies"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


class SupplierConfigItem(BaseModel):
    supplier_id: int
    unit_price: float
    auto_order_enabled: int


class OrderSuppliesConfigUpdate(BaseModel):
    auto_order_enabled: int
    suppliers: List[SupplierConfigItem]


class ProductThresholdUpdate(BaseModel):
    product_id: int
    threshold_qty: float


class ThresholdBatchUpdate(BaseModel):
    items: List[ProductThresholdUpdate]


class CatalogItem(BaseModel):
    supplier_id: int
    product_name: str
    unit_price: float


class CatalogBatchUpdate(BaseModel):
    items: List[CatalogItem]


@router.get("/config")
def get_config(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    settings = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    suppliers = (
        db.query(Supplier)
        .filter(Supplier.user_id == user_id)
        .order_by(Supplier.supplier_name.asc())
        .all()
    )
    return {
        "auto_order_enabled": int(settings.auto_order_enabled) if settings else 1,
        "suppliers": [
            {
                "supplier_id": s.supplier_id,
                "supplier_name": s.supplier_name,
                "product_category": s.product_category,
                "unit_price": float(s.unit_price or 0),
                "auto_order_enabled": int(s.auto_order_enabled or 0),
                "status": s.status,
            }
            for s in suppliers
        ],
    }


@router.get("/catalog")
def get_catalog(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    rows = (
        db.query(SupplierProductCatalog, Supplier.supplier_name)
        .join(Supplier, Supplier.supplier_id == SupplierProductCatalog.supplier_id)
        .filter(SupplierProductCatalog.user_id == user_id)
        .order_by(Supplier.supplier_name.asc(), SupplierProductCatalog.product_name.asc())
        .all()
    )
    return [
        {
            "catalog_id": cat.catalog_id,
            "supplier_id": cat.supplier_id,
            "supplier_name": supplier_name,
            "product_name": cat.product_name,
            "unit_price": float(cat.unit_price or 0),
        }
        for cat, supplier_name in rows
    ]


@router.put("/config")
def update_config(req: OrderSuppliesConfigUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    settings = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    if settings:
        settings.auto_order_enabled = int(bool(req.auto_order_enabled))
    else:
        settings = ShopSettings(
            user_id=user_id,
            shop_name="",
            shop_type="",
            shop_address="",
            auto_order_enabled=int(bool(req.auto_order_enabled)),
        )
        db.add(settings)

    for x in req.suppliers:
        supplier = (
            db.query(Supplier)
            .filter(Supplier.user_id == user_id, Supplier.supplier_id == x.supplier_id)
            .first()
        )
        if supplier:
            supplier.unit_price = Decimal(str(max(0, x.unit_price)))
            supplier.auto_order_enabled = int(bool(x.auto_order_enabled))
    db.commit()
    return {"message": "Order supplies configuration saved"}


@router.get("/orders")
def list_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    rows = (
        db.query(SupplyOrder, Supplier.supplier_name)
        .outerjoin(Supplier, Supplier.supplier_id == SupplyOrder.supplier_id)
        .filter(SupplyOrder.user_id == user_id)
        .order_by(SupplyOrder.created_at.desc())
        .limit(200)
        .all()
    )
    result = []
    for order, supplier_name in rows:
        result.append(
            {
                "order_id": order.order_id,
                "product_name": order.product_name,
                "category": order.category,
                "quantity_ordered": float(order.quantity_ordered or 0),
                "unit": order.unit,
                "unit_price": float(order.unit_price or 0),
                "total_price": float(order.total_price or 0),
                "status": order.status,
                "auto_created": int(order.auto_created or 0),
                "supplier_name": supplier_name or "Unknown supplier",
                "created_at": order.created_at,
            }
        )
    return result


@router.put("/thresholds")
def update_thresholds(req: ThresholdBatchUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    for x in req.items:
        product = (
            db.query(InventoryProduct)
            .filter(InventoryProduct.user_id == user_id, InventoryProduct.product_id == x.product_id)
            .first()
        )
        if product:
            product.threshold_qty = Decimal(str(max(0, x.threshold_qty)))
    db.commit()
    return {"message": "Thresholds updated"}


@router.post("/process-auto-orders")
def process_auto_orders(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    products = db.query(InventoryProduct).filter(InventoryProduct.user_id == user_id).all()
    created = 0
    for p in products:
        order = maybe_auto_order_for_product(db, user_id, p)
        if order:
            created += 1
    db.commit()
    return {"message": "Auto-order scan complete", "orders_created": created}


@router.put("/catalog")
def update_catalog(req: CatalogBatchUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    db.query(SupplierProductCatalog).filter(SupplierProductCatalog.user_id == user_id).delete()
    for item in req.items:
        if not item.product_name.strip():
            continue
        valid_supplier = (
            db.query(Supplier)
            .filter(Supplier.user_id == user_id, Supplier.supplier_id == item.supplier_id)
            .first()
        )
        if not valid_supplier:
            continue
        db.add(
            SupplierProductCatalog(
                user_id=user_id,
                supplier_id=item.supplier_id,
                product_name=item.product_name.strip(),
                unit_price=Decimal(str(max(0, item.unit_price))),
            )
        )
    db.commit()
    return {"message": "Supplier product catalog saved"}
