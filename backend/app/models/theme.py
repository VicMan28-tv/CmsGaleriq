from sqlalchemy import Column, Integer, String
from app.core.db import Base, DB_SCHEMA, IS_SQLITE

_TABLE_ARGS = {} if IS_SQLITE else {"schema": DB_SCHEMA}

class Theme(Base):
    __tablename__ = "themes"
    __table_args__ = _TABLE_ARGS

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Default")
    primary_color = Column(String(20), default="#8b5cf6")
    secondary_color = Column(String(20), default="#f5f3ff")
    accent_color = Column(String(20), default="#a78bfa")
    background_color = Column(String(20), default="#faf5ff")
    text_color = Column(String(20), default="#1f2937")
    mode = Column(String(10), default="light")
