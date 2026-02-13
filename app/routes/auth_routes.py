from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user_schema import UserCreate

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    hashed_pw = hash_password(user.password)

    new_user = User(
        username=user.username,
        password=hashed_pw
    )

    db.add(new_user)
    db.commit()

    return {"message": "User created"}


@router.post("/login")
def login(user: UserCreate, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.username == user.username).first()

    if not db_user or not verify_password(user.password, db_user.password):
        return {"error": "Invalid credentials"}

    return {"message": "Login successful"}
