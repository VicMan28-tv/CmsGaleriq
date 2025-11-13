from pydantic import BaseModel
from typing import Optional

class ApiKeyCreateDTO(BaseModel):
    name: str
    description: Optional[str] = None
