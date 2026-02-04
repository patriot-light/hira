from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from .enums import HalaqaLevel


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
