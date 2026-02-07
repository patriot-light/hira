from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from .enums import ErrorCategory, EvaluationResult


class RecitationErrorBase(BaseModel):
    category: ErrorCategory
    description: Optional[str] = None
    page_number: int
    word: Optional[str] = None
    penalty: float = Field(ge=0, default=1.0)

class RecitationError(RecitationErrorBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

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
