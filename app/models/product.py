from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=True)

    price = Column(Float, nullable=True)

    stock = Column(Integer, default=0)

    sku = Column(String, unique=True, index=True)

    # ⭐ ADD THIS LINE
    barcode = Column(String, unique=True, index=True, nullable=True)

    category = Column(String)

    invoice_items = relationship("InvoiceItem", back_populates="product")