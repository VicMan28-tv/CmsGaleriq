# backend/app/core/db.py
from __future__ import annotations

import os
from typing import Generator

from dotenv import load_dotenv, find_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import secrets

try:
    # Carga explícita de backend/.env independientemente del cwd
    _BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    _ENV_PATH = os.path.join(_BASE_DIR, ".env")
    if os.path.exists(_ENV_PATH):
        load_dotenv(_ENV_PATH)
    else:
        load_dotenv()  # fallback
except Exception:
    load_dotenv()

# ------------------------------------------------------------------
# Config
# ------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# Detectar schema desde la cadena (search_path). Por defecto "public".
def _detect_schema_from_url(url: str) -> str:
    url_lower = (url or "").lower()
    if "search_path%3d" in url_lower:  # url-encoded: options=-csearch_path%3Dtest
        try:
            return url_lower.split("search_path%3d", 1)[1].split("&", 1)[0]
        except Exception:
            return "public"
    if "search_path=" in url_lower:
        try:
            return url_lower.split("search_path=", 1)[1].split("&", 1)[0]
        except Exception:
            return "public"
    return "public"

DB_SCHEMA = _detect_schema_from_url(DATABASE_URL) if not IS_SQLITE else "main"

# ------------------------------------------------------------------
# Engine / Session / Base
# ------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def ensure_schema_and_search_path() -> None:
    """
    Para Postgres, crea el esquema si no existe y fija el search_path.
    En SQLite no aplica.
    """
    if IS_SQLITE:
        return
    with engine.connect() as conn:
        # crear esquema si no existe
        conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{DB_SCHEMA}"'))
        # fijar search_path (defensivo, por si el driver ignora options)
        conn.execute(text(f"SET search_path TO {DB_SCHEMA}"))
        conn.commit()


def ensure_user_profile_columns() -> None:
    """Asegura columnas opcionales en tabla usuarios: birthdate y gender.
    Ejecuta ALTER TABLE sólo si faltan. Soporta SQLite y Postgres.
    """
    try:
        with engine.connect() as conn:
            if IS_SQLITE:
                # listar columnas via PRAGMA
                cols = conn.execute(text("PRAGMA table_info('usuarios')")).fetchall()
                names = {row[1] for row in cols}  # name en segunda columna
                if "birthdate" not in names:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN birthdate DATE"))
                if "gender" not in names:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN gender VARCHAR(32)"))
            else:
                # Postgres: information_schema
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema = :schema AND table_name = 'usuarios'"
                ), {"schema": DB_SCHEMA}).fetchall()
                names = {r[0] for r in result}
                if "birthdate" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".usuarios ADD COLUMN IF NOT EXISTS birthdate DATE"))
                if "gender" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".usuarios ADD COLUMN IF NOT EXISTS gender VARCHAR(32)"))
            conn.commit()
    except Exception as e:
        # No romper el arranque por esto; sólo log
        print(f"⚠️ No fue posible asegurar columnas opcionales: {e}")


def ensure_content_columns() -> None:
    """Asegura columnas opcionales para content_types y entries.
    - content_types: owner_email, created_by, updated_by
    - entries: created_by, updated_by
    """
    try:
        with engine.connect() as conn:
            if IS_SQLITE:
                # content_types
                ct_cols = conn.execute(text("PRAGMA table_info('content_types')")).fetchall()
                ct_names = {row[1] for row in ct_cols}
                if "owner_email" not in ct_names:
                    conn.execute(text("ALTER TABLE content_types ADD COLUMN owner_email VARCHAR"))
                if "created_by" not in ct_names:
                    conn.execute(text("ALTER TABLE content_types ADD COLUMN created_by VARCHAR"))
                if "updated_by" not in ct_names:
                    conn.execute(text("ALTER TABLE content_types ADD COLUMN updated_by VARCHAR"))

                # entries
                e_cols = conn.execute(text("PRAGMA table_info('entries')")).fetchall()
                e_names = {row[1] for row in e_cols}
                if "created_by" not in e_names:
                    conn.execute(text("ALTER TABLE entries ADD COLUMN created_by VARCHAR"))
                if "updated_by" not in e_names:
                    conn.execute(text("ALTER TABLE entries ADD COLUMN updated_by VARCHAR"))
            else:
                # Postgres
                def ensure_pg_columns(table: str, columns: list[str]):
                    result = conn.execute(text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = :schema AND table_name = :table"
                    ), {"schema": DB_SCHEMA, "table": table}).fetchall()
                    names = {r[0] for r in result}
                    for col in columns:
                        if col not in names:
                            conn.execute(text(
                                f"ALTER TABLE \"{DB_SCHEMA}\".{table} ADD COLUMN IF NOT EXISTS {col} VARCHAR"
                            ))

                ensure_pg_columns("content_types", ["owner_email", "created_by", "updated_by"])
                ensure_pg_columns("entries", ["created_by", "updated_by"])
            conn.commit()
    except Exception as e:
        print(f"⚠️ No fue posible asegurar columnas de contenido: {e}")


def ensure_api_key_columns() -> None:
    """Asegura columnas opcionales para api_keys:
    - space_id
    - delivery_token
    - preview_token
    También inicializa valores faltantes para filas existentes.
    """
    try:
        with engine.connect() as conn:
            if IS_SQLITE:
                cols = conn.execute(text("PRAGMA table_info('api_keys')")).fetchall()
                names = {row[1] for row in cols}
                if "space_id" not in names:
                    conn.execute(text("ALTER TABLE api_keys ADD COLUMN space_id VARCHAR(64)"))
                if "delivery_token" not in names:
                    conn.execute(text("ALTER TABLE api_keys ADD COLUMN delivery_token VARCHAR(128)"))
                if "preview_token" not in names:
                    conn.execute(text("ALTER TABLE api_keys ADD COLUMN preview_token VARCHAR(128)"))
                if "created_by" not in names:
                    conn.execute(text("ALTER TABLE api_keys ADD COLUMN created_by VARCHAR(255)"))
                # Inicializar valores faltantes
                conn.execute(text("UPDATE api_keys SET space_id = substr(replace(replace(hex(randomblob(16)),'-',''),'_',''),1,16) WHERE space_id IS NULL"))
                # Generar tokens urlsafe usando randomblob como fallback en SQL
                conn.execute(text("UPDATE api_keys SET delivery_token = hex(randomblob(32)) WHERE delivery_token IS NULL"))
                conn.execute(text("UPDATE api_keys SET preview_token = hex(randomblob(32)) WHERE preview_token IS NULL"))
            else:
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_schema = :schema AND table_name = 'api_keys'"
                ), {"schema": DB_SCHEMA}).fetchall()
                names = {r[0] for r in result}
                if "space_id" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".api_keys ADD COLUMN IF NOT EXISTS space_id VARCHAR(64)"))
                if "delivery_token" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".api_keys ADD COLUMN IF NOT EXISTS delivery_token VARCHAR(128)"))
                if "preview_token" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".api_keys ADD COLUMN IF NOT EXISTS preview_token VARCHAR(128)"))
                if "created_by" not in names:
                    conn.execute(text(f"ALTER TABLE \"{DB_SCHEMA}\".api_keys ADD COLUMN IF NOT EXISTS created_by VARCHAR(255)"))
            conn.commit()
        # Backfill seguro usando Python (evita dependencias de extensiones en Postgres)
        from sqlalchemy import text as _t
        db = SessionLocal()
        try:
            rows = db.execute(_t(
                f"SELECT id, space_id, delivery_token, preview_token, created_by FROM {'api_keys' if IS_SQLITE else '"'+DB_SCHEMA+'".api_keys'}"
            )).fetchall()
            for r in rows:
                id_, sp, dt, pt, _cb = r
                updates = {}
                if sp is None:
                    # generar ID corto y urlsafe
                    updates["space_id"] = secrets.token_urlsafe(12).replace("-", "").replace("_", "")[:16]
                if dt is None:
                    updates["delivery_token"] = secrets.token_urlsafe(32)
                if pt is None:
                    updates["preview_token"] = secrets.token_urlsafe(32)
                if updates:
                    set_clause = ", ".join([f"{k} = :{k}" for k in updates.keys()])
                    table = 'api_keys' if IS_SQLITE else f'"{DB_SCHEMA}".api_keys'
                    db.execute(_t(f"UPDATE {table} SET {set_clause} WHERE id = :id"), {**updates, "id": id_})
            db.commit()
        finally:
            db.close()
    except Exception as e:
        print(f"⚠️ No fue posible asegurar columnas de api_keys: {e}")


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
