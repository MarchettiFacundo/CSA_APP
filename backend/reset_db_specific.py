import os
from sqlalchemy import create_engine, text
from app.models.models import Base
from app.database import engine

def reset_specific_tables():
    tables_to_drop = [
        "servicios_realizados",
        "ordenes_trabajo",
        "turnos",
        "servicios_periodicos",
        "checklists_agencias",
        "vehiculos",
        "clientes"
    ]
    
    print("Conectando a la base de datos para eliminar tablas específicas...")
    with engine.connect() as conn:
        # Desactivamos temporalmente la verificación de FK o usamos CASCADE en PostgreSQL
        for table in tables_to_drop:
            try:
                print(f"Eliminando tabla {table} (con CASCADE si aplica)...")
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
            except Exception as e:
                print(f"Error al eliminar la tabla {table}: {e}")
        conn.commit()
    
    print("\nCreando de nuevo las tablas con el nuevo esquema...")
    # Base.metadata.create_all crea únicamente las tablas que falten en la base de datos.
    # Como eliminamos las tablas anteriores, SQLAlchemy las volverá a crear con la estructura actual del código.
    # Las tablas 'movimientos_financieros' y 'configuracion_servicios' no se tocarán porque ya existen.
    Base.metadata.create_all(bind=engine)
    print("Tablas recreadas con éxito. Base de datos reseteada parcialmente sin afectar movimientos_financieros.")

if __name__ == "__main__":
    reset_specific_tables()
