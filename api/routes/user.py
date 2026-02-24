
from fastapi import APIRouter, HTTPException, Depends
from models import User, AdminLog, UserStatus
from schema import UserOut, UserCreate, UsersOut
from services.auth import get_current_admin, TokenData
from datetime import datetime, timezone
from beanie import PydanticObjectId


router = APIRouter(prefix="/users")


@router.get("/", response_model=UsersOut)
async def list_users():
    return {"users": await User.find().to_list()}

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    user = await User.find_one(User.student_id == int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserOut)
async def create_user(
    user: UserCreate,
    admin: TokenData = Depends(get_current_admin),
):
    now = datetime.now(timezone.utc)

    if await User.find_one(User.student_id == user.student_id):
        raise HTTPException(status_code=400, detail="Student ID already exists")

    new_user = User(
        student_id=user.student_id,
        first_name=user.first_name,
        last_name=user.last_name,
        account_balance=0,
        status=UserStatus.active,
        created_at=now,
        updated_at=now,
    )
    await new_user.insert()

    await AdminLog(
        admin_id=PydanticObjectId(admin.id),
        admin_name=admin.full_name,
        action=f"Created student {new_user.first_name} {new_user.last_name}",
        target=f"Student {new_user.student_id}",
        targeted_student_id=new_user.student_id,
        created_at=now,
    ).insert()

    return new_user

