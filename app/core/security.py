from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password[:72])

def verify_password(plain, hashed):
    return pwd_context.verify(plain[:72], hashed)
from fastapi import Header, HTTPException

FAKE_TOKEN = "supersecrettoken"

def require_auth(token: str = Header(None)):
    if token != FAKE_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")
