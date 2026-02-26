from pydantic import BaseModel

class ProductCreate(BaseModel):

    name: str
    sku: str
    price: float
    stock: int
    category: str
    barcode: str # we add barcode
class ProductScan(BaseModel):
    barcode: str