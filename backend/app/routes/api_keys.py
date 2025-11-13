from fastapi import APIRouter, Depends
from app.services.api_key_service import ApiKeyService
from app.dto.api_key_dto import ApiKeyCreateDTO
from app.core.auth import get_role, require_admin, get_current_user

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

@router.get("", dependencies=[Depends(get_role)])
def list_api_keys(service: ApiKeyService = Depends()):
    return service.list()

@router.post("", dependencies=[Depends(require_admin)])
def create_api_key(payload: ApiKeyCreateDTO, service: ApiKeyService = Depends(), current_user: dict = Depends(get_current_user)):
    return service.create(payload, current_user.get("email"))

@router.delete("/{id}", dependencies=[Depends(require_admin)])
def delete_api_key(id: int, service: ApiKeyService = Depends()):
    ok = service.delete(id)
    return {"ok": bool(ok)}
