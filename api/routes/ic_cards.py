from beanie import PydanticObjectId
from fastapi import APIRouter, HTTPException, Depends
from schema import ICCardCreate, UserStatus
from datetime import datetime, timezone
from models import AdminLog, ICCard, Purchase, User, Shelf, SystemSetting
from services.ws import ws_connection_manager, WSSchema

from schema import CardRegistrationRequest, ICCardStatus, PurchaseStatus, ScanRequest
from services.auth import get_current_admin, TokenData


router = APIRouter(prefix="/ic_cards")

@router.get('/', description="Get all active IC cards")
async def get_active_ic_cards():
    cards = await ICCard.find(ICCard.status == ICCardStatus.active).to_list()
    return cards

@router.get("/captured", description="Get latest captured unlinked IC card for admin registration")
async def get_captured_ic_cards():
    card = await (
        ICCard.find(
            ICCard.student_id == None,
            ICCard.status == ICCardStatus.active
        )
        .sort(-ICCard.updated_at)
        .first_or_none()
    )
    return {"uid": card.uid} if card else {"uid": None}

@router.post("/", description="Create a new IC card")
async def create_ic_card(card: ICCardCreate):
    now = datetime.now(timezone.utc)

    if card.student_id:
        if not await User.find_one(User.student_id == card.student_id):
            raise HTTPException(400, "Student does not exist")

    if await ICCard.find_one(ICCard.uid == card.uid):
        raise HTTPException(400, "UID already exists")

    ic = ICCard(
        uid=card.uid.strip().lower(),
        student_id=card.student_id,
        status=card.status,
        created_at=now,
        updated_at=now
    )
    await ic.insert()
    return ic

@router.post("/{uid}/register", description="Register an IC card to a student")
async def register_card(uid: str, data: CardRegistrationRequest, admin: TokenData = Depends(get_current_admin)):
    
    uid = uid.strip().lower()    

    student = await User.find_one(User.student_id == data.student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    
    existing_card = await ICCard.find_one(
        ICCard.student_id == data.student_id, 
        ICCard.status == ICCardStatus.active,
        ICCard.uid != uid  
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
            card = await ICCard.find_one(ICCard.uid == uid, session=session)

            if card and card.status != ICCardStatus.active:
                raise HTTPException(400, "Card is deactivated. Cannot link it.")
            
            if card:
                if card.status == ICCardStatus.active and card.student_id is not None:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Card {uid} is already linked to Student {card.student_id}"
                    )
                card.student_id = data.student_id
                card.status = ICCardStatus.active
                await card.save(session=session)
            else:
                await ICCard(
                    uid=uid.strip().lower(),
                    student_id=data.student_id,
                    status=ICCardStatus.active,
                    created_at=now,
                    updated_at=now
                ).insert(session=session) 

            await AdminLog(
                admin_id=PydanticObjectId(admin.id),
                admin_name=admin.full_name,
                action=f"Linked card {uid} to student {data.student_id}",
                target=f"Student: {student.first_name} {student.last_name}",
                targeted_student_id=data.student_id,
                created_at=now
            ).insert(session=session) 

    return {"message": f"Card {uid} linked to student {data.student_id} by {admin.full_name}"}

@router.post("/{uid}/deactivate", description="Deactivate an IC card")
async def deactivate_card(uid: str, admin: TokenData = Depends(get_current_admin)):
    client = User.get_pymongo_collection().database.client
    now = datetime.now(timezone.utc)
    
    async with await client.start_session() as session:
        async with session.start_transaction():

            card = await ICCard.find_one(ICCard.uid == uid, session=session)
            if not card:
                raise HTTPException(404, "Card not found")

            old_id = card.student_id

            card.status = ICCardStatus.deactivated
            card.student_id = None 
            await card.save(session=session)

            await AdminLog(
                admin_id=PydanticObjectId(admin.id),
                admin_name=admin.full_name,
                action=f"Deactivated card {uid}",
                target=f"Disconnected from Student: {old_id}",
                targeted_student_id=old_id,
                created_at=now
            ).insert(session=session)

    return {"message": f"Card {uid} successfully deactivated and logged."}

@router.post("/{uid}/unlink", description="Unlink an IC card from its student (keep card active)")
async def unlink_card(uid: str, admin: TokenData = Depends(get_current_admin)):
    client = User.get_pymongo_collection().database.client
    now = datetime.now(timezone.utc)

    async with await client.start_session() as session:
        async with session.start_transaction():
            card = await ICCard.find_one(ICCard.uid == uid, session=session)
            if not card:
                raise HTTPException(404, "Card not found")

            old_id = card.student_id
            if old_id is None:
                raise HTTPException(400, "Card is not linked to any student")

            # Keep active, just unlink
            card.student_id = None
            card.updated_at = now
            await card.save(session=session)

            await AdminLog(
                admin_id=PydanticObjectId(admin.id),
                admin_name=admin.full_name,
                action=f"Unlinked card {uid}",
                target=f"Was linked to Student: {old_id}",
                targeted_student_id=old_id,
                created_at=now
            ).insert(session=session)

    return {"message": f"Card {uid} unlinked"}

@router.post("/scan", description="Scan an IC card")
async def card_scan(scan: ScanRequest):
    uid = scan.normalized_uid
    usb_port = scan.usb_port

    now = scan.timestamp or datetime.now(timezone.utc)
    card = await ICCard.find_one(ICCard.uid == uid)
    
    ADMIN_PORT = 5

    if usb_port == ADMIN_PORT:
        print(f">>> ADMIN MODE ACTIVATED ON PORT [{usb_port}] FOR UID: {uid}")
        
        if not card or card.student_id is None:
            if card:
                await card.set({ICCard.updated_at: now})
                print(">>> Updated existing unlinked card.")
            else:
                new_card = ICCard(
                    uid=uid.strip().lower(),
                    student_id=None, 
                    status=ICCardStatus.active,
                    created_at=now,
                    updated_at=now
                )
                await new_card.insert()
                print(">>> Successfully inserted NEW card to DB.")
            return {"status": "new_card", "message": "Card captured. Register in Admin."}
        if card.status != ICCardStatus.active:
            return {"status": "error", "message": "Card is not active"}

        student = await User.find_one(User.student_id == card.student_id)
        if not student:
            return {"status": "error", "message": "Student record missing."}
        
        if getattr(student, "status", None) == UserStatus.inactive:
            return {"status": "error", "message": "User is inactive"}

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
    
    if card.status != ICCardStatus.active:
        raise HTTPException(403, "Card is not active")

    client = User.get_pymongo_collection().database.client
    
    async with await client.start_session() as session:
        async with session.start_transaction():
            
            student = await User.find_one(User.student_id == card.student_id, session=session)
            if not student:
                raise HTTPException(404, "Student record not found")
            if getattr(student, "status", None) == UserStatus.inactive:
                raise HTTPException(403, "User is inactive")
            shelf = await Shelf.find_one(Shelf.usb_port == usb_port, session=session)
            if not shelf:
                raise HTTPException(404, f"Shelf on USB port {usb_port} not found")

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
                student_id=student.student_id,
                shelf_id=shelf.shelf_id,
                price=price,
                status=PurchaseStatus.completed,
                created_at=now
            )
            await new_purchase.insert(session=session)

            return {
                "status": "success",
                "student_name": student.first_name,
                "amount_charged": price,
                "new_balance": student.account_balance
            }



    