import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la URL de la base de datos del archivo .env
DATABASE_URL = os.getenv("DATABASE_URL")

# Extraer los componentes de la URL de la base de datos
# Formato: postgresql://usuario:contraseña@host:puerto/nombre_db
parts = DATABASE_URL.replace("postgresql://", "").split("@")
credentials = parts[0].split(":")
host_parts = parts[1].split("/")
host_port = host_parts[0].split(":")
db_name = host_parts[1].split("?")[0]

user = credentials[0]
password = credentials[1]
host = host_port[0]
port = host_port[1]

# Extraer el esquema de la URL
schema = "test"  # Por defecto usamos 'test' como en la configuración

try:
    # Conectar a la base de datos
    conn = psycopg2.connect(
        dbname=db_name,
        user=user,
        password=password,
        host=host,
        port=port
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    print("Conexión exitosa a la base de datos")
    
    # Verificar si el esquema existe
    cursor.execute(f"SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = '{schema}')")
    schema_exists = cursor.fetchone()[0]
    
    if not schema_exists:
        print(f"Creando esquema {schema}...")
        cursor.execute(f"CREATE SCHEMA {schema}")
    
    # Verificar si la tabla usuarios existe
    cursor.execute(f"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = '{schema}' AND table_name = 'usuarios')")
    table_exists = cursor.fetchone()[0]
    
    # Si la tabla existe, eliminarla para recrearla con la estructura correcta
    if table_exists:
        print("La tabla usuarios existe, recreándola con la estructura correcta...")
        cursor.execute(f"DROP TABLE IF EXISTS {schema}.usuarios CASCADE")
    
    # Crear la tabla usuarios con la estructura correcta
    cursor.execute(f"""
        CREATE TABLE {schema}.usuarios (
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
    """)
    
    # Crear usuario administrador por defecto
    cursor.execute(f"""
        INSERT INTO {schema}.usuarios (
            email, full_name, password, status, role_id
        ) VALUES (
            'admin@demo.com', 'Admin User', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', TRUE, 1
        )
    """)
    
    print("Tabla usuarios corregida exitosamente")
    print("Usuario administrador creado: admin@demo.com (contraseña: secret)")
    
    # Cerrar la conexión
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")