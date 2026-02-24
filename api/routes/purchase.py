from fastapi import APIRouter, HTTPException
from schema import PurchaseCreate, PurchaseOut
from datetime import datetime, timezone
from models import Purchase, User, Shelf, SystemSetting, PurchaseStatus
from schema import PurchasesOut

router = APIRouter(prefix="/purchases")

@router.get("/", response_model=PurchasesOut)
async def list_purchases():
    return {"purchases": await Purchase.find().to_list()}

@router.post("/", response_model=PurchaseOut)
async def create_purchase(p: PurchaseCreate):
    now = datetime.now(timezone.utc)

    
    student = await User.find_one(
        User.student_id == p.student_id,
    )
    if not student:
        raise HTTPException(400, "Student does not exist")

    shelf = await Shelf.find_one(
        Shelf.id == p.shelf_id,
    )
    if not shelf:
        raise HTTPException(400, "Shelf does not exist")

    price = shelf.price
    limit_doc = await SystemSetting.find_one(
        SystemSetting.key == "max_debt_limit",
    )
    max_limit = int(limit_doc.value) if limit_doc else 2000

    if student.account_balance + price > max_limit:
        raise HTTPException(400, "Debt limit reached")
    
    purchase = await student.make_purchase(
        shelf_id=p.shelf_id,
        price=price,
    )

    return purchase

