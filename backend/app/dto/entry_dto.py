
# app/dto/entry_dto.py
from pydantic import BaseModel
from typing import Dict, Any, Optional, Literal

Status = Literal["DRAFT","PUBLISHED","ARCHIVED"]

class EntryCreateDTO(BaseModel):
    id: str
    content_type_id: str
    title: Optional[str] = None
    fields: Dict[str, Any] = {}

class EntryUpdateDTO(BaseModel):
    title: Optional[str] = None
    fields: Optional[Dict[str, Any]] = None
    status: Optional[Status] = None
