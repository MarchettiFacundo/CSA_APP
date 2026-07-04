import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    print("Error: DATABASE_URL no está configurado en el archivo .env")
    exit(1)

print("Conectando a la base de datos para realizar la migración...")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Verificar si la columna ya existe para evitar errores
        res = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='movimientos_financieros' AND column_name='metodo_pago';
        """)).fetchone()
        
        if not res:
            print("Agregando columna 'metodo_pago' a 'movimientos_financieros'...")
            # Agregar la columna con un valor default
            conn.execute(text("ALTER TABLE movimientos_financieros ADD COLUMN metodo_pago VARCHAR DEFAULT 'Efectivo';"))
            # Poner la columna como NOT NULL
            conn.execute(text("ALTER TABLE movimientos_financieros ALTER COLUMN metodo_pago SET NOT NULL;"))
            conn.commit()
            print("Columna 'metodo_pago' agregada correctamente.")
        else:
            print("La columna 'metodo_pago' ya existe en 'movimientos_financieros'. No se requiere acción.")
except Exception as e:
    print(f"Error durante la migración: {e}")
    exit(1)
