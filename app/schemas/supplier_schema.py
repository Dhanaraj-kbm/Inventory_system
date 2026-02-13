from pydantic import BaseModel

class SupplierCreate(BaseModel):
    name: str
    contact: str
