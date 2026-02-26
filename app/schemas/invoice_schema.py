from pydantic import BaseModel
from typing import List


class InvoiceItemCreate(BaseModel):

    barcode: str     # ⭐ instead of product_id
    quantity: int


class InvoiceCreate(BaseModel):

    customer_name: str
    items: List[InvoiceItemCreate]