# backend/app/models/user.py
from __future__ import annotations

from sqlalchemy import Column, String, Integer, DateTime, Boolean, Date
from sqlalchemy.sql import func
from app.core.db import Base, DB_SCHEMA, IS_SQLITE

_TABLE_ARGS = {} if IS_SQLITE else {"schema": DB_SCHEMA}

class User(Base):
    __tablename__ = "usuarios"
    __table_args__ = _TABLE_ARGS

    # Agregamos id como clave primaria
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, index=True, nullable=False)

    full_name = Column(String, nullable=False)
    password = Column(String, nullable=False)  # hash
    phone = Column(String, nullable=True)

    # Nuevos campos de perfil
    birthdate = Column(Date, nullable=True)
    gender = Column(String, nullable=True)

    status = Column(Boolean, default=True, nullable=True)
    role_id = Column(Integer, nullable=True, default=2)  # 1=admin, 2=employee
    plan_id = Column(Integer, nullable=True)

    profile_image = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    registration_date = Column(DateTime, server_default=func.now(), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, onupdate=func.now(), nullable=True)

    DEFAULT_ROLE_ID = 2
