import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Cargar variables de entorno
load_dotenv()

# Configuración de la base de datos
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
SCHEMA_NAME = os.getenv("SCHEMA_NAME", "test")

# Crear URL de conexión con parámetros de codificación
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?client_encoding=utf8"

# Crear motor de base de datos
engine = create_engine(DATABASE_URL)

def fix_usuarios_table():
    print("Corrigiendo la tabla usuarios...")
    
    # Conectar a la base de datos
    with engine.connect() as connection:
        # Verificar si el esquema existe
        schema_exists = connection.execute(
            text(f"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '{SCHEMA_NAME}')")
        ).scalar()
        
        if not schema_exists:
            print(f"Creando esquema {SCHEMA_NAME}...")
            connection.execute(text(f"CREATE SCHEMA {SCHEMA_NAME}"))
            connection.commit()
        
        # Verificar si la tabla usuarios existe
        table_exists = connection.execute(
            text(f"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '{SCHEMA_NAME}' AND table_name = 'usuarios')")
        ).scalar()
        
        # Si la tabla existe, eliminarla para recrearla con la estructura correcta
        if table_exists:
            print("La tabla usuarios existe, recreandola con la estructura correcta...")
            connection.execute(text(f"DROP TABLE IF EXISTS {SCHEMA_NAME}.usuarios CASCADE"))
            connection.commit()
        
        # Crear la tabla usuarios con la estructura correcta
        connection.execute(text(f"""
            CREATE TABLE {SCHEMA_NAME}.usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                status BOOLEAN DEFAULT TRUE,
                role_id INTEGER,
                plan_id INTEGER,
                profile_image VARCHAR(255),
                created_by INTEGER,
                updated_by INTEGER,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        connection.commit()
        
        # Crear usuario administrador por defecto
        connection.execute(text(f"""
            INSERT INTO {SCHEMA_NAME}.usuarios (
                email, full_name, password, status, role_id
            ) VALUES (
                'admin@demo.com', 'Admin User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', TRUE, 1
            )
        """))
        connection.commit()
        
        print("Tabla usuarios corregida exitosamente")
        print("Usuario administrador creado: admin@demo.com (contrasena: secret)")

if __name__ == "__main__":
    fix_usuarios_table()