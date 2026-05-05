from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.inventory import ShopSettings, InventoryProduct
from app.models.supplier import Supplier
from app.models.risk import Alert
from app.models.order_supply import SupplyOrder, SupplierProductCatalog
from app.models.user import User
from app.services.notifications import send_email_notification


def _to_decimal(v, default="0"):
    try:
        return Decimal(str(v))
    except Exception:
        return Decimal(default)


def maybe_auto_order_for_product(db: Session, user_id: int, product: InventoryProduct):
    settings = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    if settings and int(settings.auto_order_enabled or 0) == 0:
        return None

    qty = _to_decimal(product.quantity, "0")
    threshold = _to_decimal(product.threshold_qty, "10")
    if qty >= threshold:
        return None

    # Preferred: exact product-level catalog matching.
    catalog_rows = (
        db.query(SupplierProductCatalog, Supplier)
        .join(Supplier, Supplier.supplier_id == SupplierProductCatalog.supplier_id)
        .filter(
            SupplierProductCatalog.user_id == user_id,
            func.lower(SupplierProductCatalog.product_name) == (product.product_name or "").strip().lower(),
            Supplier.user_id == user_id,
            Supplier.status == "active",
            Supplier.auto_order_enabled == 1,
        )
        .all()
    )
    candidates = [
        (cat, sup)
        for cat, sup in catalog_rows
        if _to_decimal(cat.unit_price, "0") > 0
    ]

    # Fallback: if no exact product catalog row exists, allow supplier-level auto-order
    # using supplier unit price so individual products can still auto-order.
    if not candidates:
        supplier_rows = (
            db.query(Supplier)
            .filter(
                Supplier.user_id == user_id,
                Supplier.status == "active",
                Supplier.auto_order_enabled == 1,
            )
            .all()
        )
        category = (product.category or "").strip().lower()
        category_matched = [
            s for s in supplier_rows
            if category and category in (s.product_category or "").strip().lower()
        ]
        pool = category_matched or supplier_rows
        candidates = [
            (None, sup)
            for sup in pool
            if _to_decimal(sup.unit_price, "0") > 0
        ]
        if not candidates:
            return None

    best_catalog, best_supplier = min(
        candidates,
        key=lambda tup: _to_decimal(tup[0].unit_price if tup[0] is not None else tup[1].unit_price, "0")
    )

    target_stock = threshold * Decimal("2")
    qty_to_order = max(Decimal("1"), target_stock - qty)
    unit_price_source = best_catalog.unit_price if best_catalog is not None else best_supplier.unit_price
    unit_price = _to_decimal(unit_price_source, "0")
    total_price = qty_to_order * unit_price

    # Alert before placing order
    pre_msg = (
        f"Auto-order check: '{product.product_name}' stock is {float(qty)} (threshold {float(threshold)}). "
        f"Preparing order with best-price supplier '{best_supplier.supplier_name}' @ {float(unit_price):.2f}/{product.unit}."
    )
    db.add(
        Alert(
            user_id=user_id,
            supplier_id=best_supplier.supplier_id,
            message=pre_msg,
            alert_type="inapp",
            is_read=0,
        )
    )

    order = SupplyOrder(
        user_id=user_id,
        product_id=product.product_id,
        supplier_id=best_supplier.supplier_id,
        product_name=product.product_name,
        category=product.category or "",
        quantity_ordered=qty_to_order,
        unit=product.unit or "pcs",
        unit_price=unit_price,
        total_price=total_price,
        status="placed",
        auto_created=1,
    )
    db.add(order)

    # Build notification content with full order + shop details.
    owner = db.query(User).filter(User.user_id == user_id).first()
    shop = db.query(ShopSettings).filter(ShopSettings.user_id == user_id).first()
    shop_name = (shop.shop_name if shop and shop.shop_name else owner.business_name if owner else "") or "Shop"
    owner_name = owner.name if owner and owner.name else "Owner"
    shop_address = (
        (shop.shop_address if shop and shop.shop_address else "")
        or (owner.address if owner and owner.address else "")
        or "Address not provided"
    )
    owner_phone = owner.phone_number if owner and owner.phone_number else ""
    owner_email = owner.email if owner and owner.email else ""

    order_lines = [
        f"Product: {product.product_name}",
        f"Quantity: {float(qty_to_order)} {product.unit}",
        f"Unit price: {float(unit_price):.2f}",
        f"Total price: {float(total_price):.2f}",
    ]
    order_text = "\n".join(order_lines)

    email_subject = f"New Auto Order from {shop_name}"
    email_body = (
        "A new auto-replenishment order was generated.\n\n"
        f"Shop Name: {shop_name}\n"
        f"Owner Name: {owner_name}\n"
        f"Owner Email: {owner_email or 'N/A'}\n"
        f"Owner Phone: {owner_phone or 'N/A'}\n"
        f"Shop Address: {shop_address}\n\n"
        "Order Details:\n"
        f"{order_text}\n"
    )
    email_ok, email_status = send_email_notification(best_supplier.email or "", email_subject, email_body)

    notification_msg = (
        f"Supplier notifications status for '{best_supplier.supplier_name}': "
        f"email={'sent' if email_ok else 'failed'} ({email_status})."
    )
    db.add(
        Alert(
            user_id=user_id,
            supplier_id=best_supplier.supplier_id,
            message=notification_msg,
            alert_type="inapp",
            is_read=0,
        )
    )

    post_msg = (
        f"Auto-order placed: {float(qty_to_order)} {product.unit} of '{product.product_name}' "
        f"to supplier '{best_supplier.supplier_name}' (best price {float(unit_price):.2f})."
    )
    db.add(
        Alert(
            user_id=user_id,
            supplier_id=best_supplier.supplier_id,
            message=post_msg,
            alert_type="inapp",
            is_read=0,
        )
    )

    return order
