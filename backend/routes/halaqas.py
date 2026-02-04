from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from database import db
from models import HalaqaCreate, Halaqa, Student
from utils.auth import get_current_user, require_roles

router = APIRouter(prefix="/halaqas", tags=["Halaqas"])


@router.get("", response_model=List[Halaqa])
async def get_halaqas(current_user: dict = Depends(get_current_user)):
    """Get halaqas based on user role."""
    if current_user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not teacher:
            return []
        halaqas = await db.halaqas.find({"teacher_ids": teacher["id"]}, {"_id": 0}).to_list(100)
    elif current_user["role"] == "student":
        student = await db.students.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not student or not student.get("halaqa_id"):
            return []
        halaqas = await db.halaqas.find({"id": student["halaqa_id"]}, {"_id": 0}).to_list(1)
    else:
        halaqas = await db.halaqas.find({}, {"_id": 0}).to_list(1000)
    
    for h in halaqas:
        if isinstance(h.get('created_at'), str):
            h['created_at'] = datetime.fromisoformat(h['created_at'])
    return halaqas


@router.post("", response_model=Halaqa)
async def create_halaqa(halaqa_data: HalaqaCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Create a new halaqa."""
    halaqa = Halaqa(**halaqa_data.model_dump())
    halaqa_dict = halaqa.model_dump()
    halaqa_dict["created_at"] = halaqa_dict["created_at"].isoformat()
    await db.halaqas.insert_one(halaqa_dict)
    return halaqa


@router.get("/{halaqa_id}", response_model=Halaqa)
async def get_halaqa(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific halaqa."""
    halaqa = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if not halaqa:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    if isinstance(halaqa.get('created_at'), str):
        halaqa['created_at'] = datetime.fromisoformat(halaqa['created_at'])
    return halaqa


@router.put("/{halaqa_id}", response_model=Halaqa)
async def update_halaqa(halaqa_id: str, halaqa_data: HalaqaCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Update halaqa information."""
    update_dict = halaqa_data.model_dump()
    result = await db.halaqas.update_one({"id": halaqa_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    
    updated = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@router.delete("/{halaqa_id}")
async def delete_halaqa(halaqa_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Delete a halaqa and unassign all students."""
    await db.students.update_many({"halaqa_id": halaqa_id}, {"$set": {"halaqa_id": None}})
    result = await db.halaqas.delete_one({"id": halaqa_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    return {"message": "Halaqa deleted successfully"}


@router.get("/{halaqa_id}/students", response_model=List[Student])
async def get_halaqa_students(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    """Get all students in a halaqa."""
    students = await db.students.find({"halaqa_id": halaqa_id}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students


@router.post("/{halaqa_id}/students/{student_id}")
async def assign_student_to_halaqa(halaqa_id: str, student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Assign a student to a halaqa."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.get("halaqa_id") and student["halaqa_id"] != halaqa_id:
        raise HTTPException(status_code=400, detail="Student already belongs to another halaqa")
    
    await db.students.update_one({"id": student_id}, {"$set": {"halaqa_id": halaqa_id}})
    return {"message": "Student assigned to halaqa successfully"}


@router.delete("/{halaqa_id}/students/{student_id}")
async def remove_student_from_halaqa(halaqa_id: str, student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Remove a student from a halaqa."""
    await db.students.update_one({"id": student_id, "halaqa_id": halaqa_id}, {"$set": {"halaqa_id": None}})
    return {"message": "Student removed from halaqa successfully"}
