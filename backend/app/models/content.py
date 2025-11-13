
# app/models/content.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON as SQLiteJSON
from datetime import datetime
from app.core.db import Base, DB_SCHEMA, IS_SQLITE

# En SQLite no usamos schemas; en Postgres sí.
_TABLE_ARGS = {} if IS_SQLITE else {"schema": DB_SCHEMA}

class ContentType(Base):
    __tablename__ = "content_types"
    __table_args__ = _TABLE_ARGS
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    api_id = Column(String, unique=True, nullable=False)
    schema = Column(SQLiteJSON, nullable=False, default=list)
    owner_email = Column(String, nullable=False, index=True)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    entries = relationship("Entry", back_populates="content_type", cascade="all, delete-orphan")

class Entry(Base):
    __tablename__ = "entries"
    __table_args__ = _TABLE_ARGS
    id = Column(String, primary_key=True)
    # En Postgres con esquemas, el FK debe incluir el esquema; en SQLite no.
    content_type_fk = (
        f"{DB_SCHEMA}.content_types.id" if not IS_SQLITE else "content_types.id"
    )
    content_type_id = Column(String, ForeignKey(content_type_fk), nullable=False, index=True)
    title = Column(String, nullable=True)
    status = Column(String, default="DRAFT")  # DRAFT | PUBLISHED | ARCHIVED
    fields = Column(SQLiteJSON, nullable=False, default=dict)  # values by fieldId
    created_by = Column(String, nullable=False)
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    content_type = relationship("ContentType", back_populates="entries")
