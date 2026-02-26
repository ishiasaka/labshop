from fastapi import APIRouter, HTTPException
from schema import ShelfCreate, ShelfOut
from models import Shelf
from datetime import datetime, timezone


router = APIRouter(prefix="/shelves")

@router.post("/", response_model=ShelfOut)
async def create_shelf(s: ShelfCreate):
    now = datetime.now(timezone.utc)
    if await Shelf.find_one(Shelf.shelf_id == s.shelf_id):
        raise HTTPException(400, "Shelf already exists")
    
    shelf = await Shelf.find_one(Shelf.usb_port == s.usb_port)
    if shelf:
        shelf.shelf_id = s.shelf_id
        shelf.price = s.price
        shelf.updated_at = now
        await shelf.save()
        return shelf

    shelf = Shelf(
        shelf_id=s.shelf_id,
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



@router.delete("/{shelf_id}")
async def delete_shelf(shelf_id: str):
    shelf = await Shelf.find_one(Shelf.shelf_id == shelf_id)
    if not shelf:
        raise HTTPException(404, "Shelf not found")
    
    await shelf.delete()
    return {"message": f"Shelf {shelf_id} deleted successfully"}
