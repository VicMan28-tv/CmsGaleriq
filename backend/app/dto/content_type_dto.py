
# app/dto/content_type_dto.py
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class FieldDef(BaseModel):
    id: str
    name: str
    type: str
    required: bool = False
    localized: bool = False
    validations: Optional[List[Dict[str, Any]]] = None
    items: Optional[Dict[str, Any]] = None
    linkType: Optional[str] = None
    # Configuración específica por tipo (short/long/list, min/max, many, etc.)
    config: Optional[Dict[str, Any]] = None

class ContentTypeCreateDTO(BaseModel):
    id: str = Field(..., description="Internal ID (cuid/uuid)")
    name: str
    api_id: str
    schema: List[FieldDef] = []

class ContentTypeUpdateDTO(BaseModel):
    name: Optional[str] = None
    schema: Optional[List[FieldDef]] = None
