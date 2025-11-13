import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Obtener la URL de la base de datos
db_url = os.getenv("DATABASE_URL")

def check_database_structure():
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Verificar si existe el esquema 'test'
        cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'test';")
        schema_exists = cur.fetchone()
        
        if not schema_exists:
            print("El esquema 'test' no existe. Creándolo...")
            cur.execute("CREATE SCHEMA test;")
            conn.commit()
            print("Esquema 'test' creado correctamente.")
        else:
            print("El esquema 'test' ya existe.")
        
        # Verificar si existe la tabla 'usuarios'
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'test' AND table_name = 'usuarios';")
        table_exists = cur.fetchone()
        
        if not table_exists:
            print("La tabla 'usuarios' no existe. Creándola...")
            cur.execute("""
            CREATE TABLE test.usuarios (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'active',
                role_id INTEGER DEFAULT 2,
                plan_id INTEGER,
                profile_image VARCHAR(255),
                created_by VARCHAR(255),
                updated_by VARCHAR(255),
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP
            );
            """)
            conn.commit()
            print("Tabla 'usuarios' creada correctamente.")
        else:
            print("La tabla 'usuarios' ya existe.")
            
            # Verificar la estructura de la tabla
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'test' AND table_name = 'usuarios';")
            columns = [col[0] for col in cur.fetchall()]
            print("Columnas en la tabla usuarios:", columns)
        
        conn.close()
        return True
    except Exception as e:
        print(f"Error al verificar la estructura de la base de datos: {e}")
        return False

if __name__ == "__main__":
    check_database_structure()