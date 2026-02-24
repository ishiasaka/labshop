from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
import os
import jwt
from datetime import datetime, timedelta
import logging

import yaml

TOKEN_URL = "/admin/token"
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")

http_bearer_scheme = HTTPBearer()

logger = logging.getLogger(__name__)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: str
    username: str
    full_name: str




def encode_token(data: TokenData, expires_in: int = 3600) -> str:
    to_encode = data.model_dump()
    expire = datetime.now() + timedelta(seconds=expires_in)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str) -> TokenData:
    print(f"Decoding token: {token}")
    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    return TokenData(
        id=decoded.get("id") or "",
        username=decoded.get("username") or "",
        full_name=decoded.get("full_name") or ""
    )
    

def get_current_admin(credential: HTTPAuthorizationCredentials = Depends(http_bearer_scheme)) -> TokenData:
    token = credential.credentials
    print(f"Received token: {token}")
    credentials_expection = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token_data = decode_token(token)
        if not token_data.id:
            raise credentials_expection
        return token_data
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        raise credentials_expection
    
