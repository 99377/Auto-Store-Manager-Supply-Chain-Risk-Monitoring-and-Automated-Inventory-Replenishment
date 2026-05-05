from sqlalchemy import Column, Integer, String, Enum, DateTime, DECIMAL, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    supplier_name = Column(String(150), nullable=False)
    email = Column(String(150), default="")
    phone_number = Column(String(30), default="")
    location = Column(String(200))
    district = Column(String(100))
    state = Column(String(100))
    latitude = Column(DECIMAL(9, 6))
    longitude = Column(DECIMAL(9, 6))
    product_category = Column(String(100))
    unit_price = Column(DECIMAL(10, 2), default=0)
    auto_order_enabled = Column(Integer, default=1)
    status = Column(Enum("active", "inactive"), default="active")
    created_at = Column(DateTime, default=func.now())