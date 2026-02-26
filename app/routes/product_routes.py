from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.product import Product
from app.schemas.product_schema import ProductCreate, ProductScan
from app.core.security import require_auth

router = APIRouter()

# ========================================
# Database dependency
# ========================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ========================================
# CREATE product manually
# ========================================
@router.post("/products")
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    user: str = Depends(require_auth)
):

    existing_sku = db.query(Product).filter(
        Product.sku == product.sku
    ).first()

    if existing_sku:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists"
        )

    existing_barcode = db.query(Product).filter(
        Product.barcode == product.barcode
    ).first()

    if existing_barcode:
        raise HTTPException(
            status_code=400,
            detail="Barcode already exists"
        )

    db_product = Product(**product.dict())

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


# ========================================
# CREATE product by SCAN ⭐
# ========================================
@router.post("/products/scan")
def create_product_by_scan(
    data: ProductScan,
    db: Session = Depends(get_db)
):

    barcode = data.barcode

    existing = db.query(Product).filter(
        Product.barcode == barcode
    ).first()

    if existing:
        return existing

    new_product = Product(
        name=f"Product-{barcode[-4:]}",
        barcode=barcode,
        price=0,
        stock=0,
        sku=f"SKU-{barcode}",
        category="Uncategorized"
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# ========================================
# GET all products
# ========================================
@router.get("/products")
def get_products(
    db: Session = Depends(get_db)
):
    return db.query(Product).all()


# ========================================
# GET product by barcode ⭐
# ========================================
@router.get("/products/barcode/{barcode}")
def get_product_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):

    product = db.query(Product).filter(
        Product.barcode == barcode
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# ========================================
# UPDATE product
# ========================================
@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db)
):

    db_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    for key, value in product.dict().items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    return db_product


# ========================================
# DELETE product
# ========================================
@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    db_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(db_product)
    db.commit()

    return {"message": "Product deleted successfully"}


# ========================================
# UPDATE stock
# ========================================
@router.patch("/products/{product_id}/stock")
def update_stock(
    product_id: int,
    amount: int,
    db: Session = Depends(get_db)
):

    db_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db_product.stock += amount

    db.commit()
    db.refresh(db_product)

    return db_product