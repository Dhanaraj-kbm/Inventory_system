from pydantic import BaseModel
from typing import List

class InvoiceItemCreate(BaseModel):
    product_id: int
    quantity: int

class InvoiceCreate(BaseModel):
    items: List[InvoiceItemCreate]
