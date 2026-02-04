from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from database import db
from models import PageEvaluationCreate, PageEvaluation, JuzEvaluationCreate, JuzEvaluation
from utils.auth import get_current_user, require_roles

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


# Page Evaluations
@router.get("/pages", response_model=List[PageEvaluation])
async def get_page_evaluations(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get page evaluations."""
    query = {}
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif student_id:
        query["student_id"] = student_id
    
    evaluations = await db.page_evaluations.find(query, {"_id": 0}).to_list(1000)
    for e in evaluations:
        if isinstance(e.get('date'), str):
            e['date'] = datetime.fromisoformat(e['date'])
    return evaluations


@router.post("/pages", response_model=PageEvaluation)
async def create_page_evaluation(eval_data: PageEvaluationCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Create a page evaluation."""
    evaluation = PageEvaluation(**eval_data.model_dump())
    evaluation.evaluator_id = current_user["id"]
    eval_dict = evaluation.model_dump()
    eval_dict["date"] = eval_dict["date"].isoformat()
    await db.page_evaluations.insert_one(eval_dict)
    return evaluation


@router.delete("/pages/{eval_id}")
async def delete_page_evaluation(eval_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Delete a page evaluation."""
    result = await db.page_evaluations.delete_one({"id": eval_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"message": "Evaluation deleted successfully"}


# Juz Evaluations
@router.get("/juz", response_model=List[JuzEvaluation])
async def get_juz_evaluations(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get juz evaluations."""
    query = {}
    if current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if student:
            query["student_id"] = student["id"]
    elif student_id:
        query["student_id"] = student_id
    
    evaluations = await db.juz_evaluations.find(query, {"_id": 0}).to_list(1000)
    for e in evaluations:
        if isinstance(e.get('date'), str):
            e['date'] = datetime.fromisoformat(e['date'])
    return evaluations


@router.post("/juz", response_model=JuzEvaluation)
async def create_juz_evaluation(eval_data: JuzEvaluationCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Create a juz evaluation."""
    evaluation = JuzEvaluation(**eval_data.model_dump())
    evaluation.evaluator_id = current_user["id"]
    eval_dict = evaluation.model_dump()
    eval_dict["date"] = eval_dict["date"].isoformat()
    await db.juz_evaluations.insert_one(eval_dict)
    return evaluation


@router.delete("/juz/{eval_id}")
async def delete_juz_evaluation(eval_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    """Delete a juz evaluation."""
    result = await db.juz_evaluations.delete_one({"id": eval_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"message": "Evaluation deleted successfully"}
