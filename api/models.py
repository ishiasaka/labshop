from beanie import Document, Indexed  
from datetime import datetime, timezone
from pydantic import Field
from typing import Optional

class User(Document):
    student_id: Indexed(int, unique=True) 
    first_name: str
    last_name: str
    account_balance: int = 0
    status: str = "active" 
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "user"

class Admin(Document):
    admin_id: Indexed(int, unique=True)
    username: str
    first_name: str
    last_name: str
    role: str = "admin"
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "admin"

class Purchase(Document):
    purchase_id: Indexed(int, unique=True)
    student_id: int
    shelf_id: str
    price: int
    status: str = "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "purchase"
    
class Payment(Document):
    payment_id: Indexed(int, unique=True) 
    student_id: int
    amount_paid: int
    status: str = "completed"
    external_transaction_id: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "payment"

class Shelf(Document):
    shelf_id: Indexed(str, unique=True) 
    price: int

    class Settings:
        name = "shelf"

class ICCard(Document):
    card_id: Indexed(int, unique=True) 
    uid: str
    student_id: Optional[int] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "ic_card"

class AdminLog(Document):
    log_id: Indexed(int, unique=True)
    admin_id: int 
    admin_name: Optional[str] = None  
    action: str
    target: Optional[str] = None       
    targeted_student_id: Optional[int] = None 
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "admin_log"

class SystemSetting(Document):
    key: Indexed(str, unique=True)
    value: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "system_setting"