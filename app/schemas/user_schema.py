from pydantic import BaseModel, EmailStr


# Used for registration
class UserCreate(BaseModel):

    username: str
    email: EmailStr
    password: str


# Used for login
class UserLogin(BaseModel):

    username: str
    password: str


# Used for response
class UserResponse(BaseModel):

    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True
