from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid
from .enums import StudentStatus


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
    password: Optional[str] = None  # Password for creating user account


class Student(StudentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
