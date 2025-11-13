# backend/app/services/user_service.py
from __future__ import annotations

from sqlalchemy.orm import Session
from datetime import date

from app.core.security import hash_password, verify_password
from app.models.user import User


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.lower()).first()


def create_user(
    db: Session,
    *,
    full_name: str,
    email: str,
    password: str,
    phone: str | None = None,
    role_id: int | None = None,
    profile_image: str | None = None,
    birthdate: date | None = None,
    gender: str | None = None,
) -> User:
    if get_user_by_email(db, email):
        raise ValueError("El email ya está registrado")

    u = User(
        full_name=full_name,
        email=email.lower(),
        password=hash_password(password),
        phone=phone,
        role_id=role_id if role_id is not None else User.DEFAULT_ROLE_ID,
        status=True,
        profile_image=profile_image,
        birthdate=birthdate,
        gender=gender,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def ensure_seed_admin(db: Session, email: str, password: str) -> User:
    u = get_user_by_email(db, email)
    if u:
        # Si la contraseña actual no coincide con la de .env, la actualizamos
        try:
            if not verify_password(password, u.password):
                u.password = hash_password(password)
                db.commit()
                db.refresh(u)
        except Exception:
            # En caso de hash incompatible, volvemos a generarlo
            u.password = hash_password(password)
            db.commit()
            db.refresh(u)
        return u
    return create_user(
        db,
        full_name="Administrador",
        email=email,
        password=password,
        role_id=1,  # 1=admin
    )
