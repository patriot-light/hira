from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from .enums import ErrorCategory, EvaluationResult


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
