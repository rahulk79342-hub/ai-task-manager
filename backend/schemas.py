from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models import TaskStatus, Priority


#AUTH  SCHEMAS
#What the frontend sends when registering
class UserRegister(BaseModel):
    name:   str
    email:  EmailStr    #Pydantic auto-validates it's a real email format
    password: str
    

#what the frontend sends when logging in
class UserLogin(BaseModel):
    email:  EmailStr
    password:   str
    

#what we send Back - never include password!
class UserOut(BaseModel):
    id:     str
    name:   str
    email:  str
    model_config ={"from_attributes": True}  #allows creating from SQLAlchemy object
    
    
#Login response -  user + JWT Token
class Token(BaseModel):
    access_token:   str
    token_type:     str = "bearer"
    user:       UserOut
    
    

#   TASK  SCHEMAS
#What frontend sends to CREATE A TASK
class TaskCreate(BaseModel):
    title:  str
    description: Optional[str] = None
    priority:  Priority     = Priority.MEDIUM
    due_date:   Optional[datetime] = None
    

#What frontend sends to UPDATE a task(all fields optional)
class TaskUpdate(BaseModel):
    title:  Optional[str]   =None
    description:    Optional[str]   =None
    status:     Optional[TaskStatus]   =None
    priority:  Optional[Priority]   =None
    due_date:   Optional[datetime]  =None
    

#What we send BACK when returning a task
class TaskOut(BaseModel):
    id:     str
    title:  str
    description:   Optional[str]
    status: TaskStatus
    priority: Priority
    due_date:   Optional[datetime]
    ai_summary: Optional[str]
    created_at:  datetime
    model_config = {"from_attributes": True}
    
    