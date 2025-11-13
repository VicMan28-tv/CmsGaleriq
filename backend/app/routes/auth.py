# backend/app/routes/auth.py
from __future__ import annotations

import os
import uuid
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import verify_password, create_access_token, ROLE_MAP_INT2STR
from app.models.user import User
from app.services.user_service import create_user

router = APIRouter(prefix="/auth", tags=["auth"])

AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)


def _calc_age(b: date) -> float:
    return (date.today() - b).days / 365.25


@router.post("/register")
async def register(
    full_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: Optional[str] = Form(None),
    birthdate: Optional[str] = Form(None),
    gender: Optional[str] = Form("prefer_not_to_say"),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    # Email ya registrado
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")

    # Validación de birthdate (ISO yyyy-mm-dd) y edad >= 18
    parsed_birthdate: Optional[date] = None
    if birthdate:
        try:
            parsed_birthdate = datetime.strptime(birthdate, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usa yyyy-mm-dd.")
        age = _calc_age(parsed_birthdate)
        if age < 18:
            raise HTTPException(status_code=400, detail="Debes ser mayor de 18 años.")

    # Normalizar gender
    allowed_genders = {"male", "female", "nonbinary", "prefer_not_to_say"}
    gender_norm = (gender or "prefer_not_to_say").lower()
    if gender_norm not in allowed_genders:
        gender_norm = "prefer_not_to_say"

    # Manejo de avatar (opcional)
    avatar_url: Optional[str] = None
    if avatar is not None:
        ext = os.path.splitext(avatar.filename)[1].lower()
        if ext not in {".jpg", ".jpeg", ".png"}:
            raise HTTPException(status_code=400, detail="Tipo de imagen inválido. Usa JPG o PNG.")
        # Guardar archivo
        file_id = uuid.uuid4().hex
        filename = f"{file_id}{ext}"
        file_path = os.path.join(AVATAR_DIR, filename)
        content = await avatar.read()
        with open(file_path, "wb") as f:
            f.write(content)
        avatar_url = f"/uploads/avatars/{filename}"

    # Crear usuario
    user = create_user(
        db=db,
        email=email,
        password=password,
        role_id=2,
        full_name=full_name,
        phone=phone,
        birthdate=parsed_birthdate,
        gender=gender_norm,
        profile_image=avatar_url,
    )

    return JSONResponse(
        status_code=201,
        content={
            "message": "Usuario creado correctamente.",
            "user": {
                "user_id": user.email,
                "email": user.email,
                "role": ROLE_MAP_INT2STR.get(user.role_id or 2, "employee"),
                "full_name": user.full_name,
                "phone": user.phone,
                "birthdate": user.birthdate.isoformat() if user.birthdate else None,
                "gender": user.gender,
                "avatar_url": user.profile_image,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
        },
    )

from pydantic import BaseModel, EmailStr

class LoginDTO(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(payload: LoginDTO, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    ok = False
    try:
        ok = verify_password(payload.password, user.password)
    except Exception:
        ok = False

    if not ok:
        # Fallback para hashes antiguos en bcrypt
        try:
            from passlib.context import CryptContext
            if user.password.startswith("$2a$") or user.password.startswith("$2b$") or user.password.startswith("$2y$"):
                bcrypt_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
                ok = bcrypt_ctx.verify(payload.password, user.password)
        except Exception:
            ok = False

    if not ok:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(subject=user.email, role_id=user.role_id or 2)
    role_name = ROLE_MAP_INT2STR.get(user.role_id or 2, "employee")

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "user_id": user.email,
            "email": user.email,
            "role": role_name,
            "full_name": user.full_name,
            "phone": user.phone,
            "birthdate": user.birthdate.isoformat() if user.birthdate else None,
            "gender": user.gender,
            "avatar_url": user.profile_image,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        },
    }
