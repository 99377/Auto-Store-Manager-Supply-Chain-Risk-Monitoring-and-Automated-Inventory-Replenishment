from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, DECIMAL
from sqlalchemy.sql import func
from app.database import Base


class ShopSettings(Base):
    __tablename__ = "shop_settings"

    settings_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    shop_name = Column(String(200), nullable=False, default="")
    shop_type = Column(String(120), nullable=False, default="")
    shop_address = Column(String(255), nullable=False, default="")
    auto_order_enabled = Column(Integer, default=1)


class InventoryProduct(Base):
    __tablename__ = "inventory_products"

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    product_name = Column(String(200), nullable=False)
    category = Column(String(100), default="")
    quantity = Column(DECIMAL(12, 2), default=0)
    threshold_qty = Column(DECIMAL(12, 2), default=10)
    unit = Column(String(20), default="pcs")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class BillingIntegration(Base):
    __tablename__ = "billing_integrations"

    integration_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), unique=True, nullable=False)
    machine_name = Column(String(150), nullable=False, default="")
    machine_token = Column(String(128), unique=True, nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
