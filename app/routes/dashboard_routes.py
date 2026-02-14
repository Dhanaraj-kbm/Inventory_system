from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product
from app.core.security import require_auth


router = APIRouter(prefix="/dashboard")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    user: str = Depends(require_auth)
):


    total_sales = db.query(func.count(Invoice.id)).scalar()
    total_revenue = db.query(func.sum(Invoice.total)).scalar() or 0
    total_products = db.query(func.count(Product.id)).scalar()

    return {
        "total_sales": total_sales,
        "total_revenue": total_revenue,
        "products": total_products
    }


@router.get("/top-products")
def top_products(
    db: Session = Depends(get_db),
    user: str = Depends(require_auth)
):


    results = (
        db.query(
            Product.name,
            func.sum(InvoiceItem.quantity).label("sold")
        )
        .join(InvoiceItem, Product.id == InvoiceItem.product_id)
        .group_by(Product.name)
        .order_by(func.sum(InvoiceItem.quantity).desc())
        .limit(5)
        .all()
    )

    return [{"product": r[0], "sold": r[1]} for r in results]
