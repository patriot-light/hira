from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class StaffBase(BaseModel):
    full_name: str
    role_title: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None


class StaffCreate(StaffBase):
    password: Optional[str] = None


class Staff(StaffBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
