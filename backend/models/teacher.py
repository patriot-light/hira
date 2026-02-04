from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class TeacherBase(BaseModel):
    full_name: str
    qualification: str
    experience_years: int = 0
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None


class TeacherCreate(TeacherBase):
    password: Optional[str] = None  # Password for creating user account


class Teacher(TeacherBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
