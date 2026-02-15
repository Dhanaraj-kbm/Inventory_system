from pydantic import BaseModel
from typing import List


class InvoiceItemCreate(BaseModel):
    product_id: int
    quantity: int


class InvoiceCreate(BaseModel):
    customer_name: str
    items: List[InvoiceItemCreate]
