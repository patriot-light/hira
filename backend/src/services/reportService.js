const { getCollection } = require("../config/database");

function avg(rows, field) {
  return rows.length ? rows.reduce((sum, row) => sum + Number(row[field] || 0), 0) / rows.length : 0;
}

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

async function dashboard() {
  const pageEvaluations = await getCollection("page_evaluations").find({}, { projection: { _id: 0 } }).toArray();
  const examEvaluations = await getCollection("exam_evaluations").find({}, { projection: { _id: 0 } }).toArray();
  const sessions = await getCollection("recitation_sessions").find({}, { projection: { _id: 0 } }).toArray();
  return {
    total_students: await getCollection("students").countDocuments({}),
    active_students: await getCollection("students").countDocuments({ status: "active" }),
    total_teachers: await getCollection("teachers").countDocuments({}),
    total_halaqas: await getCollection("halaqas").countDocuments({}),
    total_sessions: await getCollection("recitation_sessions").countDocuments({}),
    total_page_evaluations: await getCollection("page_evaluations").countDocuments({}),
    total_juz_evaluations: await getCollection("juz_evaluations").countDocuments({}),
    total_exam_evaluations: await getCollection("exam_evaluations").countDocuments({}),
    average_page_score: round(examEvaluations.length ? avg(examEvaluations, "final_score") : avg(pageEvaluations, "score")),
    average_session_score: round(avg(sessions, "final_score"))
  };
}

async function studentReport(studentId) {
  const student = await getCollection("students").findOne({ id: studentId }, { projection: { _id: 0 } });
  if (!student) return { error: "Student not found" };
  const pageEvaluations = await getCollection("page_evaluations").find({ student_id: studentId }, { projection: { _id: 0 } }).toArray();
  const juzEvaluations = await getCollection("juz_evaluations").find({ student_id: studentId }, { projection: { _id: 0 } }).toArray();
  const examEvaluations = await getCollection("exam_evaluations").find({ student_id: studentId }, { projection: { _id: 0 } }).toArray();
  const sessions = await getCollection("recitation_sessions").find({ student_id: studentId }, { projection: { _id: 0 } }).toArray();
  const error_breakdown = {};
  for (const session of sessions) {
    for (const error of session.errors || []) error_breakdown[error.category || "unknown"] = (error_breakdown[error.category || "unknown"] || 0) + 1;
  }
  const completed = new Set(juzEvaluations.filter((row) => row.memorization_score >= 70 && row.mastery_score >= 70).map((row) => row.juz_number));
  return {
    student,
    total_page_evaluations: pageEvaluations.length,
    total_juz_evaluations: juzEvaluations.length,
    total_exam_evaluations: examEvaluations.length,
    total_sessions: sessions.length,
    average_page_score: round(examEvaluations.length ? avg(examEvaluations, "final_score") : avg(pageEvaluations, "score")),
    average_session_score: round(avg(sessions, "final_score")),
    total_pages_read: sessions.reduce((sum, row) => sum + Number(row.total_pages || 0), 0),
    total_errors: sessions.reduce((sum, row) => sum + Number(row.total_errors || 0), 0),
    error_breakdown,
    completed_juz: [...completed].sort((a, b) => a - b),
    memorization_progress: round((completed.size / 30) * 100, 1)
  };
}

async function halaqaReport(halaqaId) {
  const halaqa = await getCollection("halaqas").findOne({ id: halaqaId }, { projection: { _id: 0 } });
  if (!halaqa) return { error: "Halaqa not found" };
  const allStudents = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
  const students = allStudents.filter((student) => (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).includes(halaqaId));
  const studentIds = students.map((student) => student.id);
  const sessions = await getCollection("recitation_sessions").find({ student_id: { $in: studentIds } }, { projection: { _id: 0 } }).toArray();
  const pageEvaluations = await getCollection("page_evaluations").find({ student_id: { $in: studentIds } }, { projection: { _id: 0 } }).toArray();
  const student_performance = students.map((student) => {
    const studentSessions = sessions.filter((session) => session.student_id === student.id);
    return {
      student_id: student.id,
      student_name: student.full_name,
      total_sessions: studentSessions.length,
      average_score: round(avg(studentSessions, "final_score"))
    };
  }).sort((a, b) => b.average_score - a.average_score);
  return {
    halaqa,
    total_students: students.length,
    total_sessions: sessions.length,
    total_evaluations: pageEvaluations.length,
    average_session_score: round(avg(sessions, "final_score")),
    average_page_score: round(avg(pageEvaluations, "score")),
    student_performance
  };
}

async function teacherReport(teacherId) {
  const teacher = await getCollection("teachers").findOne({ id: teacherId }, { projection: { _id: 0 } });
  if (!teacher) return { error: "Teacher not found" };
  const halaqas = await getCollection("halaqas").find({ teacher_ids: teacherId }, { projection: { _id: 0 } }).toArray();
  const sessions = await getCollection("recitation_sessions").find({ teacher_id: teacherId }, { projection: { _id: 0 } }).toArray();
  const studentIds = new Set();
  const allStudents = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
  for (const halaqa of halaqas) {
    const students = allStudents.filter((student) => (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).includes(halaqa.id));
    students.forEach((student) => studentIds.add(student.id));
  }
  return {
    teacher,
    total_halaqas: halaqas.length,
    total_students: studentIds.size,
    total_sessions: sessions.length,
    total_teaching_hours: round(sessions.reduce((sum, row) => sum + Number(row.duration_minutes || 0), 0) / 60, 1),
    average_student_score: round(avg(sessions, "final_score"))
  };
}

module.exports = { dashboard, halaqaReport, studentReport, teacherReport };
