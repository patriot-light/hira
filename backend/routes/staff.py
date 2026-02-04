from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from database import db
from models import StaffCreate, Staff, User, UserRole
from utils.auth import get_current_user, require_roles, hash_password

router = APIRouter(prefix="/staff", tags=["Staff"])


@router.get("", response_model=List[Staff])
async def get_staff(current_user: dict = Depends(require_roles("admin"))):
    """Get all staff members (Admin only)."""
    staff = await db.staff.find({}, {"_id": 0}).to_list(1000)
    for s in staff:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return staff


@router.post("", response_model=Staff)
async def create_staff(staff_data: StaffCreate, current_user: dict = Depends(require_roles("admin"))):
    """Create a new staff member with user account (Admin only)."""
    user_id = None
    
    if staff_data.email and staff_data.password:
        existing_user = await db.users.find_one({"email": staff_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user = User(
            email=staff_data.email,
            full_name=staff_data.full_name,
            role=UserRole.STAFF
        )
        user_dict = user.model_dump()
        user_dict["password_hash"] = hash_password(staff_data.password)
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_id = user.id
    
    staff = Staff(**staff_data.model_dump(exclude={"password"}))
    if user_id:
        staff.user_id = user_id
    
    staff_dict = staff.model_dump()
    staff_dict["created_at"] = staff_dict["created_at"].isoformat()
    await db.staff.insert_one(staff_dict)
    
    return staff


@router.put("/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: dict = Depends(require_roles("admin"))):
    """Update staff information (Admin only)."""
    update_dict = staff_data.model_dump(exclude={"password"})
    
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if staff and staff.get("user_id"):
        await db.users.update_one(
            {"id": staff["user_id"]},
            {"$set": {"full_name": staff_data.full_name, "email": staff_data.email}}
        )
    
    result = await db.staff.update_one({"id": staff_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@router.delete("/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(require_roles("admin"))):
    """Delete a staff member (Admin only)."""
    staff = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if staff and staff.get("user_id"):
        await db.users.delete_one({"id": staff["user_id"]})
    
    result = await db.staff.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"message": "Staff deleted successfully"}
