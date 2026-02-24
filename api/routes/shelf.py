from fastapi import APIRouter, HTTPException
from schema import ShelfCreate, ShelfOut
from models import Shelf
from datetime import datetime, timezone


router = APIRouter(prefix="/shelves")

@router.post("/", response_model=ShelfOut)
async def create_shelf(s: ShelfCreate):
    now = datetime.now(timezone.utc)

    shelf = Shelf(
        usb_port=s.usb_port,
        price=s.price,
        created_at=now,
        updated_at=now
    )
    await shelf.insert()
    return shelf

@router.get("/")
async def list_shelves():
    return {"shelves": await Shelf.find().to_list()}
