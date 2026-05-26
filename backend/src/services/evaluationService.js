const { getCollection } = require("../config/database");
const {
  createEvaluationErrorType,
  createExamEvaluation,
  createJuzEvaluation,
  createPageEvaluation,
  UserRole,
} = require("../models");
const { httpError } = require("./authService");

async function studentScopedQuery(currentUser, studentId) {
  if (currentUser.role !== "student")
    return studentId ? { student_id: studentId } : {};
  const student = await getCollection("students").findOne(
    { user_id: currentUser.id },
    { projection: { _id: 0 } },
  );
  return student ? { student_id: student.id } : { student_id: "__none__" };
}

async function listPageEvaluations(currentUser, studentId) {
  return getCollection("page_evaluations")
    .find(await studentScopedQuery(currentUser, studentId), {
      projection: { _id: 0 },
    })
    .toArray();
}

async function listJuzEvaluations(currentUser, studentId) {
  return getCollection("juz_evaluations")
    .find(await studentScopedQuery(currentUser, studentId), {
      projection: { _id: 0 },
    })
    .toArray();
}

async function teacherIdForUser(user) {
  if (![UserRole.TEACHER, UserRole.EXAM_TEACHER].includes(user.role))
    return null;
  const teacher = await getCollection("teachers").findOne(
    { user_id: user.id },
    { projection: { _id: 0 } },
  );
  return teacher?.id || null;
}

async function listExamEvaluations(currentUser, studentId) {
  if (currentUser.role === "student") {
    const student = await getCollection("students").findOne(
      { user_id: currentUser.id },
      { projection: { _id: 0 } },
    );
    return getCollection("exam_evaluations")
      .find(
        { student_id: student?.id || "__none__" },
        { projection: { _id: 0 } },
      )
      .toArray();
  }
  if (currentUser.role === UserRole.EXAM_TEACHER) {
    const requests = await getCollection("exam_requests")
      .find({ status: "pending" }, { projection: { _id: 0 } })
      .toArray();
    const studentIds = requests.map((request) => request.student_id);
    return getCollection("exam_evaluations")
      .find(
        {
          $or: [
            { student_id: { $in: studentIds } },
            { evaluator_id: currentUser.id },
          ],
        },
        { projection: { _id: 0 } },
      )
      .toArray();
  }
  if (currentUser.role === UserRole.TEACHER) {
    const teacherId = await teacherIdForUser(currentUser);
    return getCollection("exam_evaluations")
      .find({ teacher_id: teacherId || "__none__" }, { projection: { _id: 0 } })
      .toArray();
  }
  return getCollection("exam_evaluations")
    .find(studentId ? { student_id: studentId } : {}, {
      projection: { _id: 0 },
    })
    .toArray();
}

async function getExamEvaluation(id, currentUser) {
  const evaluation = await getCollection("exam_evaluations").findOne(
    { id },
    { projection: { _id: 0 } },
  );
  if (!evaluation) throw httpError(404, "Evaluation not found");

  if (currentUser.role === "student") {
    const student = await getCollection("students").findOne(
      { user_id: currentUser.id },
      { projection: { _id: 0 } },
    );
    if (!student || evaluation.student_id !== student.id)
      throw httpError(403, "Insufficient permissions");
  }

  if (currentUser.role === UserRole.EXAM_TEACHER) {
    const request = await getCollection("exam_requests").findOne(
      { student_id: evaluation.student_id },
      { projection: { _id: 0 } },
    );
    if (!request && evaluation.evaluator_id !== currentUser.id)
      throw httpError(403, "Insufficient permissions");
  }

  if (currentUser.role === UserRole.TEACHER) {
    const teacherId = await teacherIdForUser(currentUser);
    if (!teacherId || evaluation.teacher_id !== teacherId)
      throw httpError(403, "Insufficient permissions");
  }

  return evaluation;
}

async function createPage(data, user) {
  const evaluation = createPageEvaluation(data, user.id);
  await getCollection("page_evaluations").insertOne(evaluation);
  return evaluation;
}

async function createJuz(data, user) {
  const evaluation = createJuzEvaluation(data, user.id);
  await getCollection("juz_evaluations").insertOne(evaluation);
  return evaluation;
}

async function createExam(data, user) {
  if (user.role === UserRole.EXAM_TEACHER) {
    const request = await getCollection("exam_requests").findOne(
      { student_id: data.student_id, status: "pending" },
      { projection: { _id: 0 } },
    );
    if (!request) throw httpError(403, "Student is not raised for exam");
    data = {
      ...data,
      from_juz: request.from_juz,
      to_juz: request.to_juz,
      exam_request_id: request.id,
    };
  }
  const teacher_id = data.teacher_id || (await teacherIdForUser(user));
  const evaluation = createExamEvaluation({ ...data, teacher_id }, user.id);
  await getCollection("exam_evaluations").insertOne(evaluation);
  if (data.exam_request_id) {
    await getCollection("exam_requests").updateOne(
      { id: data.exam_request_id },
      {
        $set: {
          status: "completed",
          completed_at: new Date().toISOString(),
          evaluation_id: evaluation.id,
        },
      },
    );
  }
  return evaluation;
}

async function listErrorTypes() {
  await seedErrorTypes();
  return getCollection("evaluation_error_types")
    .find({ is_active: true }, { projection: { _id: 0 } })
    .toArray();
}

async function createErrorType(data) {
  const errorType = createEvaluationErrorType(data);
  await getCollection("evaluation_error_types").insertOne(errorType);
  return errorType;
}

async function updateErrorType(id, data) {
  const update = { ...data };
  if (update.deduction !== undefined)
    update.deduction = Number(update.deduction);
  const result = await getCollection("evaluation_error_types").updateOne(
    { id },
    { $set: update },
  );
  if (!result.matchedCount) throw httpError(404, "Error type not found");
  return getCollection("evaluation_error_types").findOne(
    { id },
    { projection: { _id: 0 } },
  );
}

async function deleteErrorType(id) {
  const result = await getCollection("evaluation_error_types").updateOne(
    { id },
    { $set: { is_active: false } },
  );
  if (!result.matchedCount) throw httpError(404, "Error type not found");
}

async function seedErrorTypes() {
  const collection = getCollection("evaluation_error_types");
  if (await collection.countDocuments({})) return;
  const defaults = [
    {
      name: "Memorization mistake",
      deduction: 5,
      description: "Wrong, missing, or replaced words",
    },
    {
      name: "Tajweed rule",
      deduction: 2,
      description: "Rule mistake such as madd, idgham, or ikhfa",
    },
    {
      name: "Pronunciation",
      deduction: 1,
      description: "Letter or makharij correction",
    },
    {
      name: "Needs prompt",
      deduction: 3,
      description: "Teacher had to remind the student",
    },
  ];
  for (const item of defaults)
    await collection.insertOne(createEvaluationErrorType(item));
}

async function remove(collection, id) {
  const result = await getCollection(collection).deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, "Evaluation not found");
}

module.exports = {
  createErrorType,
  createExam,
  createJuz,
  createPage,
  deleteErrorType,
  getExamEvaluation,
  listErrorTypes,
  listExamEvaluations,
  listJuzEvaluations,
  listPageEvaluations,
  remove,
  seedErrorTypes,
  updateErrorType,
};
