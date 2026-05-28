from app.database import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        # Añadir kilometraje a vehículos
        try:
            conn.execute(text("ALTER TABLE vehiculos ADD COLUMN kilometraje INTEGER;"))
            print("Columna vehiculos.kilometraje agregada.")
        except Exception as e:
            print("Error agregando vehiculos.kilometraje:", str(e))

        # Añadir kilometraje a ordenes
        try:
            conn.execute(text("ALTER TABLE ordenes_trabajo ADD COLUMN kilometraje INTEGER;"))
            print("Columna ordenes_trabajo.kilometraje agregada.")
        except Exception as e:
            print("Error agregando ordenes_trabajo.kilometraje:", str(e))

        # Añadir estado a servicios periódicos
        try:
            conn.execute(text("ALTER TABLE servicios_periodicos ADD COLUMN estado VARCHAR DEFAULT 'Pendiente';"))
            print("Columna servicios_periodicos.estado agregada.")
            # Actualizar existentes a Pendiente por si hay Nulos
            conn.execute(text("UPDATE servicios_periodicos SET estado = 'Pendiente' WHERE estado IS NULL;"))
        except Exception as e:
            print("Error agregando servicios_periodicos.estado:", str(e))
            
        # Crear tabla de configuraciones
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS configuracion_servicios (
                    id SERIAL PRIMARY KEY,
                    palabra_clave VARCHAR NOT NULL,
                    meses_vencimiento INTEGER NOT NULL,
                    km_vencimiento INTEGER NOT NULL
                );
            """))
            print("Tabla configuracion_servicios creada/verificada.")
            
            # Insertar valores por defecto si está vacía
            res = conn.execute(text("SELECT COUNT(*) FROM configuracion_servicios")).scalar()
            if res == 0:
                conn.execute(text("""
                    INSERT INTO configuracion_servicios (palabra_clave, meses_vencimiento, km_vencimiento)
                    VALUES 
                    ('aceite', 12, 10000),
                    ('distribucion', 60, 60000),
                    ('filtro', 12, 10000)
                """))
                print("Valores por defecto insertados en configuracion_servicios.")
        except Exception as e:
            print("Error con configuracion_servicios:", str(e))

        conn.commit()
        print("Migración completada.")

if __name__ == "__main__":
    run_migration()
