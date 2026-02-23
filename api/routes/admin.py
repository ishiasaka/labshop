from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from models import Admin
from schema import AdminCreate, AdminRole, AdminLogin
from typing import Annotated
from services.auth import Token, TokenData
import services.auth as auth
import bcrypt
import jwt
import os

router = APIRouter(prefix="/admin")

@router.post("/", description="Create a new admin user")
async def create_admin_user(data: AdminCreate):
    existing = await Admin.find_one(Admin.username == data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    password_bytes = data.password.encode('utf-8')

    salt = bcrypt.gensalt()
    hashed_password_bytes = bcrypt.hashpw(password_bytes, salt)

    hashed_password = hashed_password_bytes.decode('utf-8')

    new_admin = Admin( 
        username=data.username,
        first_name=data.first_name,
        last_name=data.last_name,
        password_hash=hashed_password, 
        role=AdminRole.admin
    )

    
    await new_admin.insert()
    
    return {"message": "Admin successfully created", "username": data.username}

@router.post("/login", description="Admin user login")
async def admin_login(credentials: AdminLogin):
    admin = await Admin.find_one(Admin.username == credentials.username)

    print(f"Admin found: {admin}")

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

    token = auth.encode_token(
        TokenData(
            id=str(admin.id),
            username=admin.username,
            full_name=full_name
        )
    )

    return {
        "admin_id": str(admin.id),
        "full_name": full_name,
        "token": token
    }

@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    login_data = await admin_login(AdminLogin(username=form_data.username, password=form_data.password))
    return Token(access_token=login_data["token"], token_type="bearer")