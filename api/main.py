import os
import certifi
from fastapi import FastAPI, Body, HTTPException, Header, Depends
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi import Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from beanie import init_beanie
from passlib.context import CryptContext



from models import (
    User, Admin, Purchase, Payment,
    ICCard, Shelf, AdminLog, SystemSetting
)
from schema import (
    UserCreate, UserOut, UsersOut,
    PurchaseCreate, PurchaseOut, PurchasesOut,
    PaymentCreate, PaymentOut, PaymentsOut,
    ICCardCreate, ICCardOut,
    ShelfCreate, ShelfOut,
    SystemSettingCreate, SystemSettingOut,
    AdminCreate, AdminOut
)

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB = os.getenv("MONGODB_DB")

if not MONGODB_URL or not MONGODB_DB:
    raise RuntimeError("MONGODB_URL or MONGODB_DB is not set")

app = FastAPI(title="Labshop API")
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="."), name="static")
async def get_current_admin(
    admin_id: str = Header(..., alias="admin-id"),
    admin_name: str = Header(..., alias="admin-name")
):
    return {"id": int(admin_id), "name": admin_name}

@app.on_event("startup")
async def init_db():
    client = AsyncIOMotorClient(
        MONGODB_URL,
        tls=True,
        tlsCAFile=certifi.where(),
    )

    await init_beanie(
        database=client[MONGODB_DB],
        document_models=[
            User,
            Admin,
            Purchase,
            Payment,
            Shelf,
            ICCard,
            AdminLog,
            SystemSetting,
        ],
    )


@app.get("/")
def root():
    return {"message": "Labshop API is running"}

@app.get("/index.html", response_class=HTMLResponse)
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/admin/")
async def create_admin(data: AdminCreate):
    existing = await Admin.find_one(Admin.username == data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = pwd_context.hash(data.password)

    new_admin = Admin(
        admin_id=int(datetime.now().timestamp()), 
        username=data.username,
        first_name=data.first_name,
        last_name=data.last_name,
        password_hash=hashed_password, 
        role="admin"
    )

    
    await new_admin.insert()
    
    return {"message": "Admin successfully created", "username": data.username}

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/admin/login")
async def admin_login(credentials: dict = Body(...)):
    identifier = credentials.get("username") or credentials.get("first_name")

    if not identifier:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    admin = await Admin.find_one(Admin.username == identifier)

    if not admin:
        admin = await Admin.find_one(Admin.first_name == identifier)

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    password = credentials.get("password")
    stored_hash = admin.password_hash

    if not password or not stored_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not pwd_context.verify(password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    full_name = f"{admin.first_name} {admin.last_name}"

    return {
        "admin_id": admin.admin_id,
        "full_name": full_name
    }

@app.get("/login.html", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


@app.post("/users/", response_model=UserOut)
async def create_user(
    user: UserCreate,
    admin_id: str | None = Header(None, alias="admin-id"),
    admin_name: str | None = Header(None, alias="admin-name"),
):
    now = datetime.now(timezone.utc)

    if await User.find_one(User.student_id == user.student_id):
        raise HTTPException(400, "Student ID already exists")

    new_user = User(
        student_id=user.student_id,
        first_name=user.first_name,
        last_name=user.last_name,
        account_balance=0,
        status="active",
        created_at=now,
        updated_at=now,
    )
    await new_user.insert()

    if admin_id and admin_name:
        generated_id = int(now.timestamp() * 1000)
        await AdminLog(
            log_id=generated_id, 
            admin_id=int(admin_id),
            admin_name=admin_name, 
            action=f"Created student {new_user.first_name} {new_user.last_name}",
            target=f"Student {new_user.student_id}", 
            targeted_student_id=new_user.student_id,
            timestamp=now,
        ).insert()

    return new_user

@app.get("/users/", response_model=UsersOut)
async def list_users():
    return {"users": await User.find().to_list()}


@app.post("/ic_cards/", response_model=ICCardOut)
async def create_ic_card(card: ICCardCreate):
    now = datetime.now(timezone.utc)

    if card.student_id:
        if not await User.find_one(User.student_id == card.student_id):
            raise HTTPException(400, "Student does not exist")

    if await ICCard.find_one(ICCard.uid == card.uid):
        raise HTTPException(400, "UID already exists")

    ic = ICCard(
        uid=card.uid,
        student_id=card.student_id,
        status=card.status,
        created_at=now,
    )
    await ic.insert()
    return ic


@app.post("/shelves/", response_model=ShelfOut)
async def create_shelf(s: ShelfCreate):
    if await Shelf.find_one(Shelf.shelf_id == s.shelf_id):
        raise HTTPException(400, "Shelf already exists")

    shelf = Shelf(shelf_id=s.shelf_id, price=s.price)
    await shelf.insert()
    return shelf

@app.get("/shelves/")
async def list_shelves():
    return {"shelves": await Shelf.find().to_list()}


@app.post("/purchases/", response_model=PurchaseOut)
async def create_purchase(p: PurchaseCreate):
    now = datetime.now(timezone.utc)

    client = Purchase.get_settings().pymongo_collection.database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():

            student = await User.find_one(
                User.student_id == p.student_id,
                session=session
            )
            if not student:
                raise HTTPException(400, "Student does not exist")

            shelf = await Shelf.find_one(
                Shelf.shelf_id == p.shelf_id,
                session=session
            )
            if not shelf:
                raise HTTPException(400, "Shelf does not exist")

            price = shelf.price

            student.account_balance += price
            student.updated_at = now
            await student.save(session=session)

            purchase = Purchase(
                purchase_id=int(now.timestamp() * 1000),
                student_id=p.student_id,
                shelf_id=p.shelf_id,
                price=price,
                status=p.status or "recorded",
                created_at=now,
            )

            await purchase.insert(session=session)

            return purchase

@app.get("/purchases/", response_model=PurchasesOut)
async def list_purchases():
    return {"purchases": await Purchase.find().to_list()}


@app.post("/payments/", response_model=PaymentOut)
async def create_payment(p: PaymentCreate):
    now = datetime.now(timezone.utc)
    generated_pay_id = int(now.timestamp() * 1000)

    student = await User.find_one(User.student_id == p.student_id)
    if not student:
        raise HTTPException(400, "Student does not exist")

    if student.account_balance <= 0:
        raise HTTPException(400, "Payment rejected: Student has no outstanding balance.")

    if p.idempotency_key:
        existing = await Payment.find_one(Payment.idempotency_key == p.idempotency_key)
        if existing:
            return existing

    amount = int(p.amount_paid)
    
    if amount > student.account_balance:
        amount = student.account_balance

    student.account_balance -= amount
    await student.save()

    payment = Payment(
        payment_id=generated_pay_id,
        student_id=p.student_id,
        amount_paid=amount,
        status=p.status,
        external_transaction_id=p.external_transaction_id or "",
        idempotency_key=p.idempotency_key,
        created_at=now,
    )

    await payment.insert()

    return payment

@app.get("/payments/", response_model=PaymentsOut)
async def list_payments():
    return {"payments": await Payment.find().to_list()}


@app.post("/system_settings/", response_model=SystemSettingOut)
async def create_or_update_system_setting(s: SystemSettingCreate, admin: dict = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    generated_log_id = int(now.timestamp() * 1000)
    
    setting = await SystemSetting.find_one(SystemSetting.key == s.key)

    if setting:
        await setting.set({SystemSetting.value: s.value, SystemSetting.updated_at: now})
        action_msg = f"Updated {s.key} to {s.value}"
    else:
        setting = SystemSetting(key=s.key, value=s.value, updated_at=now)
        await setting.insert()
        action_msg = f"Created new setting {s.key} with value {s.value}"

    await AdminLog(
        log_id=generated_log_id,
        admin_id=admin["id"],
        admin_name=admin["name"],
        action=action_msg,
        target="System Settings",
        timestamp=now
    ).insert()

    return setting

@app.post("/card_scan/")
async def card_scan(scan: dict = Body(...)):
    uid = scan.get("uid").lower()
    shelf_id = str(scan.get("port_number") or scan.get("shelf_id") or "").strip()
    
    now = datetime.now(timezone.utc)
    card = await ICCard.find_one(ICCard.uid == uid)
    
    ADMIN_PORT = "5"

    if shelf_id == ADMIN_PORT or shelf_id == "READER_5":
        print(f">>> ADMIN MODE ACTIVATED ON PORT [{shelf_id}] FOR UID: {uid}")
        
        if not card or card.student_id is None:
            if card:
                await card.update({"$set": {"updated_at": now}})
                print(">>> Updated existing unlinked card.")
            else:
                new_card = ICCard(
                    card_id=int(now.timestamp() * 1000),
                    uid=uid,
                    student_id=None, 
                    status="active",
                    created_at=now
                )
                await new_card.insert()
                print(">>> Successfully inserted NEW card to DB.")

            return {"status": "new_card", "message": "Card captured. Register in Admin."}

        student = await User.find_one(User.student_id == card.student_id)
        if not student:
            return {"status": "error", "message": "Student record missing."}

        return {
            "status": "identified",
            "name": student.first_name,
            "student_id": student.student_id,
            "message": f"Hi {student.first_name}, choose payment amount."
        }

    if not card or card.student_id is None:
        if shelf_id == "READER_5":
            return {"status": "new_card", "message": "Captured for registration"}
        raise HTTPException(404, "Card not registered to a student")

    student = await User.find_one(User.student_id == card.student_id)
    if not student:
        raise HTTPException(404, "Student record not found")

    shelf = await Shelf.find_one(Shelf.shelf_id == shelf_id)
    if not shelf:
        raise HTTPException(404, f"Shelf {shelf_id} not found")

    price = shelf.price
    limit_doc = await SystemSetting.find_one(SystemSetting.key == "max_debt_limit")
    max_limit = int(limit_doc.value) if limit_doc else 2000

    if student.account_balance + price > max_limit:
        return {
            "status": "denied",
            "message": "Debt limit reached",
            "current_debt": student.account_balance
        }

    generated_p_id = int(now.timestamp() * 1000)

    student.account_balance += price
    student.updated_at = now
    await student.save()

    new_purchase = Purchase(
        purchase_id=generated_p_id,  
        student_id=student.student_id,
        shelf_id=shelf_id,
        price=price,
        status="completed",
        created_at=now
    )
    await new_purchase.insert()

    return {
        "status": "success",
        "student_name": student.first_name,
        "amount_charged": price,
        "new_balance": student.account_balance
    }


@app.post("/register_card/")
async def register_card(data: dict = Body(...)):
    uid = data.get("uid")
    student_id = data.get("student_id")
    admin_id = data.get("admin_id")
    admin_name = data.get("admin_name")

    if not uid or not student_id:
        raise HTTPException(400, "uid and student_id are required")

    student = await User.find_one(User.student_id == int(student_id))
    if not student:
        raise HTTPException(404, "Student not found")

    now = datetime.now(timezone.utc)

    card = await ICCard.find_one(ICCard.uid == uid)
    if card:
        card.student_id = int(student_id)
        card.status = "active"
        await card.save()
    else:
        await ICCard(
            card_id=int(now.timestamp() * 1000),
            uid=uid,
            student_id=int(student_id),
            status="active",
            created_at=now
        ).insert()

    await AdminLog(
        log_id=int(now.timestamp() * 1000),
        admin_id=int(admin_id),
        admin_name=admin_name,
        action=f"Linked card {uid} to student {student_id}",
        target=f"Student: {student.first_name} {student.last_name}",
        targeted_student_id=int(student_id),
        timestamp=now
    ).insert()

    return {"message": f"Card {uid} linked to student {student_id} by {admin_name}"}


@app.get("/get_captured_card/")
async def get_captured_card():
    card = await ICCard.find(
        ICCard.student_id == None
    ).sort(-ICCard.created_at).first_or_none()
    
    return card
