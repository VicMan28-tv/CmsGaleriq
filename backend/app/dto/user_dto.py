# backend/app/dto/user_dto.py
from __future__ import annotations

from datetime import date
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

Gender = Literal["male", "female", "nonbinary", "prefer_not_to_say"]

class UserProfileUpdateDTO(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2)
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[Gender] = None

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


class PasswordChangeDTO(BaseModel):
    current_password: str = Field(min_length=8)
    new_password: str = Field(min_length=8)


class UserAdminCreateDTO(BaseModel):
    full_name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = "employee"
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[Gender] = "prefer_not_to_say"


class UserAdminUpdateDTO(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2)
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    gender: Optional[Gender] = None
    password: Optional[str] = Field(default=None, min_length=8)
