import secrets
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.core.db import Base, DB_SCHEMA, IS_SQLITE

_TABLE_ARGS = {} if IS_SQLITE else {"schema": DB_SCHEMA}

class ApiKey(Base):
    __tablename__ = "api_keys"
    __table_args__ = _TABLE_ARGS

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    # Usuario que creó la API key (email)
    created_by = Column(String(255), nullable=True, index=True)
    token = Column(
        String(128),
        nullable=False,
        index=True,
        unique=True,
        default=lambda: secrets.token_urlsafe(32),
    )
    # Identificador de espacio (similar a Contentful)
    space_id = Column(String(64), nullable=True, index=True, unique=True, default=lambda: ApiKey.generate_space_id())
    # Tokens de acceso de lectura
    delivery_token = Column(String(128), nullable=True, index=True, unique=True, default=lambda: secrets.token_urlsafe(32))
    preview_token = Column(String(128), nullable=True, index=True, unique=True, default=lambda: secrets.token_urlsafe(32))
    created_at = Column(DateTime, default=datetime.utcnow)

    @staticmethod
    def generate_token() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def generate_space_id() -> str:
        # Espacio corto, urlsafe
        return secrets.token_urlsafe(12).replace("-", "").replace("_", "")[:16]
