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

    # ✅ FIX: include customer_name
    invoice = Invoice(
        customer_name=data.customer_name,
        total=0
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for item in data.items:

        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            return {"error": f"Product {item.product_id} not found"}

        if product.stock < item.quantity:
            return {"error": f"Not enough stock for {product.name}"}

        # reduce stock
        product.stock -= item.quantity

        subtotal = product.price * item.quantity
        total += subtotal

        db_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=item.product_id,
            quantity=item.quantity
        )

        db.add(db_item)

    # update invoice total
    invoice.total = total

    db.commit()
    db.refresh(invoice)

    return {
        "invoice_id": invoice.id,
        "customer_name": invoice.customer_name,
        "total": invoice.total
    }
@router.get("/invoices")
def get_invoices(db: Session = Depends(get_db)):

    invoices = db.query(Invoice).all()

    result = []

    for invoice in invoices:

        items = db.query(InvoiceItem).filter(
            InvoiceItem.invoice_id == invoice.id
        ).all()

        item_list = []

        for item in items:

            product = db.query(Product).filter(
                Product.id == item.product_id
            ).first()

            item_list.append({
                "product_id": item.product_id,
                "product_name": product.name,
                "quantity": item.quantity,
                "price": product.price,
                "subtotal": product.price * item.quantity
            })

        result.append({
            "invoice_id": invoice.id,
            "customer_name": invoice.customer_name,
            "total": invoice.total,
            "items": item_list,
            "created_at": invoice.created_at
        })

    return result
