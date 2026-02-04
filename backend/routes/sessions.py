from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from database import db
from models import RecitationSessionCreate, RecitationSession
from utils.auth import get_current_user, require_roles
from utils.helpers import calculate_session_result

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.get("", response_model=List[RecitationSession])
async def get_recitation_sessions(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get recitation sessions based on user role."""
    query = {}
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif current_user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if teacher:
            query["teacher_id"] = teacher["id"]
    elif student_id:
        query["student_id"] = student_id
    
    sessions = await db.recitation_sessions.find(query, {"_id": 0}).to_list(1000)
    for s in sessions:
        if isinstance(s.get('date'), str):
            s['date'] = datetime.fromisoformat(s['date'])
    return sessions


@router.post("", response_model=RecitationSession)
async def create_recitation_session(session_data: RecitationSessionCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Create a new recitation session."""
    session = RecitationSession(**session_data.model_dump())
    session.total_pages = abs(session.to_page - session.from_page) + 1
    session.total_errors = len(session.errors)
    session.total_penalty = sum(e.penalty for e in session.errors)
    session.final_score, session.result = calculate_session_result(session.total_penalty, session.total_pages)
    
    session_dict = session.model_dump()
    session_dict["date"] = session_dict["date"].isoformat()
    await db.recitation_sessions.insert_one(session_dict)
    return session


@router.get("/{session_id}", response_model=RecitationSession)
async def get_recitation_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific recitation session."""
    session = await db.recitation_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if isinstance(session.get('date'), str):
        session['date'] = datetime.fromisoformat(session['date'])
    return session


@router.delete("/{session_id}")
async def delete_recitation_session(session_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Delete a recitation session."""
    result = await db.recitation_sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}
