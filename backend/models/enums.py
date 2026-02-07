from enum import Enum

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
