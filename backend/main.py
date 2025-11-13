# backend/main.py
from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.db import Base, engine, SessionLocal, ensure_schema_and_search_path, ensure_user_profile_columns, ensure_content_columns, ensure_api_key_columns

# importa modelos para que se creen las tablas
from app.models import api_key, theme, user  # noqa: F401
from app.models.api_key import ApiKey        # noqa: F401
from app.models.theme import Theme           # noqa: F401
from app.models.user import User             # noqa: F401
from app.models.content import ContentType, Entry  # noqa: F401

# routers
from app.routes.root import router as root_router
from app.routes.auth import router as auth_router
from app.routes.api_keys import router as api_keys_router
from app.routes.themes import router as themes_router
from app.routes.theme_single import router as theme_single_router
from app.routes.content_types import router as content_types_router
from app.routes.entries import router as entries_router
from app.routes.users import router as users_router
from app.routes.roles import router as roles_router
from app.routes.images import router as images_router
from app.routes.delivery_preview import delivery_router, preview_router

# Eliminado: verificación/creación automática del usuario admin en el startup

app = FastAPI(title="Galeriq CMS API", version="0.1.0")

# CORS (Vite)
# Permite puertos dinámicos de Vite (5170–5179) y orígenes configurables por env.
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_ORIGIN", ""),
    "http://127.0.0.1:5173", "http://localhost:5173",
    "http://127.0.0.1:5174", "http://localhost:5174",
    "http://127.0.0.1:5175", "http://localhost:5175",
    "http://127.0.0.1:5176", "http://localhost:5176",
]
# Filtra valores vacíos por si no se definió FRONTEND_ORIGIN
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):517\d",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# estáticos (avatares)
os.makedirs("uploads/avatars", exist_ok=True)
app.mount("/static/avatars", StaticFiles(directory="uploads/avatars"), name="avatars")

# DB: schema + tablas
ensure_schema_and_search_path()
Base.metadata.create_all(bind=engine)
# Migración ligera: columnas opcionales de perfil
ensure_user_profile_columns()
# Migración ligera: columnas de contenido (owner/auditoría)
ensure_content_columns()
# Migración ligera: columnas de api_keys (space_id & tokens)
ensure_api_key_columns()
try:
    from app.core.db import DATABASE_URL, IS_SQLITE, DB_SCHEMA
    print(f"🔧 DB_URL={DATABASE_URL} | IS_SQLITE={IS_SQLITE} | SCHEMA={DB_SCHEMA}")
except Exception:
    pass

# routers
app.include_router(root_router)
app.include_router(auth_router)
app.include_router(api_keys_router)
app.include_router(themes_router)
app.include_router(theme_single_router)
app.include_router(content_types_router)
app.include_router(entries_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(images_router)
app.include_router(delivery_router)
app.include_router(preview_router)

# estáticos (imágenes)
os.makedirs("uploads/images", exist_ok=True)
app.mount("/static/images", StaticFiles(directory="uploads/images"), name="images")
app.include_router(api_keys_router)
app.include_router(themes_router)
app.include_router(content_types_router)
app.include_router(entries_router)
# app.include_router(users_router)

# seed admin
@app.on_event("startup")
def startup_message():
    # Mostrar únicamente un mensaje indicando que el backend corre correctamente
    print("✅ Backend CMS iniciado correctamente")

@app.get("/health/db")
def health_db():
    # endpoint para verificar conexión
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/")
def root():
    return {"ok": True, "service": "Galeriq CMS API"}
