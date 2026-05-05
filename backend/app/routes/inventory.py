from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
import secrets

from app.database import get_db
from app.models.inventory import ShopSettings, InventoryProduct, BillingIntegration
from app.services.order_supplies import maybe_auto_order_for_product
from app.utils.auth import decode_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(tags=["Inventory"])
security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


class ShopSettingsUpdate(BaseModel):
    shop_name: str
    shop_type: str
    shop_address: str = ""
    auto_order_enabled: int = 1


class ProductOut(BaseModel):
    product_id: int
    product_name: str
    category: str
    quantity: float
    threshold_qty: float
    unit: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    product_name: str
    category: str = ""
    quantity: float = 0
    threshold_qty: float = 10
    unit: str = "pcs"


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    quantity_delta: Optional[float] = None
    threshold_qty: Optional[float] = None
    unit: Optional[str] = None


class ProductSale(BaseModel):
    quantity_sold: float


class BillingSaleItem(BaseModel):
    product_name: str
    quantity_sold: float


class BillingSyncRequest(BaseModel):
    items: List[BillingSaleItem]


class BillingIntegrationUpdate(BaseModel):
    machine_name: str = ""
    regenerate_token: bool = False


def _apply_sale(db: Session, user_id: int, product_name: str, quantity_sold: float):
    sold = Decimal(str(quantity_sold))
    if sold <= 0:
        return {"product_name": product_name, "status": "error", "message": "quantity_sold must be > 0"}

    item = (
        db.query(InventoryProduct)
        .filter(
            InventoryProduct.user_id == user_id,
            func.lower(InventoryProduct.product_name) == product_name.strip().lower(),
        )
        .first()
    )
    if not item:
        return {"product_name": product_name, "status": "error", "message": "product not found"}

    current_qty = Decimal(str(item.quantity or 0))
    if sold > current_qty:
        return {
            "product_name": product_name,
            "status": "error",
            "message": f"insufficient stock (current {current_qty})",
        }

    item.quantity = current_qty - sold
    maybe_auto_order_for_product(db, user_id, item)
    return {
        "product_name": item.product_name,
        "status": "ok",
        "new_quantity": float(item.quantity),
    }


@router.get("/api/shop/settings")
def get_shop_settings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    row = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    if not row:
        return {"shop_name": "", "shop_type": "", "shop_address": "", "auto_order_enabled": 1}
    return {
        "shop_name": row.shop_name or "",
        "shop_type": row.shop_type or "",
        "shop_address": row.shop_address or "",
        "auto_order_enabled": int(row.auto_order_enabled or 0),
    }


@router.put("/api/shop/settings")
def upsert_shop_settings(req: ShopSettingsUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    row = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    if row:
        row.shop_name = req.shop_name.strip()
        row.shop_type = req.shop_type.strip()
        row.shop_address = (req.shop_address or "").strip()
        row.auto_order_enabled = int(bool(req.auto_order_enabled))
    else:
        row = ShopSettings(
            user_id=user_id,
            shop_name=req.shop_name.strip(),
            shop_type=req.shop_type.strip(),
            shop_address=(req.shop_address or "").strip(),
            auto_order_enabled=int(bool(req.auto_order_enabled)),
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "shop_name": row.shop_name,
        "shop_type": row.shop_type,
        "shop_address": row.shop_address or "",
        "auto_order_enabled": int(row.auto_order_enabled or 0),
    }


@router.get("/api/inventory/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    rows = (
        db.query(InventoryProduct)
        .filter(InventoryProduct.user_id == user_id)
        .order_by(InventoryProduct.product_name.asc())
        .all()
    )
    return rows


@router.post("/api/inventory/products", response_model=ProductOut)
def create_product(req: ProductCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    if not req.product_name or not req.product_name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    item = InventoryProduct(
        user_id=user_id,
        product_name=req.product_name.strip(),
        category=(req.category or "").strip(),
        quantity=Decimal(str(req.quantity)),
        threshold_qty=Decimal(str(req.threshold_qty if req.threshold_qty is not None else 10)),
        unit=(req.unit or "pcs").strip() or "pcs",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/api/inventory/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    req: ProductUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    user_id = int(user["sub"])
    item = (
        db.query(InventoryProduct)
        .filter(InventoryProduct.product_id == product_id, InventoryProduct.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    data = req.model_dump(exclude_unset=True)
    if "product_name" in data and data["product_name"] is not None:
        item.product_name = data["product_name"].strip()
    if "category" in data:
        item.category = (data["category"] or "").strip()
    if "quantity" in data and data["quantity"] is not None:
        item.quantity = Decimal(str(data["quantity"]))
    if "quantity_delta" in data and data["quantity_delta"] is not None:
        delta = Decimal(str(data["quantity_delta"]))
        base_qty = Decimal(str(item.quantity or 0))
        item.quantity = max(Decimal("0"), base_qty + delta)
    if "threshold_qty" in data and data["threshold_qty"] is not None:
        item.threshold_qty = Decimal(str(data["threshold_qty"]))
    if "unit" in data and data["unit"] is not None:
        item.unit = (data["unit"] or "").strip() or "pcs"
    maybe_auto_order_for_product(db, user_id, item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/inventory/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    item = (
        db.query(InventoryProduct)
        .filter(InventoryProduct.product_id == product_id, InventoryProduct.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(item)
    db.commit()
    return {"message": "Product removed"}


@router.post("/api/inventory/products/{product_id}/sell", response_model=ProductOut)
def sell_product(
    product_id: int,
    req: ProductSale,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    user_id = int(user["sub"])
    item = (
        db.query(InventoryProduct)
        .filter(InventoryProduct.product_id == product_id, InventoryProduct.user_id == user_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")

    sold = Decimal(str(req.quantity_sold))
    if sold <= 0:
        raise HTTPException(status_code=400, detail="Sold quantity must be greater than 0")

    current_qty = Decimal(str(item.quantity or 0))
    if sold > current_qty:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock. Current quantity is {current_qty}",
        )

    item.quantity = current_qty - sold
    maybe_auto_order_for_product(db, user_id, item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/api/billing/integration")
def get_billing_integration(db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_id = int(user["sub"])
    row = db.query(BillingIntegration).filter(BillingIntegration.user_id == user_id).first()
    if not row:
        token = f"wt_{secrets.token_urlsafe(24)}"
        row = BillingIntegration(user_id=user_id, machine_name="", machine_token=token)
        db.add(row)
        db.commit()
        db.refresh(row)
    return {
        "machine_name": row.machine_name or "",
        "machine_token": row.machine_token,
        "sync_url": "/api/billing/sync/machine",
    }


@router.put("/api/billing/integration")
def upsert_billing_integration(
    req: BillingIntegrationUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    user_id = int(user["sub"])
    row = db.query(BillingIntegration).filter(BillingIntegration.user_id == user_id).first()
    if not row:
        row = BillingIntegration(
            user_id=user_id,
            machine_name=req.machine_name.strip(),
            machine_token=f"wt_{secrets.token_urlsafe(24)}",
        )
        db.add(row)
    else:
        row.machine_name = req.machine_name.strip()
        if req.regenerate_token:
            row.machine_token = f"wt_{secrets.token_urlsafe(24)}"
    db.commit()
    db.refresh(row)
    return {
        "machine_name": row.machine_name or "",
        "machine_token": row.machine_token,
        "sync_url": "/api/billing/sync/machine",
    }


@router.post("/api/billing/sync/manual")
def sync_billing_manual(
    req: BillingSyncRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    user_id = int(user["sub"])
    if not req.items:
        raise HTTPException(status_code=400, detail="No bill items provided")

    results = []
    for x in req.items:
        results.append(_apply_sale(db, user_id, x.product_name, x.quantity_sold))
    db.commit()
    return {
        "total_items": len(results),
        "updated": len([r for r in results if r["status"] == "ok"]),
        "failed": len([r for r in results if r["status"] != "ok"]),
        "results": results,
    }


@router.post("/api/billing/sync/machine")
def sync_billing_machine(
    req: BillingSyncRequest,
    db: Session = Depends(get_db),
    x_machine_token: Optional[str] = Header(default=None),
):
    if not x_machine_token:
        raise HTTPException(status_code=401, detail="Missing machine token")

    integration = (
        db.query(BillingIntegration)
        .filter(BillingIntegration.machine_token == x_machine_token.strip())
        .first()
    )
    if not integration:
        raise HTTPException(status_code=401, detail="Invalid machine token")

    if not req.items:
        raise HTTPException(status_code=400, detail="No bill items provided")

    user_id = integration.user_id
    results = []
    for x in req.items:
        results.append(_apply_sale(db, user_id, x.product_name, x.quantity_sold))
    db.commit()
    return {
        "total_items": len(results),
        "updated": len([r for r in results if r["status"] == "ok"]),
        "failed": len([r for r in results if r["status"] != "ok"]),
        "results": results,
    }
