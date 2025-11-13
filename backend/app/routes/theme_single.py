from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.models.theme import Theme

from pydantic import BaseModel


router = APIRouter(prefix="/api", tags=["theme"])


class ThemeUpdateDTO(BaseModel):
    name: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    mode: Optional[str] = None


def _get_active_theme(db: Session) -> Theme:
    """Obtiene el tema activo (primer registro) o crea uno por defecto."""
    t = db.query(Theme).order_by(Theme.id.asc()).first()
    if not t:
        t = Theme()
        db.add(t)
        db.commit()
        db.refresh(t)
    return t


@router.get("/theme")
def get_theme(db: Session = Depends(get_db)):
    """Devuelve el tema activo único para toda la web."""
    return _get_active_theme(db)


@router.put("/theme")
def update_theme(
    payload: ThemeUpdateDTO,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    """
    Actualiza el tema activo. Si se provee `X-API-Key`, se valida contra la base de datos.
    Lectura es pública; escritura puede integrarse con API Keys o JWT.
    """
    if x_api_key:
        # Validación opcional de API Key
        from app.models.api_key import ApiKey

        key_obj = db.query(ApiKey).filter(ApiKey.token == x_api_key).first()
        if not key_obj:
            raise HTTPException(status_code=401, detail="Invalid API key")

    t = _get_active_theme(db)
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return t


@router.get("/theme/css")
def get_theme_css(db: Session = Depends(get_db)):
    """
    Devuelve las variables CSS del tema activo para ser consumidas por galeriq-web.
    Formato CSS custom properties listo para usar.
    """
    from fastapi.responses import Response
    
    theme = _get_active_theme(db)
    
    # Generar CSS con variables personalizadas
    css_content = f"""/* Tema generado automáticamente desde CMS Galeriq */
:root {{
  --primary-color: {theme.primary_color or '#6366f1'};
  --secondary-color: {theme.secondary_color or '#8b5cf6'};
  --accent-color: {theme.accent_color or '#06b6d4'};
  --background-color: {theme.background_color or '#ffffff'};
  --text-color: {theme.text_color or '#1f2937'};
  --theme-mode: {theme.mode or 'light'};
}}

/* Clases de utilidad para aplicar colores */
.primary-bg {{ background-color: var(--primary-color); }}
.secondary-bg {{ background-color: var(--secondary-color); }}
.accent-bg {{ background-color: var(--accent-color); }}
.primary-text {{ color: var(--primary-color); }}
.secondary-text {{ color: var(--secondary-color); }}
.accent-text {{ color: var(--accent-color); }}

/* Estilos específicos para galeriq-web */
.hero-section {{
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}}

.btn-primary {{
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}}

.btn-primary:hover {{
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}}

.navbar {{
  background-color: var(--background-color);
  color: var(--text-color);
}}

.card {{
  background-color: var(--background-color);
  border-color: var(--primary-color);
}}
"""
    
    return Response(
        content=css_content,
        media_type="text/css",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "*"
        }
    )