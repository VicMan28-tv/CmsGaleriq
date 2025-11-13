from sqlalchemy.orm import Session
from app.models.theme import Theme
from app.core.db import get_db
from fastapi import Depends

class ThemeService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def list(self):
        return self.db.query(Theme).all()

    def get(self, theme_id: int):
        return self.db.query(Theme).filter(Theme.id == theme_id).first()

    def create(self, payload):
        obj = Theme(**payload.dict())
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj
        
    def update(self, theme_id: int, update_data: dict):
        theme = self.get(theme_id)
        for key, value in update_data.items():
            setattr(theme, key, value)
        self.db.commit()
        self.db.refresh(theme)
        return theme
        
    def delete(self, theme_id: int):
        theme = self.get(theme_id)
        self.db.delete(theme)
        self.db.commit()
        return True
