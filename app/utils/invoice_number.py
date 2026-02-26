from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from datetime import datetime


def generate_invoice_number(db: Session):

    year = datetime.utcnow().year

    # Get last invoice for this year
    last_invoice = db.query(Invoice) \
        .filter(Invoice.invoice_number.like(f"INV-{year}-%")) \
        .order_by(Invoice.id.desc()) \
        .first()

    if not last_invoice:
        number = 1
    else:
        last_number = int(last_invoice.invoice_number.split("-")[-1])
        number = last_number + 1

    invoice_number = f"INV-{year}-{number:04d}"

    return invoice_number
