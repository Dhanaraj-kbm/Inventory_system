from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    stock = Column(Integer)

    # ADD THIS ↓↓↓ (CRITICAL)
    invoice_items = relationship("InvoiceItem", back_populates="product")

