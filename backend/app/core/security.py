# backend/app/core/security.py
from __future__ import annotations

import os
import datetime as dt
from typing import Dict

from jose import jwt
from passlib.context import CryptContext
from jose import JWTError

# ---- Config JWT ----
SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-change-me")
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))

# ---- Password hashing ----
# Usando pbkdf2_sha256 temporalmente para evitar problemas con bcrypt
_pwd_ctx = CryptContext(
    schemes=["pbkdf2_sha256"], 
    deprecated="auto",
    pbkdf2_sha256__rounds=29000
)


def hash_password(plain: str) -> str:
    # Validar que la contraseña no exceda 72 bytes (límite de bcrypt)
    if len(plain.encode('utf-8')) > 72:
        raise ValueError("La contraseña no puede exceder 72 bytes")
    return _pwd_ctx.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    # Validar que la contraseña no exceda 72 bytes (límite de bcrypt)
    if len(plain.encode('utf-8')) > 72:
        return False
    return _pwd_ctx.verify(plain, hashed)


def create_access_token(subject: str, role_id: int, minutes: int | None = None) -> str:
    expire = dt.datetime.utcnow() + dt.timedelta(minutes=minutes or ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "role_id": role_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Invalid token")


# ---- Roles helpers (lo que te estaba faltando) ----
# 1 = admin, 2 = empleado
ROLE_MAP_STR2INT: Dict[str, int] = {
    "admin": 1,
    "empleado": 2,
    "employee": 2,  # alias aceptado
}
ROLE_MAP_INT2STR: Dict[int, str] = {v: k for k, v in ROLE_MAP_STR2INT.items()}
