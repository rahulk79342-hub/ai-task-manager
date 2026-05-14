from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
from services.claude_service import get_task_suggestions, summarize_task
import models


router = APIRouter()

class SuggestRequest(BaseModel):
    task_id: str
    
#POST /api/ai/suggest - call claude to get AI subtasks for a task
@router.post("/suggest")
def suggest(
    body: SuggestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    task = db.query(models.Task).filter(
        models.Task.id == body.task_id,
        models.Task.owner_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    #call claude - may take 2-5 seconds
    result = get_task_suggestions(task.title, task. description, task.priority)
    
    #Save summary back to database
    task.ai_summary = str(result.get("tip", ""))
    db.commit()
    
    return result