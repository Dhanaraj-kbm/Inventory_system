from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice_schema import InvoiceCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/invoice")
def create_invoice(data: InvoiceCreate, db: Session = Depends(get_db)):

    total = 0
    invoice = Invoice(total=0)
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for item in data.items:

        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            return {"error": f"Product {item.product_id} not found"}

        if product.stock < item.quantity:
            return {"error": f"Not enough stock for {product.name}"}

        product.stock -= item.quantity

        subtotal = product.price * item.quantity
        total += subtotal

        db_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=item.product_id,
            quantity=item.quantity
        )

        db.add(db_item)

    invoice.total = total
    db.commit()

    return {
        "invoice_id": invoice.id,
        "total": total
    }
