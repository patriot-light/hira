from fastapi import APIRouter, HTTPException, Depends
from database import db
from models import UserCreate, UserLogin, User, UserResponse, TokenResponse, UserRole
from utils.auth import hash_password, verify_password, create_token, get_current_user, require_roles

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user account."""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(**user_data.model_dump(exclude={"password"}))
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # If registering as student, also create a student profile
    if user_data.role == UserRole.STUDENT:
        student_dict = {
            "id": user.id + "_student",
            "full_name": user.full_name,
            "age": 0,
            "email": user.email,
            "status": "active",
            "user_id": user.id,
            "halaqa_id": None,
            "created_at": user_dict["created_at"]
        }
        await db.students.insert_one(student_dict)
    
    # If registering as teacher, also create a teacher profile
    elif user_data.role == UserRole.TEACHER:
        teacher_dict = {
            "id": user.id + "_teacher",
            "full_name": user.full_name,
            "qualification": "",
            "experience_years": 0,
            "email": user.email,
            "user_id": user.id,
            "created_at": user_dict["created_at"]
        }
        await db.teachers.insert_one(teacher_dict)
    
    token = create_token(user.id, user.email, user.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role, is_active=user.is_active)
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login with email and password."""
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"], 
            email=user["email"], 
            full_name=user["full_name"], 
            role=user["role"], 
            is_active=user.get("is_active", True)
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return UserResponse(**current_user)
