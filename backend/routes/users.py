from fastapi import APIRouter, HTTPException, Depends
from typing import List
from database import db
from models import UserResponse, UserRole
from utils.auth import get_current_user, require_roles

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_roles("admin"))):
    """Get all users (Admin only)."""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@router.put("/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, current_user: dict = Depends(require_roles("admin"))):
    """Update user role (Admin only)."""
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Role updated successfully"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_roles("admin"))):
    """Delete a user (Admin only)."""
    # Also delete associated student/teacher profile
    await db.students.delete_one({"user_id": user_id})
    await db.teachers.delete_one({"user_id": user_id})
    await db.staff.delete_one({"user_id": user_id})
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
