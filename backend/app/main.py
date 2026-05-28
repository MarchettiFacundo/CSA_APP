from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del Taller Mecánico"}

app.include_router(endpoints.router, prefix="/api")
