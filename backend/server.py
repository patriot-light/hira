from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from enum import Enum
from io import BytesIO
from fastapi.responses import StreamingResponse
import openpyxl
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'hira-institute-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Hira Institute API", description="معهد حراء - Quran Institute Management System")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    TEACHER = "teacher"
    STUDENT = "student"

class HalaqaLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class StudentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class ErrorCategory(str, Enum):
    IDGHAM = "idgham"
    IKHFA = "ikhfa"
    IQLAB = "iqlab"
    MADD = "madd"
    GHUNNAH = "ghunnah"
    MAKHARIJ = "makharij"
    MEMORIZATION = "memorization"
    PRONUNCIATION = "pronunciation"

class EvaluationResult(str, Enum):
    EXCELLENT = "excellent"
    VERY_GOOD = "very_good"
    GOOD = "good"
    NEEDS_REVIEW = "needs_review"

# Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Student Models
class StudentBase(BaseModel):
    full_name: str
    age: int
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    status: StudentStatus = StudentStatus.ACTIVE
    halaqa_id: Optional[str] = None
    user_id: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class Student(StudentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Teacher Models
class TeacherBase(BaseModel):
    full_name: str
    qualification: str
    experience_years: int = 0
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class Teacher(TeacherBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Halaqa Models
class HalaqaSchedule(BaseModel):
    day: str
    start_time: str
    end_time: str

class HalaqaBase(BaseModel):
    name: str
    level: HalaqaLevel = HalaqaLevel.BEGINNER
    teacher_ids: List[str] = []
    schedule: List[HalaqaSchedule] = []

class HalaqaCreate(HalaqaBase):
    pass

class Halaqa(HalaqaBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Staff Models
class StaffBase(BaseModel):
    full_name: str
    role_title: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Page Evaluation Models
class PageEvaluationBase(BaseModel):
    student_id: str
    page_number: int
    score: float = Field(ge=0, le=100)
    notes: Optional[str] = None

class PageEvaluationCreate(PageEvaluationBase):
    pass

class PageEvaluation(PageEvaluationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    evaluator_id: Optional[str] = None

# Juz Evaluation Models
class JuzEvaluationBase(BaseModel):
    student_id: str
    juz_number: int = Field(ge=1, le=30)
    memorization_score: float = Field(ge=0, le=100)
    mastery_score: float = Field(ge=0, le=100)
    notes: Optional[str] = None

class JuzEvaluationCreate(JuzEvaluationBase):
    pass

class JuzEvaluation(JuzEvaluationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    evaluator_id: Optional[str] = None

# Recitation Error Models
class RecitationErrorBase(BaseModel):
    category: ErrorCategory
    description: Optional[str] = None
    page_number: int
    word: Optional[str] = None
    penalty: float = Field(ge=0, default=1.0)

class RecitationError(RecitationErrorBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

# Recitation Session Models
class RecitationSessionBase(BaseModel):
    student_id: str
    teacher_id: str
    duration_minutes: int
    from_page: int
    to_page: int
    errors: List[RecitationError] = []

class RecitationSessionCreate(RecitationSessionBase):
    pass

class RecitationSession(RecitationSessionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    total_pages: int = 0
    total_errors: int = 0
    total_penalty: float = 0
    final_score: float = 0
    result: EvaluationResult = EvaluationResult.NEEDS_REVIEW

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_roles(*roles):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

def calculate_session_result(total_penalty: float, total_pages: int) -> tuple:
    if total_pages == 0:
        return 0, EvaluationResult.NEEDS_REVIEW
    base_score = 100
    penalty_per_page = total_penalty / total_pages
    final_score = max(0, base_score - (penalty_per_page * 10))
    if final_score >= 90:
        result = EvaluationResult.EXCELLENT
    elif final_score >= 80:
        result = EvaluationResult.VERY_GOOD
    elif final_score >= 70:
        result = EvaluationResult.GOOD
    else:
        result = EvaluationResult.NEEDS_REVIEW
    return final_score, result

# Auth Routes
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(**user_data.model_dump(exclude={"password"}))
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    await db.users.insert_one(user_dict)
    token = create_token(user.id, user.email, user.role)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role, is_active=user.is_active)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["email"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], full_name=user["full_name"], role=user["role"], is_active=user.get("is_active", True))
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

# User Management Routes (Admin only)
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(require_roles("admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: UserRole, current_user: dict = Depends(require_roles("admin"))):
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Role updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(require_roles("admin"))):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# Student Routes
@api_router.get("/students", response_model=List[Student])
async def get_students(current_user: dict = Depends(get_current_user)):
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

@api_router.post("/students", response_model=Student)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    if student_data.halaqa_id:
        existing = await db.students.find_one({"user_id": student_data.user_id, "halaqa_id": {"$ne": None}})
        if existing and existing.get("halaqa_id") != student_data.halaqa_id:
            raise HTTPException(status_code=400, detail="Student can only belong to one halaqa")
    student = Student(**student_data.model_dump())
    student_dict = student.model_dump()
    student_dict["created_at"] = student_dict["created_at"].isoformat()
    await db.students.insert_one(student_dict)
    return student

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if isinstance(student.get('created_at'), str):
        student['created_at'] = datetime.fromisoformat(student['created_at'])
    return student

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, student_data: StudentCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    if student_data.halaqa_id:
        existing = await db.students.find_one({"id": {"$ne": student_id}, "user_id": student_data.user_id, "halaqa_id": {"$ne": None}})
        if existing:
            raise HTTPException(status_code=400, detail="Student can only belong to one halaqa")
    update_dict = student_data.model_dump()
    result = await db.students.update_one({"id": student_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

# Teacher Routes
@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers(current_user: dict = Depends(get_current_user)):
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    for t in teachers:
        if isinstance(t.get('created_at'), str):
            t['created_at'] = datetime.fromisoformat(t['created_at'])
    return teachers

@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(teacher_data: TeacherCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    teacher = Teacher(**teacher_data.model_dump())
    teacher_dict = teacher.model_dump()
    teacher_dict["created_at"] = teacher_dict["created_at"].isoformat()
    await db.teachers.insert_one(teacher_dict)
    return teacher

@api_router.get("/teachers/{teacher_id}", response_model=Teacher)
async def get_teacher(teacher_id: str, current_user: dict = Depends(get_current_user)):
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if isinstance(teacher.get('created_at'), str):
        teacher['created_at'] = datetime.fromisoformat(teacher['created_at'])
    return teacher

@api_router.put("/teachers/{teacher_id}", response_model=Teacher)
async def update_teacher(teacher_id: str, teacher_data: TeacherCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    update_dict = teacher_data.model_dump()
    result = await db.teachers.update_one({"id": teacher_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}

# Halaqa Routes
@api_router.get("/halaqas", response_model=List[Halaqa])
async def get_halaqas(current_user: dict = Depends(get_current_user)):
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

@api_router.post("/halaqas", response_model=Halaqa)
async def create_halaqa(halaqa_data: HalaqaCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    halaqa = Halaqa(**halaqa_data.model_dump())
    halaqa_dict = halaqa.model_dump()
    halaqa_dict["created_at"] = halaqa_dict["created_at"].isoformat()
    await db.halaqas.insert_one(halaqa_dict)
    return halaqa

@api_router.get("/halaqas/{halaqa_id}", response_model=Halaqa)
async def get_halaqa(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    halaqa = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if not halaqa:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    if isinstance(halaqa.get('created_at'), str):
        halaqa['created_at'] = datetime.fromisoformat(halaqa['created_at'])
    return halaqa

@api_router.put("/halaqas/{halaqa_id}", response_model=Halaqa)
async def update_halaqa(halaqa_id: str, halaqa_data: HalaqaCreate, current_user: dict = Depends(require_roles("admin", "staff"))):
    update_dict = halaqa_data.model_dump()
    result = await db.halaqas.update_one({"id": halaqa_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    updated = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/halaqas/{halaqa_id}")
async def delete_halaqa(halaqa_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    await db.students.update_many({"halaqa_id": halaqa_id}, {"$set": {"halaqa_id": None}})
    result = await db.halaqas.delete_one({"id": halaqa_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    return {"message": "Halaqa deleted successfully"}

@api_router.get("/halaqas/{halaqa_id}/students", response_model=List[Student])
async def get_halaqa_students(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    students = await db.students.find({"halaqa_id": halaqa_id}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return students

@api_router.post("/halaqas/{halaqa_id}/students/{student_id}")
async def assign_student_to_halaqa(halaqa_id: str, student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if student.get("halaqa_id") and student["halaqa_id"] != halaqa_id:
        raise HTTPException(status_code=400, detail="Student already belongs to another halaqa")
    await db.students.update_one({"id": student_id}, {"$set": {"halaqa_id": halaqa_id}})
    return {"message": "Student assigned to halaqa successfully"}

@api_router.delete("/halaqas/{halaqa_id}/students/{student_id}")
async def remove_student_from_halaqa(halaqa_id: str, student_id: str, current_user: dict = Depends(require_roles("admin", "staff"))):
    await db.students.update_one({"id": student_id, "halaqa_id": halaqa_id}, {"$set": {"halaqa_id": None}})
    return {"message": "Student removed from halaqa successfully"}

# Staff Routes
@api_router.get("/staff", response_model=List[Staff])
async def get_staff(current_user: dict = Depends(require_roles("admin"))):
    staff = await db.staff.find({}, {"_id": 0}).to_list(1000)
    for s in staff:
        if isinstance(s.get('created_at'), str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
    return staff

@api_router.post("/staff", response_model=Staff)
async def create_staff(staff_data: StaffCreate, current_user: dict = Depends(require_roles("admin"))):
    staff = Staff(**staff_data.model_dump())
    staff_dict = staff.model_dump()
    staff_dict["created_at"] = staff_dict["created_at"].isoformat()
    await db.staff.insert_one(staff_dict)
    return staff

@api_router.put("/staff/{staff_id}", response_model=Staff)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: dict = Depends(require_roles("admin"))):
    update_dict = staff_data.model_dump()
    result = await db.staff.update_one({"id": staff_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    updated = await db.staff.find_one({"id": staff_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(require_roles("admin"))):
    result = await db.staff.delete_one({"id": staff_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {"message": "Staff deleted successfully"}

# Page Evaluation Routes
@api_router.get("/evaluations/pages", response_model=List[PageEvaluation])
async def get_page_evaluations(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
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

@api_router.post("/evaluations/pages", response_model=PageEvaluation)
async def create_page_evaluation(eval_data: PageEvaluationCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    evaluation = PageEvaluation(**eval_data.model_dump())
    evaluation.evaluator_id = current_user["id"]
    eval_dict = evaluation.model_dump()
    eval_dict["date"] = eval_dict["date"].isoformat()
    await db.page_evaluations.insert_one(eval_dict)
    return evaluation

@api_router.delete("/evaluations/pages/{eval_id}")
async def delete_page_evaluation(eval_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    result = await db.page_evaluations.delete_one({"id": eval_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"message": "Evaluation deleted successfully"}

# Juz Evaluation Routes
@api_router.get("/evaluations/juz", response_model=List[JuzEvaluation])
async def get_juz_evaluations(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
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

@api_router.post("/evaluations/juz", response_model=JuzEvaluation)
async def create_juz_evaluation(eval_data: JuzEvaluationCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    evaluation = JuzEvaluation(**eval_data.model_dump())
    evaluation.evaluator_id = current_user["id"]
    eval_dict = evaluation.model_dump()
    eval_dict["date"] = eval_dict["date"].isoformat()
    await db.juz_evaluations.insert_one(eval_dict)
    return evaluation

@api_router.delete("/evaluations/juz/{eval_id}")
async def delete_juz_evaluation(eval_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    result = await db.juz_evaluations.delete_one({"id": eval_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return {"message": "Evaluation deleted successfully"}

# Recitation Session Routes
@api_router.get("/sessions", response_model=List[RecitationSession])
async def get_recitation_sessions(student_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
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

@api_router.post("/sessions", response_model=RecitationSession)
async def create_recitation_session(session_data: RecitationSessionCreate, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    session = RecitationSession(**session_data.model_dump())
    session.total_pages = abs(session.to_page - session.from_page) + 1
    session.total_errors = len(session.errors)
    session.total_penalty = sum(e.penalty for e in session.errors)
    session.final_score, session.result = calculate_session_result(session.total_penalty, session.total_pages)
    session_dict = session.model_dump()
    session_dict["date"] = session_dict["date"].isoformat()
    await db.recitation_sessions.insert_one(session_dict)
    return session

@api_router.get("/sessions/{session_id}", response_model=RecitationSession)
async def get_recitation_session(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await db.recitation_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if isinstance(session.get('date'), str):
        session['date'] = datetime.fromisoformat(session['date'])
    return session

@api_router.delete("/sessions/{session_id}")
async def delete_recitation_session(session_id: str, current_user: dict = Depends(require_roles("admin", "staff", "teacher"))):
    result = await db.recitation_sessions.delete_one({"id": session_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted successfully"}

# Reports & Analytics Routes
@api_router.get("/reports/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    total_students = await db.students.count_documents({})
    active_students = await db.students.count_documents({"status": "active"})
    total_teachers = await db.teachers.count_documents({})
    total_halaqas = await db.halaqas.count_documents({})
    total_sessions = await db.recitation_sessions.count_documents({})
    total_page_evals = await db.page_evaluations.count_documents({})
    total_juz_evals = await db.juz_evaluations.count_documents({})
    
    # Get average scores
    page_evals = await db.page_evaluations.find({}, {"_id": 0, "score": 1}).to_list(1000)
    avg_page_score = sum(e["score"] for e in page_evals) / len(page_evals) if page_evals else 0
    
    sessions = await db.recitation_sessions.find({}, {"_id": 0, "final_score": 1}).to_list(1000)
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    
    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_teachers": total_teachers,
        "total_halaqas": total_halaqas,
        "total_sessions": total_sessions,
        "total_page_evaluations": total_page_evals,
        "total_juz_evaluations": total_juz_evals,
        "average_page_score": round(avg_page_score, 2),
        "average_session_score": round(avg_session_score, 2)
    }

@api_router.get("/reports/student/{student_id}")
async def get_student_report(student_id: str, current_user: dict = Depends(get_current_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    page_evals = await db.page_evaluations.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    juz_evals = await db.juz_evaluations.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    sessions = await db.recitation_sessions.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    # Calculate statistics
    avg_page_score = sum(e["score"] for e in page_evals) / len(page_evals) if page_evals else 0
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    total_pages_read = sum(s["total_pages"] for s in sessions)
    total_errors = sum(s["total_errors"] for s in sessions)
    
    # Error analysis
    error_counts = {}
    for s in sessions:
        for e in s.get("errors", []):
            cat = e.get("category", "unknown")
            error_counts[cat] = error_counts.get(cat, 0) + 1
    
    # Completed juz
    completed_juz = set()
    for je in juz_evals:
        if je["memorization_score"] >= 70 and je["mastery_score"] >= 70:
            completed_juz.add(je["juz_number"])
    
    return {
        "student": student,
        "total_page_evaluations": len(page_evals),
        "total_juz_evaluations": len(juz_evals),
        "total_sessions": len(sessions),
        "average_page_score": round(avg_page_score, 2),
        "average_session_score": round(avg_session_score, 2),
        "total_pages_read": total_pages_read,
        "total_errors": total_errors,
        "error_breakdown": error_counts,
        "completed_juz": sorted(list(completed_juz)),
        "memorization_progress": round(len(completed_juz) / 30 * 100, 1)
    }

@api_router.get("/reports/halaqa/{halaqa_id}")
async def get_halaqa_report(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    halaqa = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if not halaqa:
        raise HTTPException(status_code=404, detail="Halaqa not found")
    
    students = await db.students.find({"halaqa_id": halaqa_id}, {"_id": 0}).to_list(1000)
    student_ids = [s["id"] for s in students]
    
    sessions = await db.recitation_sessions.find({"student_id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    page_evals = await db.page_evaluations.find({"student_id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    avg_page_score = sum(e["score"] for e in page_evals) / len(page_evals) if page_evals else 0
    
    # Student performance comparison
    student_performance = []
    for student in students:
        student_sessions = [s for s in sessions if s["student_id"] == student["id"]]
        student_evals = [e for e in page_evals if e["student_id"] == student["id"]]
        avg_score = sum(s["final_score"] for s in student_sessions) / len(student_sessions) if student_sessions else 0
        student_performance.append({
            "student_id": student["id"],
            "student_name": student["full_name"],
            "total_sessions": len(student_sessions),
            "average_score": round(avg_score, 2)
        })
    
    return {
        "halaqa": halaqa,
        "total_students": len(students),
        "total_sessions": len(sessions),
        "total_evaluations": len(page_evals),
        "average_session_score": round(avg_session_score, 2),
        "average_page_score": round(avg_page_score, 2),
        "student_performance": sorted(student_performance, key=lambda x: x["average_score"], reverse=True)
    }

@api_router.get("/reports/teacher/{teacher_id}")
async def get_teacher_report(teacher_id: str, current_user: dict = Depends(get_current_user)):
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    halaqas = await db.halaqas.find({"teacher_ids": teacher_id}, {"_id": 0}).to_list(100)
    sessions = await db.recitation_sessions.find({"teacher_id": teacher_id}, {"_id": 0}).to_list(1000)
    
    total_students = 0
    for h in halaqas:
        count = await db.students.count_documents({"halaqa_id": h["id"]})
        total_students += count
    
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    total_duration = sum(s["duration_minutes"] for s in sessions)
    
    return {
        "teacher": teacher,
        "total_halaqas": len(halaqas),
        "total_students": total_students,
        "total_sessions": len(sessions),
        "total_teaching_hours": round(total_duration / 60, 1),
        "average_student_score": round(avg_session_score, 2)
    }

# Export Routes
@api_router.get("/export/students/excel")
async def export_students_excel(current_user: dict = Depends(require_roles("admin", "staff"))):
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students"
    
    headers = ["ID", "Full Name", "Age", "National ID", "Phone", "Email", "Status", "Halaqa ID"]
    ws.append(headers)
    
    for s in students:
        ws.append([s.get("id", ""), s.get("full_name", ""), s.get("age", ""), 
                   s.get("national_id", ""), s.get("phone", ""), s.get("email", ""),
                   s.get("status", ""), s.get("halaqa_id", "")])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students.xlsx"}
    )

@api_router.get("/export/students/pdf")
async def export_students_pdf(current_user: dict = Depends(require_roles("admin", "staff"))):
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title = Paragraph("Hira Institute - Students Report", styles['Heading1'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    data = [["Name", "Age", "Status", "Phone"]]
    for s in students:
        data.append([s.get("full_name", ""), str(s.get("age", "")), 
                     s.get("status", ""), s.get("phone", "")])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(18/255, 168/255, 157/255)),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.Color(253/255, 251/255, 247/255)),
        ('GRID', (0, 0), (-1, -1), 1, colors.Color(226/255, 232/255, 240/255))
    ]))
    elements.append(table)
    
    doc.build(elements)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=students.pdf"}
    )

@api_router.get("/export/report/{student_id}/pdf")
async def export_student_report_pdf(student_id: str, current_user: dict = Depends(get_current_user)):
    report = await get_student_report(student_id, current_user)
    
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    title = Paragraph(f"Student Report: {report['student']['full_name']}", styles['Heading1'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    summary_data = [
        ["Total Sessions", str(report["total_sessions"])],
        ["Average Score", f"{report['average_session_score']}%"],
        ["Total Pages Read", str(report["total_pages_read"])],
        ["Total Errors", str(report["total_errors"])],
        ["Memorization Progress", f"{report['memorization_progress']}%"]
    ]
    
    table = Table(summary_data, colWidths=[200, 150])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.Color(18/255, 168/255, 157/255)),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.Color(226/255, 232/255, 240/255))
    ]))
    elements.append(table)
    
    doc.build(elements)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=student_report_{student_id}.pdf"}
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
