
# app/routes/content_types.py
from fastapi import APIRouter, Depends
from typing import Optional
from app.services.content_service import ContentService
from app.dto.content_type_dto import ContentTypeCreateDTO, ContentTypeUpdateDTO
from app.core.auth import get_current_user

router = APIRouter(prefix="/content_types", tags=["content_types"])

@router.get("")
def list_types(service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.list_types(current_user["email"])

@router.get("/{id}")
def get_type(id: str, service: ContentService = Depends()):
    return service.get_type(id)

@router.post("")
def create_type(payload: ContentTypeCreateDTO, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.create_type(payload, current_user["email"])

@router.put("/{id}")
def update_type(id: str, payload: ContentTypeUpdateDTO, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.update_type(id, payload, current_user["email"])

@router.delete("/{id}")
def delete_type(id: str, service: ContentService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.delete_type(id, current_user["email"])
