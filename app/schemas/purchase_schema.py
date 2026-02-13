from pydantic import BaseModel

class PurchaseCreate(BaseModel):
    supplier_id: int
    product_id: int
    quantity: int
