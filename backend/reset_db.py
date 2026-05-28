import os
from sqlalchemy import create_engine
from app.models.models import Base
from app.database import engine

print("Dropping all tables...")
Base.metadata.drop_all(bind=engine)

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Database reset successfully.")
