from fastapi import APIRouter, Depends, HTTPException
from app.services.theme_service import ThemeService
from app.dto.theme_dto import ThemeCreateDTO
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/themes", tags=["themes"])

class ThemeUpdateDTO(BaseModel):
    name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    mode: Optional[str] = None

@router.get("")
def list_themes(service: ThemeService = Depends()):
    return service.list()

@router.post("")
def create_theme(payload: ThemeCreateDTO, service: ThemeService = Depends()):
    return service.create(payload)

@router.get("/{theme_id}")
def get_theme(theme_id: int, service: ThemeService = Depends()):
    theme = service.get(theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    return theme

@router.put("/{theme_id}")
def update_theme(theme_id: int, payload: ThemeUpdateDTO, service: ThemeService = Depends()):
    theme = service.get(theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    
    # Actualizar solo los campos proporcionados
    update_data = payload.dict(exclude_unset=True)
    return service.update(theme_id, update_data)

@router.delete("/{theme_id}")
def delete_theme(theme_id: int, service: ThemeService = Depends()):
    theme = service.get(theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Tema no encontrado")
    
    service.delete(theme_id)
    return {"message": "Tema eliminado correctamente"}
