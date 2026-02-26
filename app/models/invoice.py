from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)

    # ⭐ ADD THIS — REQUIRED FOR INVOICE NUMBER SYSTEM
    invoice_number = Column(String, unique=True, index=True, nullable=False)

    customer_name = Column(String, nullable=False)

    total = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship(
        "InvoiceItem",
        back_populates="invoice",
        cascade="all, delete"
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)

    invoice_id = Column(Integer, ForeignKey("invoices.id"))

    product_id = Column(Integer, ForeignKey("products.id"))

    quantity = Column(Integer)

    price = Column(Float)

    invoice = relationship("Invoice", back_populates="items")

    product = relationship("Product", back_populates="invoice_items")
