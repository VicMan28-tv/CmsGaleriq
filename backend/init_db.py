import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from app.core.db import Base, engine, ensure_schema_and_search_path
from app.models import user, api_key, theme, content

# Cargar variables de entorno
load_dotenv()

def init_database():
    print("Inicializando la base de datos...")
    
    # Asegurar que el esquema existe y configurar search_path
    ensure_schema_and_search_path()
    
    # Crear todas las tablas definidas en los modelos
    Base.metadata.create_all(bind=engine)
    
    print("Base de datos inicializada correctamente.")

if __name__ == "__main__":
    init_database()