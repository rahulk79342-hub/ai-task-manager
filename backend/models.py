from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey,  Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from database import Base

#Python Enum - defines allowed status values
class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    Done = "done"
    
class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    

#USER TABLE
#Each class = one table in the database

class User(Base):
    __tablename__= "users" #actual SQL table name
    
    id      = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email       =Column(String, unique=True, index=True, nullable=False)
    name        = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    #Relationship - User. tasks give you all task for this user
    
    tasks = relationship("Task", back_populates="owner", cascade="all, delete")
    
    
#Task Table
class Task(Base):
    __tablename__ = "tasks"
    
    
    id       = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title       = Column(String, nullable=False)
    description     = Column(String, nullable=True)  #nullable=True means optional
    status      = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority       = Column(Enum(Priority), default=Priority.MEDIUM)
    due_date        =Column(DateTime(timezone=True), nullable=True)
    ai_summary      =Column(String, nullable=True)   #stores Claude's AI response
    created_at      =Column(DateTime(timezone=True), server_default=func.now())
    updated_at      =Column(DateTime(timezone=True), onupdate=func.now())
    
    
    #Foreign Key - links each task to a user
    owner_id        = Column(String, ForeignKey("users.id"), nullable=False)
    owner       = relationship("User", back_populates="tasks")
    
    