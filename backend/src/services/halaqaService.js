const { getCollection } = require("../config/database");
const { createHalaqa } = require("../models");
const { httpError } = require("./authService");

async function listHalaqas(currentUser) {
  if (currentUser.role === "teacher") {
    const teacher = await getCollection("teachers").findOne({ user_id: currentUser.id }, { projection: { _id: 0 } });
    if (!teacher) return [];
    return getCollection("halaqas").find({ teacher_ids: teacher.id }, { projection: { _id: 0 } }).toArray();
  }
  if (currentUser.role === "student") {
    const student = await getCollection("students").findOne({ user_id: currentUser.id }, { projection: { _id: 0 } });
    const halaqaIds = student?.halaqa_ids || (student?.halaqa_id ? [student.halaqa_id] : []);
    if (!halaqaIds.length) return [];
    return getCollection("halaqas").find({ id: { $in: halaqaIds } }, { projection: { _id: 0 } }).toArray();
  }
  return getCollection("halaqas").find({}, { projection: { _id: 0 } }).toArray();
}

async function create(data) {
  const halaqa = createHalaqa(data);
  await getCollection("halaqas").insertOne(halaqa);
  return halaqa;
}

async function update(id, data) {
  const result = await getCollection("halaqas").updateOne({ id }, { $set: data });
  if (!result.matchedCount) throw httpError(404, "Halaqa not found");
  return getCollection("halaqas").findOne({ id }, { projection: { _id: 0 } });
}

async function remove(id) {
  const students = await getCollection("students").find({ halaqa_ids: id }, { projection: { _id: 0 } }).toArray();
  for (const student of students) {
    const halaqa_ids = (student.halaqa_ids || []).filter((halaqaId) => halaqaId !== id);
    await getCollection("students").updateOne({ id: student.id }, { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } });
  }
  const result = await getCollection("halaqas").deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, "Halaqa not found");
}

async function assignStudent(halaqaId, studentId) {
  const student = await getCollection("students").findOne({ id: studentId }, { projection: { _id: 0 } });
  if (!student) throw httpError(404, "Student not found");
  const halaqa_ids = [...new Set([...(student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])), halaqaId])];
  await getCollection("students").updateOne({ id: studentId }, { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } });
}

async function removeStudent(halaqaId, studentId) {
  const student = await getCollection("students").findOne({ id: studentId }, { projection: { _id: 0 } });
  if (!student) return;
  const halaqa_ids = (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).filter((id) => id !== halaqaId);
  await getCollection("students").updateOne({ id: studentId }, { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } });
}

module.exports = { assignStudent, create, listHalaqas, remove, removeStudent, update };
