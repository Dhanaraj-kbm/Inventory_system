from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

from app.core.database import engine, Base

# Import models so tables get created
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem
from app.models.supplier import Supplier, Purchase
from app.models.user import User

# Import routes
from app.routes.product_routes import router as product_router
from app.routes.supplier_routes import router as supplier_router
from app.routes.auth_routes import router as auth_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.invoice_routes import router as invoice_router


# Create FastAPI app
app = FastAPI()
# ADD THIS BLOCK ↓↓↓
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


# Register routes
app.include_router(product_router)
app.include_router(supplier_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(invoice_router)


@app.get("/")
def home():
    return {"message": "Inventory backend running 🚀"}
