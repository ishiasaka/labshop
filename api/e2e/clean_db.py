from models import *
from beanie import init_beanie
from dotenv import load_dotenv
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import Document

async def main():
    load_dotenv()
    MONGODB_URL = os.getenv("MONGODB_URL")
    MONGODB_DB = os.getenv("MONGODB_DB")
    client = AsyncIOMotorClient(MONGODB_URL)
    models: list[type[Document]] = [User, Admin, Purchase, Payment, Shelf, ICCard, AdminLog, SystemSetting]
    await init_beanie(
        database=client[MONGODB_DB], # type: ignore
        document_models=models,
    )
    response = input("This will delete all data in the database. Are you sure? (y/n): ")
    if response != "y":
        print("Operation cancelled.")
        client.close()
        return
    
    for model in models:
        await model.get_pymongo_collection().delete_many({})
    
    client.close()
    
if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
    
    
     
    