from __future__ import annotations
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List
from models import UserStatus, PurchaseStatus, ICCardStatus, PaymentStatus, AdminRole
from beanie import PydanticObjectId

class UserCreate(BaseModel):
    student_id: int 
    first_name: str
    last_name: str

class UserOut(UserCreate):
    account_balance: int = 0
    status: UserStatus 
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AdminCreate(BaseModel):
    username: str
    first_name: str
    last_name: str
    password: str


class AdminOut(BaseModel):
    id: PydanticObjectId 
    first_name: str
    last_name: str
    role: AdminRole
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PurchaseCreate(BaseModel):
    student_id: int 
    shelf_id: str 

class PurchaseOut(PurchaseCreate):
    id: PydanticObjectId
    price: int
    status: PurchaseStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentCreate(BaseModel):
    student_id: int 
    amount_paid: int
    external_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None

class PaymentOut(PaymentCreate):
    id: PydanticObjectId
    status: PaymentStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ICCardCreate(BaseModel):
    uid: str
    student_id: Optional[int] = None
    status : ICCardStatus = ICCardStatus.active

class ICCardOut(ICCardCreate):
    id: PydanticObjectId
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AdminLogOut(BaseModel):
    id: PydanticObjectId
    admin_id: int 
    admin_name: str
    action: str
    target: Optional[str] = None
    targeted_student_id: Optional[int] = None 
    created_at: datetime 
    model_config = ConfigDict(from_attributes=True)

class ShelfCreate(BaseModel):
    shelf_id: str 
    usb_port: int
    price: int = 0

class ShelfOut(ShelfCreate):
    id: PydanticObjectId
    created_at: datetime
    updated_at: datetime 
    model_config = ConfigDict(from_attributes=True)

class SystemSettingCreate(BaseModel):
    key: str
    value: str

class SystemSettingOut(SystemSettingCreate):
    id: PydanticObjectId
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScanRequest(BaseModel):
    idm: str = Field(..., min_length=4, max_length=64)
    usb_port: Optional[int] = Field(default=None, ge=1, le=7)
    timestamp: Optional[datetime] = None

    @property
    def normalized_uid(self) -> str:
        return self.idm.strip().lower()
    

class CardRegistrationRequest(BaseModel): 
    student_id: int

class AdminLogin(BaseModel):
    username: str
    password: str

class AdminSession(BaseModel):
    admin_id: PydanticObjectId
    admin_name: str

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