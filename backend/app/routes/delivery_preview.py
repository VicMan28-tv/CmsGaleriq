from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.db import get_db
from app.models.api_key import ApiKey
from app.models.content import ContentType, Entry


delivery_router = APIRouter(prefix="/delivery", tags=["delivery"])
preview_router = APIRouter(prefix="/preview", tags=["preview"])


def _extract_bearer(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    try:
        scheme, token = auth_header.split(" ", 1)
        if scheme.lower() == "bearer":
            return token.strip()
    except Exception:
        return None
    return None


def _validate_delivery(db: Session, token: Optional[str], space_id: Optional[str]) -> ApiKey:
    if not token:
        raise HTTPException(status_code=401, detail="Missing delivery token")
    key = db.query(ApiKey).filter(ApiKey.delivery_token == token).first()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid delivery token")
    if space_id and key.space_id and key.space_id != space_id:
        raise HTTPException(status_code=403, detail="Invalid space id for token")
    return key


def _validate_preview(db: Session, token: Optional[str], space_id: Optional[str]) -> ApiKey:
    if not token:
        raise HTTPException(status_code=401, detail="Missing preview token")
    key = db.query(ApiKey).filter(ApiKey.preview_token == token).first()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid preview token")
    if space_id and key.space_id and key.space_id != space_id:
        raise HTTPException(status_code=403, detail="Invalid space id for token")
    return key


@delivery_router.get("/{space_id}/content_types")
def delivery_list_content_types(
    space_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_delivery_token: Optional[str] = Header(default=None, alias="X-Delivery-Token"),
):
    token = x_delivery_token or _extract_bearer(authorization)
    _validate_delivery(db, token, space_id)
    return db.query(ContentType).order_by(ContentType.created_at.desc()).all()


@delivery_router.get("/{space_id}/entries")
def delivery_list_entries(
    space_id: str,
    db: Session = Depends(get_db),
    content_type_id: Optional[str] = Query(default=None, description="Puede ser el id o el api_id del ContentType"),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_delivery_token: Optional[str] = Header(default=None, alias="X-Delivery-Token"),
):
    token = x_delivery_token or _extract_bearer(authorization)
    _validate_delivery(db, token, space_id)
    q = db.query(Entry).filter(Entry.status == "PUBLISHED")
    if content_type_id:
        # Aceptar tanto el id real como el api_id del ContentType
        ct = (
            db.query(ContentType)
            .filter(or_(ContentType.id == content_type_id, ContentType.api_id == content_type_id))
            .first()
        )
        if not ct:
            # Si no existe ese ContentType, devolver lista vacía
            return []
        q = q.filter(Entry.content_type_id == ct.id)
    return q.order_by(Entry.created_at.desc()).all()


@preview_router.get("/{space_id}/content_types")
def preview_list_content_types(
    space_id: str,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_preview_token: Optional[str] = Header(default=None, alias="X-Preview-Token"),
):
    token = x_preview_token or _extract_bearer(authorization)
    _validate_preview(db, token, space_id)
    return db.query(ContentType).order_by(ContentType.created_at.desc()).all()


@preview_router.get("/{space_id}/entries")
def preview_list_entries(
    space_id: str,
    db: Session = Depends(get_db),
    content_type_id: Optional[str] = Query(default=None, description="Puede ser el id o el api_id del ContentType"),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
    x_preview_token: Optional[str] = Header(default=None, alias="X-Preview-Token"),
):
    token = x_preview_token or _extract_bearer(authorization)
    _validate_preview(db, token, space_id)
    q = db.query(Entry)
    if content_type_id:
        ct = (
            db.query(ContentType)
            .filter(or_(ContentType.id == content_type_id, ContentType.api_id == content_type_id))
            .first()
        )
        if not ct:
            return []
        q = q.filter(Entry.content_type_id == ct.id)
    return q.order_by(Entry.created_at.desc()).all()