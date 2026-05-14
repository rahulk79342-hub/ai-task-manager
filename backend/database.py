from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv


load_dotenv()

#Get database URL from .env
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./taskdb.sqlite ")

#SQLite needs this extra argument: PostgreSQL doesn't
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else{}

#engine = the actual connection to the database file/server
engine = create_engine(DATABASE_URL, connect_args=connect_args)

#SessionLocal - factory for database sessions
#Each request gets its own session (like opening/closing a connection)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind= engine)

#Base = parent class for all your database models(tables)
Base = declarative_base()


#Dependency function - use this in FastAPI route functions 
#Automatically closes the DB session after each request

def get_db():
    db = SessionLocal()
    try:
        yield db  #give db session to thr route function
    finally:
        db.close()   #always close, even if an error occured