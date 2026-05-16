const { getCollection } = require("../config/database");
const { createSession } = require("../models");
const { httpError } = require("./authService");

async function listSessions(currentUser, studentId) {
  const query = {};
  if (currentUser.role === "student") {
    const student = await getCollection("students").findOne({ user_id: currentUser.id }, { projection: { _id: 0 } });
    if (student) query.student_id = student.id;
  } else if (currentUser.role === "teacher") {
    const teacher = await getCollection("teachers").findOne({ user_id: currentUser.id }, { projection: { _id: 0 } });
    if (teacher) query.teacher_id = teacher.id;
  } else if (studentId) {
    query.student_id = studentId;
  }
  return getCollection("recitation_sessions").find(query, { projection: { _id: 0 } }).toArray();
}

async function teacherIdForUser(user) {
  if (user.role !== "teacher") return null;
  const teacher = await getCollection("teachers").findOne({ user_id: user.id }, { projection: { _id: 0 } });
  if (!teacher) throw httpError(400, "Teacher profile not found");
  return teacher.id;
}

async function create(data, user) {
  const teacher_id = await teacherIdForUser(user) || data.teacher_id;
  const session = createSession({ ...data, teacher_id });
  await getCollection("recitation_sessions").insertOne(session);
  return session;
}

async function remove(id) {
  const result = await getCollection("recitation_sessions").deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, "Session not found");
}

module.exports = { create, listSessions, remove };
