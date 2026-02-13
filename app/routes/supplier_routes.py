from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.supplier import Supplier, Purchase
from app.models.product import Product
from app.schemas.supplier_schema import SupplierCreate
from app.schemas.purchase_schema import PurchaseCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/suppliers")
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Supplier(**data.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.post("/purchase")
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == data.product_id).first()

    if not product:
        return {"error": "Product not found"}

    product.stock += data.quantity

    purchase = Purchase(**data.dict())
    db.add(purchase)
    db.commit()

    return {
        "message": "Stock updated",
        "new_stock": product.stock
    }
