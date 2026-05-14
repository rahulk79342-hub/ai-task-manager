from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from auth import get_current_user
import models, schemas

router = APIRouter()

#GET/api/tasks/ - return all task belonging to the logged-in user
@router.get("/", response_model=List[schemas.TaskOut])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # authentication
):
    
    #.filter() = SQL WHERE clause - only return THIS user's tasks
    return db.query(models.Task)\
        .filter(models.Task.owner_id == current_user.id)\
        .order_by(models.Task.created_at.desc())\
        .all()
        
        
#POST / api/tasks/ -create a new task
@router.post("/", response_model=schemas.TaskOut, status_code=201)
def create_task(
    body: schemas.TaskCreate,   #Pydantic validates incoming JSON
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = models.Task(**body.model_dump(),owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

#PATCH/ api/tasks/{task_id} - update fields(only what's provided)
@router.patch("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: str,
    body: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id  # Security: only update OWN Tasks
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    #Only update fields that were actually sent(exclude_unset=True)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value) #task.status = "done" etc.
        
    db.commit()
    db.refresh(task)
    return task

#DELETE/ api/tasks/{task_id}
@router.delete("/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    #204 no content - success, nothing to return