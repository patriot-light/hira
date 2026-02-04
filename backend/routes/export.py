from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from io import BytesIO
import openpyxl
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from database import db
from utils.auth import require_roles, get_current_user
from routes.reports import get_student_report

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/students/excel")
async def export_students_excel(current_user: dict = Depends(require_roles("admin", "staff"))):
    """Export students list to Excel."""
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Students"
    
    headers = ["ID", "Full Name", "Age", "National ID", "Phone", "Email", "Status", "Halaqa ID"]
    ws.append(headers)
    
    for s in students:
        ws.append([
            s.get("id", ""), s.get("full_name", ""), s.get("age", ""),
            s.get("national_id", ""), s.get("phone", ""), s.get("email", ""),
            s.get("status", ""), s.get("halaqa_id", "")
        ])
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students.xlsx"}
    )


@router.get("/students/pdf")
async def export_students_pdf(current_user: dict = Depends(require_roles("admin", "staff"))):
    """Export students list to PDF."""
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
        data.append([
            s.get("full_name", ""), str(s.get("age", "")),
            s.get("status", ""), s.get("phone", "")
        ])
    
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


@router.get("/report/{student_id}/pdf")
async def export_student_report_pdf(student_id: str, current_user: dict = Depends(get_current_user)):
    """Export individual student report to PDF."""
    report = await get_student_report(student_id, current_user)
    
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4)
    elements = []
    
    styles = getSampleStyleSheet()
    student_name = report.get('student', {}).get('full_name', 'Unknown')
    title = Paragraph(f"Student Report: {student_name}", styles['Heading1'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    summary_data = [
        ["Total Sessions", str(report.get("total_sessions", 0))],
        ["Average Score", f"{report.get('average_session_score', 0)}%"],
        ["Total Pages Read", str(report.get("total_pages_read", 0))],
        ["Total Errors", str(report.get("total_errors", 0))],
        ["Memorization Progress", f"{report.get('memorization_progress', 0)}%"]
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
