# Script para probar la conexión a la base de datos
from app.core.db import engine, SessionLocal
from sqlalchemy import text

def test_connection():
    try:
        # Intenta conectar a la base de datos
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Conexión exitosa a la base de datos")
            return True
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

if __name__ == "__main__":
    test_connection()