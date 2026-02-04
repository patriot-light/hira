from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from database import db
from models import StudentCreate, Student, User, UserRole
from utils.auth import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
    """Get students based on user role."""
    if current_user["role"] == "student":
        students = await db.students.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1)
    elif current_user["role"] == "teacher":
        teacher = await db.teachers.find_one({"user_id": current_user["id"]}, {"_id": 0})
        if not teacher:
            return []
        halaqas = await db.halaqas.find({"teacher_ids": teacher["id"]}, {"_id": 0}).to_list(100)
        halaqa_ids = [h["id"] for h in halaqas]
        students = await db.students.find({"halaqa_id": {"$in": halaqa_ids}}, {"_id": 0}).to_list(1000)
    else:
        students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students


@router.post("", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Create a new student with associated user account."""
    # Check if student already in a halaqa
    if student_data.halaqa_id:
        existing = await db.students.find_one({"user_id": student_data.user_id, "halaqa_id": {"$ne": None}})
        if existing and existing.get("halaqa_id") != student_data.halaqa_id:
            raise HTTPException(status_code=400, detail="Student can only belong to one halaqa")
    
    # Create user account if email and password provided
    user_id = None
    if student_data.email and student_data.password:
        # Check if email already exists
        existing_user = await db.users.find_one({"email": student_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user account
        user = User(
            email=student_data.email,
            full_name=student_data.full_name,
            role=UserRole.STUDENT
        )
        user_dict = user.model_dump()
        user_dict["password_hash"] = hash_password(student_data.password)
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    
    # Create student profile
    student = Student(**student_data.model_dump(exclude={"password"}))
    if user_id:
        student.user_id = user_id
    
    student_dict = student.model_dump()
    student_dict["created_at"] = student_dict["created_at"].isoformat()
    await db.students.insert_one(student_dict)
    
    return student


@router.get("/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific student."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    return student


@router.put("/{student_id}", response_model=Student)
async def update_student(student_id: str, student_data: StudentCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Update student information."""
    if student_data.halaqa_id:
        existing = await db.students.find_one({"id": {"$ne": student_id}, "user_id": student_data.user_id, "halaqa_id": {"$ne": None}})
        if existing:
            raise HTTPException(status_code=400, detail="Student can only belong to one halaqa")
    
    update_dict = student_data.model_dump(exclude={"password"})
    
    # Update associated user if exists
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student and student.get("user_id"):
        await db.users.update_one(
            {"id": student["user_id"]},
            {"$set": {"full_name": student_data.full_name, "email": student_data.email}}
        )
    
    result = await db.students.update_one({"id": student_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@router.delete("/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Delete a student and their associated user account."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if student and student.get("user_id"):
        await db.users.delete_one({"id": student["user_id"]})
    
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}
