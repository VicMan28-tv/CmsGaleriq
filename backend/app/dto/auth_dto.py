# backend/app/dto/auth_dto.py
from __future__ import annotations

from datetime import date, datetime
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Gender = Literal["male", "female", "nonbinary", "prefer_not_to_say"]

# ---------- Requests ----------

class RegisterDTO(BaseModel):
    """
    Datos para registro. Si mandas 'avatar', el endpoint debe ser multipart
    y birthdate debe venir como ISO (yyyy-mm-dd).
    """
    full_name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[Gender] = "prefer_not_to_say"

    @field_validator("birthdate")
    @classmethod
    def must_be_18_plus(cls, v: Optional[date]):
        if v is None:
            return v
        from datetime import date as _d
        age = (_d.today() - v).days / 365.25
        if age < 18:
            raise ValueError("Debes ser mayor de 18 años.")
        return v


class LoginRequest(BaseModel):
    """
    Login por JSON: { email, password }
    """
    email: EmailStr
    password: str


# ---------- Responses ----------

class UserOut(BaseModel):
    """
    Respuesta de usuario para el frontend.
    OJO: el ID es string (UUID/hex), no int.
    """
    user_id: str
    email: EmailStr
    role: str                     # "admin" | "employee" | lo que uses
    full_name: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True   # Pydantic v2: permite .model_validate(ORM)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterResponse(BaseModel):
    user: UserOut
    message: str = "Usuario creado correctamente."
