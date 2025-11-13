
# app/routes/entries.py
from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.services.content_service import ContentService
from app.dto.entry_dto import EntryCreateDTO, EntryUpdateDTO
from app.core.auth import get_current_user

router = APIRouter(prefix="/entries", tags=["entries"])

@router.get("")
def list_entries(content_type_id: Optional[str] = Query(None), service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.list_entries(current_user["email"], content_type_id)

@router.get("/{id}")
def get_entry(id: str, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    # Permitir lectura del detalle para cualquier usuario; escritura sigue protegida en el servicio
    obj = service.get_entry(id)
    return obj

@router.post("")
def create_entry(payload: EntryCreateDTO, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.create_entry(payload, current_user["email"])

@router.put("/{id}")
def update_entry(id: str, payload: EntryUpdateDTO, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.update_entry(id, payload, current_user["email"])

@router.post("/{id}/publish")
def publish_entry(id: str, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.publish_entry(id, current_user["email"])

@router.delete("/{id}")
def delete_entry(id: str, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.delete_entry(id, current_user["email"])
