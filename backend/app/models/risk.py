from sqlalchemy import Column, Integer, String, Enum, DateTime, DECIMAL, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from app.database import Base

class RawEvent(Base):
    __tablename__ = "raw_events"

    event_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    source = Column(Enum("newsapi", "gdelt", "owm"), nullable=False)
    title = Column(Text)
    description = Column(Text)
    location_raw = Column(String(200))
    published_at = Column(DateTime)
    fetched_at = Column(DateTime, default=func.now())
    url = Column(Text)

class ClassifiedRisk(Base):
    __tablename__ = "classified_risks"

    risk_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("raw_events.event_id"), nullable=False)
    risk_category = Column(Enum("weather", "unrest", "price", "transport",'agriculture','industrial'), nullable=False)
    confidence = Column(DECIMAL(4, 3))
    classifier_used = Column(Enum("distilbert", "zeroshot"), default="zeroshot")
    classified_at = Column(DateTime, default=func.now())

class SupplierRiskScore(Base):
    __tablename__ = "supplier_risk_scores"

    score_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=False)
    risk_score = Column(DECIMAL(5, 2), default=0.00)
    risk_level = Column(Enum("low", "medium", "high"), default="low")
    contributing_events = Column(JSON)
    scored_at = Column(DateTime, default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=False)
    message = Column(Text)
    alert_type = Column(Enum("email", "inapp"), default="inapp")
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())