import os
import certifi
from fastapi import FastAPI, Body, HTTPException, Header, Depends, Request, WebSocket
from fastapi.responses import HTMLResponse, FileResponse
#from fastapi.templating import Jinja2Templates
#from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from beanie import init_beanie
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from ws.connection_manager import ws_connection_manager
from ws.ws_schema import WSSchema

from models import (
    User, Admin, Purchase, Payment,
    ICCard, Shelf, AdminLog, SystemSetting
)
from schema import (
    AdminLogin, AdminSession, UserCreate, UserOut, UsersOut,
    PurchaseCreate, PurchaseOut, PurchasesOut,
    PaymentCreate, PaymentOut, PaymentsOut,
    ICCardCreate, ICCardOut,
    ShelfCreate, ShelfOut,
    SystemSettingCreate, SystemSettingOut,
    AdminCreate, AdminOut, ScanRequest, CardRegistrationRequest
)
from routes.websocket import router as websocket_router

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB = os.getenv("MONGODB_DB")

if not MONGODB_URL or not MONGODB_DB:
    raise RuntimeError("MONGODB_URL or MONGODB_DB is not set")

async def get_current_admin(
    admin_id: str = Header(..., alias="admin-id"),
    admin_name: str = Header(..., alias="admin-name")
) -> AdminSession: 
    return AdminSession(admin_id=int(admin_id), admin_name=admin_name)


async def init_db():

    client = AsyncIOMotorClient(MONGODB_URL)
    await init_beanie(
        database=client[MONGODB_DB],
        document_models=[
            User, Admin, Purchase, Payment, 
            Shelf, ICCard, AdminLog, SystemSetting
        ],
    )
    return client

# 3. Lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    client = await init_db()
    print("Startup: Database initialized.")
    yield
    client.close() 
    print("Shutdown: Database closed.")

app = FastAPI(
    title="Labshop API",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local HTML files to talk to the API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#templates = Jinja2Templates(directory="../tablets/templates")
#app.mount("/static", StaticFiles(directory="../tablets/public/static"), name="static")

app.include_router(websocket_router)

@app.get("/")
def root():
    return {"message": "Labshop API is running"}

@app.post("/admin/")
async def create_admin(data: AdminCreate):
    existing = await Admin.find_one(Admin.username == data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    password_bytes = data.password.encode('utf-8')

    salt = bcrypt.gensalt()
    hashed_password_bytes = bcrypt.hashpw(password_bytes, salt)

    hashed_password = hashed_password_bytes.decode('utf-8')

    new_admin = Admin(
        admin_id=int(datetime.now(timezone.utc).timestamp() * 1000000), 
        username=data.username,
        first_name=data.first_name,
        last_name=data.last_name,
        password_hash=hashed_password, 
        role="admin"
    )

    
    await new_admin.insert()
    
    return {"message": "Admin successfully created", "username": data.username}

@app.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    admin = await Admin.find_one(Admin.username == credentials.username)

    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    stored_hash = admin.password_hash
    is_valid = bcrypt.checkpw(
        credentials.password.encode("utf-8"),
        stored_hash.encode("utf-8")
    )

    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    full_name = f"{admin.first_name} {admin.last_name}"

    return {
        "admin_id": admin.admin_id,
        "full_name": full_name,
    }


@app.post("/users/", response_model=UserOut)
async def create_user(
    user: UserCreate,
    admin: AdminSession = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)

    if await User.find_one(User.student_id == user.student_id):
        raise HTTPException(status_code=400, detail="Student ID already exists")

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

    generated_id = int(datetime.now(timezone.utc).timestamp() * 1000000)

    await AdminLog(
        log_id=generated_id,
        admin_id=admin.admin_id,
        admin_name=admin.admin_name,
        action=f"Created student {new_user.first_name} {new_user.last_name}",
        target=f"Student {new_user.student_id}",
        targeted_student_id=new_user.student_id,
        created_at=now,
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
        card_id=card.card_id,
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

    client = Purchase.get_pymongo_collection().database.client
    
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
            limit_doc = await SystemSetting.find_one(
                SystemSetting.key == "max_debt_limit",
                session=session
            )
            max_limit = int(limit_doc.value) if limit_doc else 2000

            if student.account_balance + price > max_limit:
                raise HTTPException(400, "Debt limit reached")

            student.account_balance += price
            student.updated_at = now
            await student.save(session=session)

            purchase = Purchase(
                purchase_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
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
    
    student = await User.find_one(User.student_id == p.student_id)
    if not student:
        raise HTTPException(404, "Student not found")

    amount = int(p.amount_paid)
    if amount <= 0:
        raise HTTPException(400, "Payment amount must be greater than zero.")
    if student.account_balance < amount:
         raise HTTPException(400, "Your debt is less than what you want to pay")

    if p.idempotency_key:
        existing = await Payment.find_one(Payment.idempotency_key == p.idempotency_key)
        if existing:
            return existing

    client = User.get_pymongo_collection().database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            
            payment = Payment(
                payment_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
                student_id=p.student_id,
                amount_paid=amount,
                status="completed",
                idempotency_key=p.idempotency_key,
                created_at=now,
            )

            await payment.insert(session=session)
            # Deduct the amount from student's balance
            student.account_balance -= amount
            await student.save(session=session)
    return payment

@app.get("/payments/", response_model=PaymentsOut)
async def list_payments():
    return {"payments": await Payment.find().to_list()}


@app.post("/system_settings/", response_model=SystemSettingOut)
async def create_or_update_system_setting(s: SystemSettingCreate, admin: AdminSession = Depends(get_current_admin)):
    now = datetime.now(timezone.utc)
    generated_log_id = int(datetime.now(timezone.utc).timestamp() * 1000000)
    
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
        admin_id=admin.admin_id,
        admin_name=admin.admin_name,
        action=action_msg,
        target="System Settings",
        created_at=now
    ).insert()

    return setting

@app.post("/card_scan/")
async def card_scan(scan: ScanRequest):
    uid = scan.normalized_uid
    shelf_id = scan.final_shelf_id
    
    now = datetime.now(timezone.utc)
    card = await ICCard.find_one(ICCard.uid == uid)
    
    ADMIN_PORT = "5"
    REGISTRATION_PORTS = [ADMIN_PORT, "READER_5"]

    if shelf_id in REGISTRATION_PORTS:
        print(f">>> ADMIN MODE ACTIVATED ON PORT [{shelf_id}] FOR UID: {uid}")
        
        if not card or card.student_id is None:
            if card:
                await card.update({"$set": {"updated_at": now}})
                print(">>> Updated existing unlinked card.")
            else:
                new_card = ICCard(
                    card_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
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

        await ws_connection_manager.send_payload_to_tablet(WSSchema(
            action="PAY_BACK",
            student_id=str(student.student_id),
            student_name=student.first_name,
            debt_amount=student.account_balance
        ))
        return {
            "status": "identified",
            "name": student.first_name,
            "student_id": student.student_id,
            "message": f"Hi {student.first_name}, choose payment amount."
        }

    if not card or card.student_id is None:
        raise HTTPException(404, "Card not registered to a student")

    client = User.get_pymongo_collection().database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            
            student = await User.find_one(User.student_id == card.student_id, session=session)
            if not student:
                raise HTTPException(404, "Student record not found")

            shelf = await Shelf.find_one(Shelf.shelf_id == shelf_id, session=session)
            if not shelf:
                raise HTTPException(404, f"Shelf {shelf_id} not found")

            price = shelf.price
            limit_doc = await SystemSetting.find_one(SystemSetting.key == "max_debt_limit", session=session)
            max_limit = int(limit_doc.value) if limit_doc else 2000
            
            if student.account_balance + price > max_limit:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error_code": "LIMIT_REACHED",
                        "message": "Debt limit reached",
                        "current_debt": student.account_balance
                    }
                )

            # Update Student Balance
            student.account_balance += price
            student.updated_at = now
            await student.save(session=session)

            new_purchase = Purchase(
                purchase_id=int(datetime.now(timezone.utc).timestamp() * 1000000),  
                student_id=student.student_id,
                shelf_id=shelf_id,
                price=price,
                status="completed",
                created_at=now
            )
            await new_purchase.insert(session=session)

            return {
                "status": "success",
                "student_name": student.first_name,
                "amount_charged": price,
                "new_balance": student.account_balance
            }


@app.post("/register_card/")
async def register_card(data: CardRegistrationRequest, admin: AdminSession = Depends(get_current_admin)):

    student = await User.find_one(User.student_id == data.student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    
    existing_card = await ICCard.find_one(
        ICCard.student_id == data.student_id, 
        ICCard.status == "active",
        ICCard.uid != data.uid  
    )
    if existing_card:
        raise HTTPException(
            status_code=400, 
            detail=f"Student {data.student_id} already has an active card (UID: {existing_card.uid})"
        )

    now = datetime.now(timezone.utc)

    client = User.get_pymongo_collection().database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            card = await ICCard.find_one(ICCard.uid == data.uid, session=session)
            
            if card:
                if card.status == "active" and card.student_id is not None:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Card {data.uid} is already linked to Student {card.student_id}"
                    )
                card.student_id = data.student_id
                card.status = "active"
                await card.save(session=session)
            else:
                await ICCard(
                    card_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
                    uid=data.uid,
                    student_id=data.student_id,
                    status="active",
                    created_at=now
                ).insert(session=session) 

            await AdminLog(
                log_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
                admin_id=admin.admin_id,
                admin_name=admin.admin_name,
                action=f"Linked card {data.uid} to student {data.student_id}",
                target=f"Student: {student.first_name} {student.last_name}",
                targeted_student_id=data.student_id,
                created_at=now
            ).insert(session=session) 

    return {"message": f"Card {data.uid} linked to student {data.student_id} by {admin.admin_name}"}


@app.get("/get_captured_card/")
async def get_captured_card():
    card = await ICCard.find(
        ICCard.student_id == None
    ).sort(-ICCard.created_at).first_or_none()
    
    return card

@app.post("/deactivate_card/")
async def deactivate_card(uid: str, admin: AdminSession = Depends(get_current_admin)):
    client = User.get_pymongo_collection().database.client
    now = datetime.now(timezone.utc)
    
    async with await client.start_session() as session:
        async with session.start_transaction():

            card = await ICCard.find_one(ICCard.uid == uid, session=session)
            if not card:
                raise HTTPException(404, "Card not found")

            old_id = card.student_id

            card.status = "inactive"
            card.student_id = None 
            await card.save(session=session)

            await AdminLog(
                log_id=int(datetime.now(timezone.utc).timestamp() * 1000000),
                admin_id=admin.admin_id,
                admin_name=admin.admin_name,
                action=f"Deactivated card {uid}",
                target=f"Disconnected from Student: {old_id}",
                targeted_student_id=old_id,
                created_at=now
            ).insert(session=session)

    return {"message": f"Card {uid} successfully deactivated and logged."}

@app.get("/active_cards/")
async def get_active_cards():

    cards = await ICCard.find(ICCard.status == "active").sort(-ICCard.created_at).to_list()
    return cards

