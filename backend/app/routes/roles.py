# backend/app/routes/roles.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

from app.core.db import get_db
from app.core.auth import require_admin
from app.core.security import ROLE_MAP_STR2INT, ROLE_MAP_INT2STR
from app.models.user import User

router = APIRouter(prefix="/roles", tags=["roles"])

class RoleInfo(BaseModel):
    id: int
    name: str

class UserRoleUpdate(BaseModel):
    user_id: str  # email del usuario
    role_id: int

@router.get("", response_model=List[RoleInfo])
def get_available_roles():
    """Obtiene todos los roles disponibles en el sistema"""
    roles = []
    for name, role_id in ROLE_MAP_STR2INT.items():
        # Solo incluimos roles únicos (employee y empleado son el mismo)
        if name != "employee":  # Excluimos el alias
            roles.append(RoleInfo(id=role_id, name=name))
    return roles

@router.put("/assign", status_code=200, dependencies=[Depends(require_admin)])
def assign_role_to_user(payload: UserRoleUpdate, db: Session = Depends(get_db)):
    """Asigna un rol a un usuario existente"""
    # Verificar que el rol existe
    if payload.role_id not in ROLE_MAP_INT2STR:
        raise HTTPException(status_code=400, detail="El rol especificado no existe")
    
    # Buscar el usuario
    user = db.query(User).filter(User.email == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Actualizar el rol
    user.role_id = payload.role_id
    db.commit()
    
    return {"message": f"Rol actualizado correctamente a {ROLE_MAP_INT2STR[payload.role_id]}"}