from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    sku = Column(String, unique=True)
    price = Column(Float)
    stock = Column(Integer)
    category = Column(String)
