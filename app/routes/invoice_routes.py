from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse

from app.core.database import get_db
from app.models.invoice import Invoice, InvoiceItem
from app.models.product import Product
from app.schemas.invoice_schema import InvoiceCreate
from app.utils.pdf_generator import generate_invoice_pdf
from app.utils.invoice_number import generate_invoice_number


router = APIRouter()


# ========================================
# CREATE INVOICE (BARCODE BASED POS)
# ========================================
@router.post("/invoice")
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):

    # Generate professional invoice number
    invoice_number = generate_invoice_number(db)

    db_invoice = Invoice(
        invoice_number=invoice_number,
        customer_name=invoice.customer_name,
        total=0
    )

    db.add(db_invoice)
    db.flush()

    total = 0

    for item in invoice.items:

        # ⭐ FIND PRODUCT USING BARCODE
        product = db.query(Product).filter(
            Product.barcode == item.barcode
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with barcode {item.barcode} not found"
            )

        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Not enough stock for {product.name}"
            )

        line_total = product.price * item.quantity

        db_item = InvoiceItem(
            invoice=db_invoice,     # safer relationship usage
            product_id=product.id,
            quantity=item.quantity,
            price=product.price
        )

        db.add(db_item)

        # reduce stock
        product.stock -= item.quantity

        total += line_total

    db_invoice.total = total

    # SINGLE COMMIT
    db.commit()

    db.refresh(db_invoice)

    return {
        "invoice_id": db_invoice.id,
        "invoice_number": db_invoice.invoice_number,
        "customer_name": db_invoice.customer_name,
        "total": total,
        "message": "Invoice created successfully"
    }


# ========================================
# GET ALL INVOICES
# ========================================
@router.get("/invoices")
def get_invoices(db: Session = Depends(get_db)):

    invoices = db.query(Invoice).all()

    return [
        {
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "customer_name": invoice.customer_name,
            "total": invoice.total,
            "created_at": invoice.created_at
        }
        for invoice in invoices
    ]


# ========================================
# GET SINGLE INVOICE DETAILS
# ========================================
@router.get("/invoice/{invoice_id}")
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    result_items = []

    for item in invoice.items:

        product = item.product

        result_items.append({
            "barcode": product.barcode if product else "Unknown",
            "product_name": product.name if product else "Unknown",
            "quantity": item.quantity,
            "price": item.price,
            "subtotal": item.price * item.quantity
        })

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "customer_name": invoice.customer_name,
        "total": invoice.total,
        "created_at": invoice.created_at,
        "items": result_items
    }

# ========================================
# DOWNLOAD PDF
# ========================================
@router.get("/invoice/{invoice_id}/pdf")
def get_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    items = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).all()

    filename = f"{invoice.invoice_number}.pdf"

    path = generate_invoice_pdf(
        invoice,
        items,
        filename
    )

    return FileResponse(
        path,
        media_type="application/pdf",
        filename=filename
    )


# ========================================
# DELETE INVOICE
# ========================================
@router.delete("/invoice/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):

    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found"
        )

    items = db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).all()

    # restore stock
    for item in items:

        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if product:
            product.stock += item.quantity

    # delete items
    db.query(InvoiceItem).filter(
        InvoiceItem.invoice_id == invoice_id
    ).delete()

    # delete invoice
    db.delete(invoice)

    db.commit()

    return {
        "message": f"Invoice {invoice.invoice_number} deleted successfully"
    }