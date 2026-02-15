from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product
from app.schemas.invoice_schema import InvoiceCreate
from fastapi.responses import FileResponse
from app.utils.pdf_generator import generate_invoice_pdf

router = APIRouter()


@router.post("/invoices")
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):

    db_invoice = Invoice(customer_name=invoice.customer_name, total=0)

    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    total = 0

    for item in invoice.items:

        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail="Not enough stock")

        line_total = product.price * item.quantity

        db_item = InvoiceItem(
            invoice_id=db_invoice.id,
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )

        db.add(db_item)

        product.stock -= item.quantity

        total += line_total

    db_invoice.total = total

    db.commit()

    return {
        "invoice_id": db_invoice.id,
        "total": total,
        "message": "Invoice created successfully"
    }
@router.get("/invoice/{invoice_id}/pdf")
def get_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):

    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()

    if not invoice:
        return {"error": "Invoice not found"}

    items = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).all()

    filename = f"invoice_{invoice_id}.pdf"

    path = generate_invoice_pdf(invoice, items, filename)

    return FileResponse(path, media_type="application/pdf", filename=filename)
