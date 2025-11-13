from pydantic import BaseModel

class ThemeCreateDTO(BaseModel):
    name: str
    primary_color: str
    secondary_color: str
    accent_color: str
    background_color: str
    text_color: str
    mode: str
