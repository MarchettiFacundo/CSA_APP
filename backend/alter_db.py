from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE clientes ADD COLUMN apellido VARCHAR;"))
            print("Columna apellido agregada.")
        except Exception as e:
            print("Error agregando apellido:", e)
        
        try:
            conn.execute(text("ALTER TABLE clientes ADD COLUMN dni VARCHAR UNIQUE;"))
            print("Columna dni agregada.")
        except Exception as e:
            print("Error agregando dni:", e)
            
        try:
            conn.execute(text("ALTER TABLE vehiculos ADD COLUMN color VARCHAR;"))
            print("Columna color agregada.")
        except Exception as e:
            print("Error agregando color:", e)
        
        conn.commit()
        print("Migración completada.")

if __name__ == "__main__":
    run_migration()
