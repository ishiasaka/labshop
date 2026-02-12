from __future__ import annotations
from dataclasses import Field
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    student_id: int 
    first_name: str
    last_name: str

class UserOut(UserCreate):
    account_balance: int = 0
    status: str = "active"
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AdminCreate(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str
    role: str = "admin"


class AdminOut(BaseModel):
    admin_id: int 
    first_name: str
    last_name: str
    password_hash: str
    role: str
    model_config = ConfigDict(from_attributes=True)

class PurchaseCreate(BaseModel):
    student_id: int 
    shelf_id: str 
    status: str = "completed"

class PurchaseOut(PurchaseCreate):
    purchase_id: int
    price: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentCreate(BaseModel):
    student_id: int 
    amount_paid: int
    status: str = "completed"
    external_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None

class PaymentOut(PaymentCreate):
    payment_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ICCardCreate(BaseModel):
    uid: str
    student_id: int
    status: str = "active"

class ICCardOut(ICCardCreate):
    card_id: Optional[int] = None 
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdminLogCreate(BaseModel): 
    admin_id: int 
    admin_name: str
    action: str
    target: str
    targeted_student_id: Optional[int] = None 

class AdminLogOut(AdminLogCreate):
    log_id: int
    created_at: datetime 
    model_config = ConfigDict(from_attributes=True)

class ShelfCreate(BaseModel):
    shelf_id: str 
    price: int = 0

class ShelfOut(ShelfCreate):
    model_config = ConfigDict(from_attributes=True)

class SystemSettingCreate(BaseModel):
    key: str
    value: str

class SystemSettingOut(SystemSettingCreate):
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScanRequest(BaseModel):
    uid: str
    port_number: Optional[str] = None
    shelf_id: Optional[str] = None

    @property
    def normalized_uid(self) -> str:
        return self.uid.lower()

    @property
    def final_shelf_id(self) -> str:
        return str(self.port_number or self.shelf_id or "").strip()

class CardRegistrationRequest(BaseModel): 
    uid: str
    student_id: int


class UsersOut(BaseModel):
    users: List[UserOut]

class AdminsOut(BaseModel):
    admins: List[AdminOut]

class PurchasesOut(BaseModel):
    purchases: List[PurchaseOut]

class PaymentsOut(BaseModel):
    payments: List[PaymentOut]

class ICCardsOut(BaseModel):
    iccards: List[ICCardOut]

class AdminLogsOut(BaseModel):
    logs: List[AdminLogOut]

class ShelvesOut(BaseModel):
    shelves: List[ShelfOut]

class SystemSettingsOut(BaseModel):
    settings: List[SystemSettingOut]