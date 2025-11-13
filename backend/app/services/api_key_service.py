from sqlalchemy.orm import Session
from app.models.api_key import ApiKey
from app.core.db import get_db
from fastapi import Depends

class ApiKeyService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def list(self):
        return self.db.query(ApiKey).all()

    def create(self, payload, user_email: str | None = None):
        data = payload.dict()
        if user_email:
            data["created_by"] = user_email
        obj = ApiKey(**data)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, id: int):
        obj = self.db.query(ApiKey).filter(ApiKey.id == id).first()
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
