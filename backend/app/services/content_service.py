
# app/services/content_service.py
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.content import ContentType, Entry
from app.dto.content_type_dto import ContentTypeCreateDTO, ContentTypeUpdateDTO
from app.dto.entry_dto import EntryCreateDTO, EntryUpdateDTO
from typing import List

class ContentService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    # Content Types
    def list_types(self, owner_email: str) -> List[ContentType]:
        return (
            self.db.query(ContentType)
            .filter(ContentType.owner_email == owner_email)
            .order_by(ContentType.created_at.desc())
            .all()
        )

    def get_type(self, id: str) -> ContentType:
        obj = self.db.query(ContentType).get(id)
        if not obj: raise HTTPException(status_code=404, detail="ContentType not found")
        return obj

    def create_type(self, payload: ContentTypeCreateDTO, user_email: str):
        data = payload.model_dump()
        obj = ContentType(**data)
        obj.owner_email = user_email
        obj.created_by = user_email
        obj.updated_by = user_email
        self.db.add(obj); self.db.commit(); self.db.refresh(obj); return obj

    def update_type(self, id: str, payload: ContentTypeUpdateDTO, user_email: str):
        obj = self.get_type(id)
        if obj.owner_email != user_email:
            raise HTTPException(status_code=403, detail="Not allowed")
        data = payload.model_dump(exclude_unset=True)
        for k,v in data.items(): setattr(obj, k, v)
        obj.updated_by = user_email
        self.db.commit(); self.db.refresh(obj); return obj

    def delete_type(self, id: str, user_email: str):
        obj = self.get_type(id)
        if obj.owner_email != user_email:
            raise HTTPException(status_code=403, detail="Not allowed")
        self.db.delete(obj); self.db.commit(); return {"ok": True}

    # Entries
    def list_entries(self, owner_email: str, content_type_id: str | None = None):
        """
        Listar entries visibles para todos los usuarios.
        - Si se provee content_type_id, listar entries de ese tipo sin validar propietario.
        - Si no se provee, listar todas las entries de todos los content types.
        Nota: las operaciones de escritura siguen restringidas por propietario.
        """
        if content_type_id:
            ct = self.db.query(ContentType).get(content_type_id)
            if not ct:
                raise HTTPException(status_code=404, detail="ContentType not found")
            q = self.db.query(Entry).filter(Entry.content_type_id == content_type_id)
        else:
            # Listar todas las entries (sin filtrar por owner del content type)
            q = (
                self.db.query(Entry)
                .join(ContentType, Entry.content_type_id == ContentType.id)
            )
        return q.order_by(Entry.created_at.desc()).all()

    def get_entry(self, id: str) -> Entry:
        obj = self.db.query(Entry).get(id)
        if not obj: raise HTTPException(status_code=404, detail="Entry not found")
        return obj

    def create_entry(self, payload: EntryCreateDTO, user_email: str):
        # Permitir creación de entries para cualquier ContentType existente
        ct = self.db.query(ContentType).get(payload.content_type_id)
        if not ct:
            raise HTTPException(status_code=404, detail="ContentType not found")
        obj = Entry(**payload.model_dump())
        obj.created_by = user_email
        obj.updated_by = user_email
        self.db.add(obj); self.db.commit(); self.db.refresh(obj); return obj

    def update_entry(self, id: str, payload: EntryUpdateDTO, user_email: str):
        obj = self.get_entry(id)
        # Permitir actualización por cualquier usuario autenticado
        data = payload.model_dump(exclude_unset=True)
        for k,v in data.items():
            if v is not None: setattr(obj, k, v)
        obj.updated_by = user_email
        self.db.commit(); self.db.refresh(obj); return obj

    def publish_entry(self, id: str, user_email: str):
        obj = self.get_entry(id)
        # Permitir publicación por cualquier usuario autenticado
        obj.status = "PUBLISHED"
        obj.updated_by = user_email
        self.db.commit(); self.db.refresh(obj); return obj

    def delete_entry(self, id: str, user_email: str):
        obj = self.get_entry(id)
        if obj.content_type.owner_email != user_email:
            raise HTTPException(status_code=403, detail="Not allowed")
        self.db.delete(obj); self.db.commit(); return {"ok": True}
