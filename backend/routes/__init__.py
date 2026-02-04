from .auth import router as auth_router
from .users import router as users_router
from .students import router as students_router
from .teachers import router as teachers_router
from .halaqas import router as halaqas_router
from .staff import router as staff_router
from .evaluations import router as evaluations_router
from .sessions import router as sessions_router
from .reports import router as reports_router
from .export import router as export_router

__all__ = [
    "auth_router",
    "users_router",
    "students_router",
    "teachers_router",
    "halaqas_router",
    "staff_router",
    "evaluations_router",
    "sessions_router",
    "reports_router",
    "export_router"
]
