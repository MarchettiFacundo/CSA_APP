from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./csa_app.db")

# Ajuste para proveedores (Render/Heroku) que configuran 'postgres://' en lugar de 'postgresql://'
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Optimización para PostgreSQL en la nube (Neon Serverless con PgBouncer)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=180,  # Reciclar conexiones inactivas cada 3 min para evitar caídas de socket
        pool_size=5,       # Mantener pocas conexiones persistentes en serverless
        max_overflow=10,
        connect_args={
            "connect_timeout": 10,
            "application_name": "csa_app"
        }
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
