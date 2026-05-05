from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone_number: str = ""
    address: str = ""
    password: str
    business_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    normalized_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=req.name,
        email=normalized_email,
        phone_number=(req.phone_number or "").strip(),
        address=(req.address or "").strip(),
        password_hash=hash_password(req.password),
        business_name=req.business_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": user.email,
            "phone_number": user.phone_number or "",
            "address": user.address or "",
            "business_name": user.business_name or "",
            "role": user.role,
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.strip().lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {
        "token": token,
        "user": {
            "name": user.name,
            "email": user.email,
            "phone_number": user.phone_number or "",
            "address": user.address or "",
            "business_name": user.business_name or "",
            "role": user.role,
        }
    }