from pydantic import BaseModel
from typing import Optional

class WSSchema(BaseModel):
    action: str
    student_id: Optional[str] = None
    shelf_id: Optional[str] = None
    student_name: Optional[str] = None
    debt_amount: Optional[int] = None
    price: Optional[int] = None
    