from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from app.database import Base


class SupplyOrder(Base):
    __tablename__ = "supply_orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("inventory_products.product_id", ondelete="SET NULL"))
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id", ondelete="SET NULL"))
    product_name = Column(String(200), nullable=False)
    category = Column(String(100), default="")
    quantity_ordered = Column(DECIMAL(12, 2), nullable=False)
    unit = Column(String(20), default="pcs")
    unit_price = Column(DECIMAL(10, 2), default=0)
    total_price = Column(DECIMAL(12, 2), default=0)
    status = Column(String(30), default="placed")
    auto_created = Column(Integer, default=1)
    created_at = Column(DateTime, default=func.now())


class SupplierProductCatalog(Base):
    __tablename__ = "supplier_product_catalog"

    catalog_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(200), nullable=False)
    unit_price = Column(DECIMAL(10, 2), default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
