import os
import sys
import asyncio
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

api_path = os.path.join(parent_dir, "api")

if api_path not in sys.path:
    sys.path.insert(0, api_path)
from models import (
    User, Admin, Purchase, Payment, 
    Shelf, ICCard, AdminLog, SystemSetting
)

load_dotenv()

async def init_db():
    url = os.environ.get("MONGODB_URL")
    db_name = os.environ.get("MONGODB_DB", "labshop")
    
    if not url:
        print("Error: MONGODB_URL not found in environment. Check your .env file!")
        sys.exit(1)

    print(f"Connecting to MongoDB Atlas...")

    client = AsyncIOMotorClient(
        url,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True 
    )

    await init_beanie(
        database=client[db_name],
        document_models=[
            User, 
            Admin, 
            Purchase, 
            Payment, 
            Shelf, 
            ICCard, 
            AdminLog, 
            SystemSetting
        ]
    )
    
    print(f"Database '{db_name}' initialized successfully with Beanie!")

if __name__ == "__main__":
    try:
        asyncio.run(init_db())
    except Exception as e:
        print(f" Initialization failed: {e}")
        sys.exit(2)