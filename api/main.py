import logging
import os
import certifi
from fastapi import FastAPI, Body, HTTPException, Header, Depends
from dotenv import load_dotenv
load_dotenv()
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from beanie import PydanticObjectId, init_beanie
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from models import UserStatus, PaymentStatus, ICCardStatus, PurchaseStatus
from services.ws import ws_connection_manager, WSSchema
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
    ScanRequest, CardRegistrationRequest
)



from routes.admin import router as AdminRouter
from routes.ic_cards import router as ICCardRouter
from routes.payment import router as PaymentRouter
from routes.purchase import router as PurchaseRouter
from routes.shelf import router as ShelfRouter
from routes.user import router as UserRouter
from routes.websocket import router as WebsocketRouter
from routes.setting import router as SettingRouter

from services.auth import get_current_admin, TokenData

logger = logging.getLogger("uvicorn.error")


async def init_db():
    MONGODB_URL = os.getenv("MONGODB_URL")
    MONGODB_DB = os.getenv("MONGODB_DB")
    
    logger.info(f"Initializing database with URL: {MONGODB_URL} and DB: {MONGODB_DB}")

    if not MONGODB_URL or not MONGODB_DB:
        raise RuntimeError("MONGODB_URL or MONGODB_DB is not set")
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
    logger.info("Startup: Database initialized.")
    yield
    client.close() 
    logger.info("Shutdown: Database closed.")

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

app.include_router(AdminRouter)
app.include_router(ICCardRouter)
app.include_router(PaymentRouter)
app.include_router(PurchaseRouter)
app.include_router(ShelfRouter)
app.include_router(SettingRouter)
app.include_router(UserRouter)
app.include_router(WebsocketRouter)



@app.get("/")
def root():
    return {"message": "Labshop API is running"}