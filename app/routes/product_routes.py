from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from app.schemas.product_schema import ProductCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/products")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
@router.put("/products/{product_id}")
def update_product(product_id: int, product: ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        return {"error": "Product not found"}

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return db_product
@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        return {"error": "Product not found"}

    db.delete(db_product)
    db.commit()

    return {"message": "Product deleted"}
@router.patch("/products/{product_id}/stock")
def update_stock(product_id: int, amount: int, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        return {"error": "Product not found"}

    db_product.stock += amount
    db.commit()
    db.refresh(db_product)

    return db_product
