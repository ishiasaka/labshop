from beanie import Document, Indexed  
from datetime import datetime, timezone
from pydantic import Field
from typing import Optional
from enum import Enum

def utcnow():
    return datetime.now(timezone.utc) 

class UserStatus(str, Enum):
    active = "active"
    inactive = "inactive"

class PaymentStatus(str, Enum):
    completed = "completed"
    pending = "pending"
    failed = "failed"

class ICCardStatus(str, Enum):
    active = "active"
    deactivated = "deactivated"

class PurchaseStatus(str, Enum):
    completed = "completed"
    failed = "failed"
    pending = "pending"
    canceled = "canceled"

class AdminRole(str, Enum):
    superadmin = "superadmin"
    admin = "admin"
    moderator = "moderator"

class User(Document):
    student_id: Indexed(int, unique=True) 
    first_name: str
    last_name: str
    account_balance: int = 0
    status: UserStatus = UserStatus.active
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    async def save(self, *args, **kwargs):
        self.updated_at = utcnow()
        return await super().save(*args, **kwargs)

    class Settings:
        name = "user"

class Admin(Document):
    admin_id: Indexed(int, unique=True)
    username: str
    first_name: str
    last_name: str
    role: AdminRole = AdminRole.admin
    password_hash: str
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "admin"

class Purchase(Document):
    purchase_id: Indexed(int, unique=True)
    student_id: int
    shelf_id: str
    price: int
    status: PurchaseStatus = PurchaseStatus.pending
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "purchase"
    
class Payment(Document):
    payment_id: Indexed(int, unique=True) 
    student_id: int
    amount_paid: int
    status: PaymentStatus = PaymentStatus.pending
    external_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "payment"


class Shelf(Document):
    shelf_id: Indexed(str, unique=True)
    usb_port: Indexed(int, unique=True)
    price: int

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    async def save(self, *args, **kwargs):
        self.updated_at = utcnow()
        return await super().save(*args, **kwargs)

    class Settings:
        name = "shelf"

class ICCard(Document):
    card_id: Indexed(int, unique=True) 
    uid: Indexed(str, unique=True)
    student_id: Optional[int] = None
    status: ICCardStatus = ICCardStatus.active
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    async def save(self, *args, **kwargs):
        self.updated_at = utcnow()
        return await super().save(*args, **kwargs)

    class Settings:
        name = "ic_card"

class AdminLog(Document):
    log_id: Indexed(int, unique=True)
    admin_id: int 
    admin_name: Optional[str] = None  
    action: str
    target: Optional[str] = None       
    targeted_student_id: Optional[int] = None 
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "admin_log"

class SystemSetting(Document):
    key: Indexed(str, unique=True)
    value: str
    updated_at: datetime = Field(default_factory=utcnow)

    async def save(self, *args, **kwargs):
        self.updated_at = utcnow()
        return await super().save(*args, **kwargs)

    class Settings:
        name = "system_setting"