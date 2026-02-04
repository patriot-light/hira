from fastapi import APIRouter, Depends
from database import db
from utils.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics."""
    total_students = await db.students.count_documents({})
    active_students = await db.students.count_documents({"status": "active"})
    total_teachers = await db.teachers.count_documents({})
    total_halaqas = await db.halaqas.count_documents({})
    total_sessions = await db.recitation_sessions.count_documents({})
    total_page_evals = await db.page_evaluations.count_documents({})
    total_juz_evals = await db.juz_evaluations.count_documents({})
    
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


@router.get("/student/{student_id}")
async def get_student_report(student_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed report for a student."""
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        return {"error": "Student not found"}
    
    page_evals = await db.page_evaluations.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    juz_evals = await db.juz_evaluations.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    sessions = await db.recitation_sessions.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    avg_page_score = sum(e["score"] for e in page_evals) / len(page_evals) if page_evals else 0
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    total_pages_read = sum(s["total_pages"] for s in sessions)
    total_errors = sum(s["total_errors"] for s in sessions)
    
    error_counts = {}
    for s in sessions:
        for e in s.get("errors", []):
            cat = e.get("category", "unknown")
            error_counts[cat] = error_counts.get(cat, 0) + 1
    
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


@router.get("/halaqa/{halaqa_id}")
async def get_halaqa_report(halaqa_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed report for a halaqa."""
    halaqa = await db.halaqas.find_one({"id": halaqa_id}, {"_id": 0})
    if not halaqa:
        return {"error": "Halaqa not found"}
    
    students = await db.students.find({"halaqa_id": halaqa_id}, {"_id": 0}).to_list(1000)
    student_ids = [s["id"] for s in students]
    
    sessions = await db.recitation_sessions.find({"student_id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    page_evals = await db.page_evaluations.find({"student_id": {"$in": student_ids}}, {"_id": 0}).to_list(1000)
    
    avg_session_score = sum(s["final_score"] for s in sessions) / len(sessions) if sessions else 0
    avg_page_score = sum(e["score"] for e in page_evals) / len(page_evals) if page_evals else 0
    
    student_performance = []
    for student in students:
        student_sessions = [s for s in sessions if s["student_id"] == student["id"]]
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


@router.get("/teacher/{teacher_id}")
async def get_teacher_report(teacher_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed report for a teacher."""
    teacher = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if not teacher:
        return {"error": "Teacher not found"}
    
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
