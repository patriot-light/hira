from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime, timezone
from database import db
from models import TeacherCreate, Teacher, User, UserRole
from utils.auth import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/teachers", tags=["Teachers"])


@router.get("", response_model=List[Teacher])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    """Get all teachers."""
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    for t in teachers:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return teachers


@router.post("", response_model=Teacher)
async def create_teacher(teacher_data: TeacherCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Create a new teacher with associated user account."""
    user_id = None
    
    # Create user account if email and password provided
    if teacher_data.email and teacher_data.password:
        # Check if email already exists
        existing_user = await db.users.find_one({"email": teacher_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user account
        user = User(
            email=teacher_data.email,
            full_name=teacher_data.full_name,
            role=UserRole.TEACHER
        )
        user_dict = user.model_dump()
        user_dict["password_hash"] = hash_password(teacher_data.password)
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    
    # Create teacher profile
    teacher = Teacher(**teacher_data.model_dump(exclude={"password"}))
    if user_id:
        teacher.user_id = user_id
    
    teacher_dict = teacher.model_dump()
    teacher_dict["created_at"] = teacher_dict["created_at"].isoformat()
    await db.teachers.insert_one(teacher_dict)
    
    return teacher


@router.get("/{teacher_id}", response_model=Teacher)
async def get_teacher(teacher_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific teacher."""
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if isinstance(teacher.get('created_at'), str):
        teacher['created_at'] = datetime.fromisoformat(teacher['created_at'])
    return teacher


@router.put("/{teacher_id}", response_model=Teacher)
async def update_teacher(teacher_id: str, teacher_data: TeacherCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Update teacher information."""
    update_dict = teacher_data.model_dump(exclude={"password"})
    
    # Update associated user if exists
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if teacher and teacher.get("user_id"):
        await db.users.update_one(
            {"id": teacher["user_id"]},
            {"$set": {"full_name": teacher_data.full_name, "email": teacher_data.email}}
        )
    
    result = await db.teachers.update_one({"id": teacher_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    """Delete a teacher and their associated user account."""
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if teacher and teacher.get("user_id"):
        await db.users.delete_one({"id": teacher["user_id"]})
    
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}
