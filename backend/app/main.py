from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.database import engine, Base
from app.models import models
from app.api import endpoints

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CSA_APP API")

# Configurar CORS (Permitir requests desde el frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambiar por el dominio de Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejador global para violaciones de integridad de Base de Datos
@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    error_str = str(exc.orig).lower() if hasattr(exc, "orig") else str(exc).lower()
    
    if "unique constraint" in error_str or "duplicate" in error_str:
        if "vehiculos.patente" in error_str or "vehiculos.primary" in error_str or "patente" in error_str:
            message = "Ya existe un vehículo registrado con esta patente en el sistema."
        elif "configuracion_servicios" in error_str:
            message = "Ya existe una configuración de servicio con esta palabra clave."
        else:
            message = "Ya existe un registro con estos datos únicos en el sistema."
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": message}
        )
        
    if "foreign key constraint" in error_str or "foreignkey" in error_str:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "La operación no puede realizarse porque depende de registros que no existen o están en uso."}
        )
        
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "No se pudo guardar la información debido a una restricción de datos en el sistema."}
    )

# Manejador global para otros errores de Base de Datos
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ocurrió un problema al acceder a la base de datos. Por favor, intenta nuevamente."}
    )

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Taller Mecánico"}

app.include_router(endpoints.router, prefix="/api")
