from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def generate_invoice_pdf(invoice, items, filename):

    os.makedirs("invoices", exist_ok=True)

    path = f"invoices/{filename}"

    c = canvas.Canvas(path, pagesize=letter)

    y = 750

    c.setFont("Helvetica-Bold", 18)
    c.drawString(200, y, "INVOICE")

    y -= 40
    c.setFont("Helvetica", 12)
    c.drawString(50, y, f"Invoice ID: {invoice.id}")

    y -= 20
    c.drawString(50, y, f"Customer: {invoice.customer_name}")

    y -= 40
    c.drawString(50, y, "Items:")

    y -= 20

    total = 0

    for item in items:

        line = f"{item.product.name} x{item.quantity} = ₹{item.product.price * item.quantity}"

        c.drawString(70, y, line)

        total += item.product.price * item.quantity

        y -= 20

    y -= 20
    c.drawString(50, y, f"Total: ₹{total}")

    c.save()

    return path
