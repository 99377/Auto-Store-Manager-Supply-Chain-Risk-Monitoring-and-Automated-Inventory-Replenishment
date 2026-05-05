from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes.auth import router as auth_router
from app.routes.suppliers import router as suppliers_router
from app.routes.risks import router as risks_router
from app.routes.inventory import router as inventory_router
from app.routes.order_supplies import router as order_supplies_router
import app.models.inventory  # noqa: F401 — register ORM tables on Base
import app.models.order_supply  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Auto Store Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(suppliers_router)
app.include_router(risks_router)
app.include_router(inventory_router)
app.include_router(order_supplies_router)

@app.on_event("startup")
def startup_event():
    from app.pipeline.scheduler import start_scheduler
    start_scheduler()

@app.get("/")
def root():
    return {"message": "Auto Store Manager API is running", "status": "ok"}
