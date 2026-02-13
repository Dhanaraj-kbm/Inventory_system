from fastapi import FastAPI

from app.core.database import engine, Base
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem
from app.models.supplier import Supplier, Purchase

from app.routes.product_routes import router as product_router
from app.routes.billing_routes import router as billing_router
from app.routes.supplier_routes import router as supplier_router
from app.models.user import User
from app.routes.auth_routes import router as auth_router
from app.routes.dashboard_routes import router as dashboard_router


# 👉 CREATE APP FIRST
app = FastAPI()


# 👉 CREATE TABLES
Base.metadata.create_all(bind=engine)


# 👉 REGISTER ROUTES
app.include_router(product_router)
app.include_router(billing_router)
app.include_router(supplier_router)
app.include_router(auth_router)
app.include_router(dashboard_router)


@app.get("/")
def home():
    return {"message": "Inventory backend running 🚀"}
