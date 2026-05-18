const { v4: uuid } = require("uuid");

const UserRole = Object.freeze({ ADMIN: "admin", STAFF: "staff", TEACHER: "teacher", EXAM_TEACHER: "exam_teacher", STUDENT: "student" });
const HalaqaLevel = Object.freeze({ BEGINNER: "beginner", INTERMEDIATE: "intermediate", ADVANCED: "advanced" });
const StudentStatus = Object.freeze({ ACTIVE: "active", INACTIVE: "inactive" });
const EvaluationResult = Object.freeze({ EXCELLENT: "excellent", VERY_GOOD: "very_good", GOOD: "good", NEEDS_REVIEW: "needs_review" });

function now() {
  return new Date().toISOString();
}

function required(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      const error = new Error(`${field} is required`);
      error.status = 400;
      throw error;
    }
  }
}

function numberRange(value, field, min, max) {
  if (value === undefined || value === null) return;
  if (typeof value !== "number" || value < min || value > max) {
    const error = new Error(`${field} must be between ${min} and ${max}`);
    error.status = 400;
    throw error;
  }
}

function createUser(data) {
  required(data, ["email", "full_name"]);
  if (data.role && !Object.values(UserRole).includes(data.role)) {
    const error = new Error("Invalid role");
    error.status = 400;
    throw error;
  }
  return {
    id: uuid(),
    email: data.email,
    full_name: data.full_name,
    role: data.role || UserRole.STUDENT,
    created_at: now(),
    is_active: data.is_active ?? true
  };
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    is_active: user.is_active ?? true
  };
}

function createStudent(data) {
  required(data, ["full_name", "age"]);
  const halaqa_ids = data.halaqa_ids || (data.halaqa_id ? [data.halaqa_id] : []);
  return {
    id: uuid(),
    full_name: data.full_name,
    age: data.age,
    national_id: data.national_id || null,
    phone: data.phone || null,
    email: data.email || null,
    status: data.status || StudentStatus.ACTIVE,
    halaqa_id: halaqa_ids[0] || null,
    halaqa_ids,
    user_id: data.user_id || null,
    created_at: now()
  };
}

function createTeacher(data) {
  required(data, ["full_name", "qualification"]);
  return {
    id: uuid(),
    full_name: data.full_name,
    qualification: data.qualification,
    experience_years: data.experience_years || 0,
    phone: data.phone || null,
    email: data.email || null,
    user_id: data.user_id || null,
    created_at: now()
  };
}

function createStaff(data) {
  required(data, ["full_name", "role_title"]);
  return {
    id: uuid(),
    full_name: data.full_name,
    role_title: data.role_title,
    phone: data.phone || null,
    email: data.email || null,
    user_id: data.user_id || null,
    created_at: now()
  };
}

function createHalaqa(data) {
  required(data, ["name"]);
  return {
    id: uuid(),
    name: data.name,
    level: data.level || HalaqaLevel.BEGINNER,
    teacher_ids: data.teacher_ids || [],
    schedule: data.schedule || [],
    created_at: now()
  };
}

function createPageEvaluation(data, evaluatorId) {
  required(data, ["student_id", "page_number", "score"]);
  numberRange(data.score, "score", 0, 100);
  return { id: uuid(), ...data, notes: data.notes || null, date: now(), evaluator_id: evaluatorId || null };
}

function createJuzEvaluation(data, evaluatorId) {
  required(data, ["student_id", "juz_number", "memorization_score", "mastery_score"]);
  numberRange(data.juz_number, "juz_number", 1, 30);
  numberRange(data.memorization_score, "memorization_score", 0, 100);
  numberRange(data.mastery_score, "mastery_score", 0, 100);
  return { id: uuid(), ...data, notes: data.notes || null, date: now(), evaluator_id: evaluatorId || null };
}

function createEvaluationErrorType(data) {
  required(data, ["name", "deduction"]);
  numberRange(Number(data.deduction), "deduction", 0, 100);
  return {
    id: uuid(),
    name: data.name,
    deduction: Number(data.deduction),
    description: data.description || null,
    is_active: data.is_active ?? true,
    created_at: now()
  };
}

function resultFromScore(score) {
  if (score >= 90) return EvaluationResult.EXCELLENT;
  if (score >= 80) return EvaluationResult.VERY_GOOD;
  if (score >= 70) return EvaluationResult.GOOD;
  return EvaluationResult.NEEDS_REVIEW;
}

function createExamEvaluation(data, evaluatorId) {
  required(data, ["student_id", "from_juz", "to_juz"]);
  numberRange(Number(data.from_juz), "from_juz", 1, 30);
  numberRange(Number(data.to_juz), "to_juz", 1, 30);
  const from_juz = Number(data.from_juz);
  const to_juz = Number(data.to_juz);
  if (from_juz > to_juz) {
    const error = new Error("from_juz must be less than or equal to to_juz");
    error.status = 400;
    throw error;
  }
  const errors = (data.errors || []).map((error) => ({
    id: error.id || uuid(),
    error_type_id: error.error_type_id || null,
    name: error.name,
    deduction: Number(error.deduction || 0),
    page_number: error.page_number ? Number(error.page_number) : null,
    word: error.word || "",
    note: error.note || null
  }));
  const total_deduction = errors.reduce((sum, error) => sum + Number(error.deduction || 0), 0);
  const final_score = Math.max(0, 100 - total_deduction);
  return {
    id: uuid(),
    student_id: data.student_id,
    teacher_id: data.teacher_id || null,
    evaluator_id: evaluatorId || null,
    from_juz,
    to_juz,
    errors,
    total_errors: errors.length,
    total_deduction,
    final_score,
    result: resultFromScore(final_score),
    notes: data.notes || null,
    date: now()
  };
}

function createExamRequest(data, raisedBy) {
  required(data, ["student_id", "from_juz", "to_juz"]);
  numberRange(Number(data.from_juz), "from_juz", 1, 30);
  numberRange(Number(data.to_juz), "to_juz", 1, 30);
  const from_juz = Number(data.from_juz);
  const to_juz = Number(data.to_juz);
  if (from_juz > to_juz) {
    const error = new Error("from_juz must be less than or equal to to_juz");
    error.status = 400;
    throw error;
  }
  return {
    id: uuid(),
    student_id: data.student_id,
    from_juz,
    to_juz,
    status: "pending",
    raised_by: raisedBy || null,
    notes: data.notes || null,
    created_at: now(),
    completed_at: null
  };
}

function createSession(data) {
  required(data, ["student_id", "teacher_id", "duration_minutes", "from_page", "to_page"]);
  const errors = (data.errors || []).map((error) => ({
    id: error.id || uuid(),
    error_type_id: error.error_type_id || null,
    category: error.category || error.name || "error",
    description: error.description || error.name || null,
    name: error.name || error.description || error.category || "Error",
    penalty: Number(error.penalty ?? error.deduction ?? 1),
    page_number: error.page_number,
    word: error.word || "",
  }));
  const total_pages = Math.abs(data.to_page - data.from_page) + 1;
  const total_errors = errors.length;
  const total_penalty = errors.reduce((sum, error) => sum + Number(error.penalty || 0), 0);
  const final_score = Math.max(0, 100 - total_penalty);
  let result = EvaluationResult.NEEDS_REVIEW;
  if (final_score >= 90) result = EvaluationResult.EXCELLENT;
  else if (final_score >= 80) result = EvaluationResult.VERY_GOOD;
  else if (final_score >= 70) result = EvaluationResult.GOOD;
  return { id: uuid(), ...data, errors, date: now(), total_pages, total_errors, total_penalty, final_score, result };
}

module.exports = {
  EvaluationResult,
  HalaqaLevel,
  StudentStatus,
  UserRole,
  createHalaqa,
  createEvaluationErrorType,
  createExamEvaluation,
  createExamRequest,
  createJuzEvaluation,
  createPageEvaluation,
  createSession,
  createStaff,
  createStudent,
  createTeacher,
  createUser,
  publicUser
};
