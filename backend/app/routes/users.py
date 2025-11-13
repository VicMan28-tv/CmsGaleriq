# backend/app/routes/users.py
from __future__ import annotations

import os
import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.auth import get_current_user, get_role
from app.core.security import verify_password, hash_password, ROLE_MAP_INT2STR, ROLE_MAP_STR2INT
from app.models.user import User
from app.services.user_service import create_user
from app.dto.user_dto import UserProfileUpdateDTO, PasswordChangeDTO

router = APIRouter(prefix="/users", tags=["users"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role_id: int = 1
    phone: str | None = None
    birthdate: date | None = None
    gender: str | None = None


@router.post("", status_code=201)
def create_user_endpoint(payload: UserCreate, db: Session = Depends(get_db)):
    try:
        u = create_user(db, **payload.model_dump())
        # Devolvemos un identificador lógico (email) para consistencia con el frontend
        return {"ok": True, "id": u.email}
    except ValueError as e:
        if str(e) == "El email ya está registrado" or str(e) == "email_taken":
            raise HTTPException(409, "El email ya está registrado")
        raise


# === Perfil del usuario autenticado ===

# Directorio de avatares (alineado con auth.register)
AVATAR_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(AVATAR_DIR, exist_ok=True)


def _user_to_payload(u: User):
    return {
        "user_id": u.email,
        "email": u.email,
        "role": ROLE_MAP_INT2STR.get(u.role_id or 2, "employee"),
        "full_name": u.full_name,
        "phone": u.phone,
        "birthdate": u.birthdate.isoformat() if u.birthdate else None,
        "gender": u.gender,
        "avatar_url": u.profile_image,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    u = db.query(User).filter(User.email == current_user["email"].lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return _user_to_payload(u)

@router.get("")
def list_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    role: str = Depends(get_role),
    role_filter: str | None = None,
    page: int = 1,
    limit: int = 10,
):
    """Lista usuarios registrados.
    - Cualquier rol autenticado puede ver.
    - Permite filtrar por rol ("admin" | "empleado" | "employee").
    - Paginación simple por `page` y `limit`.
    """
    q = db.query(User)
    if role_filter:
        role_id = ROLE_MAP_STR2INT.get(role_filter.lower())
        if role_id:
            q = q.filter(User.role_id == role_id)
    # Orden más reciente primero
    q = q.order_by(User.created_at.desc())
    # Paginación
    page = max(page, 1)
    limit = max(min(limit, 100), 1)
    offset = (page - 1) * limit
    items = q.offset(offset).limit(limit).all()
    data = [_user_to_payload(u) for u in items]
    total = db.query(User).count() if not role_filter else db.query(User).filter(User.role_id == ROLE_MAP_STR2INT.get(role_filter.lower(), 0)).count()
    return {"items": data, "page": page, "limit": limit, "total": total}


@router.put("/me")
def update_my_profile(payload: UserProfileUpdateDTO, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    u = db.query(User).filter(User.email == current_user["email"].lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    # Actualizar campos permitidos
    if payload.full_name is not None:
        u.full_name = payload.full_name
    if payload.phone is not None:
        u.phone = payload.phone
    if payload.birthdate is not None:
        u.birthdate = payload.birthdate
    if payload.gender is not None:
        u.gender = payload.gender
    db.commit()
    db.refresh(u)
    return _user_to_payload(u)


@router.put("/me/password")
def change_my_password(payload: PasswordChangeDTO, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    u = db.query(User).filter(User.email == current_user["email"].lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not verify_password(payload.current_password, u.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    u.password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Contraseña actualizada"}


@router.put("/me/avatar")
async def update_my_avatar(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    u = db.query(User).filter(User.email == current_user["email"].lower()).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="Tipo de imagen inválido. Usa JPG o PNG.")
    file_id = uuid.uuid4().hex
    filename = f"{file_id}{ext}"
    file_path = os.path.join(AVATAR_DIR, filename)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    u.profile_image = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(u)
    return _user_to_payload(u)
