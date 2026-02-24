from beanie import Document, Indexed  
from datetime import datetime, timezone
from pydantic import Field
from typing import Optional
from enum import Enum
from beanie import PydanticObjectId

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



class Admin(Document):
    username: str
    first_name: str
    last_name: str
    role: AdminRole = AdminRole.admin
    password_hash: str
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "admin"

class Purchase(Document):
    student_id: int
    shelf_id: PydanticObjectId
    price: int
    status: PurchaseStatus = PurchaseStatus.pending
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "purchase"
    
class Payment(Document):
    student_id: int
    amount_paid: int
    status: PaymentStatus = PaymentStatus.pending
    external_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime = Field(default_factory=utcnow)

    class Settings:
        name = "payment"
        
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

    async def make_purchase(self, shelf_id: str, price: int):
        purchase = Purchase(
            student_id=self.student_id,
            shelf_id=shelf_id,
            price=price,
            status=PurchaseStatus.pending,
        )
        purchase = await purchase.insert()
        try:
            await self.inc({
            "account_balance": price
            })
        except Exception as e:
            purchase.status = PurchaseStatus.failed
            await purchase.save()
            raise e
        
        try:
            purchase.status = PurchaseStatus.completed
            await purchase.save()
        except Exception as e:
            await self.inc({
            "account_balance": -price
            })
            purchase.status = PurchaseStatus.failed
            await purchase.save()
            raise e 
        return purchase
    
    async def make_payment(self, amount_paid: int, external_transaction_id: Optional[str] = None, idempotency_key: Optional[str] = None):
        payment = Payment(
            student_id=self.student_id,
            amount_paid=amount_paid,
            status=PaymentStatus.pending,
            external_transaction_id=external_transaction_id,
            idempotency_key=idempotency_key
        )
        payment = await payment.insert()
        try:
            await self.inc({
                "account_balance": -amount_paid
            })
        except Exception as e:
            payment.status = PaymentStatus.failed
            await payment.save()
            raise e
        
        try:
            payment.status = PaymentStatus.completed
            await payment.save()
        except Exception as e:
            await self.inc({
                "account_balance": amount_paid
            })
            payment.status = PaymentStatus.failed
            await payment.save()
            raise e 
        return payment
    class Settings:
        name = "user"


class Shelf(Document):
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
    admin_id: PydanticObjectId
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