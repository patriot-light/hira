const { v4: uuid } = require("uuid");
const { getCollection } = require("../config/database");
const { createHalaqa, createHalaqaType } = require("../models");
const { httpError } = require("./authService");

async function assertCanManageHalaqaAttendance(halaqaId, currentUser) {
  const halaqa = await getCollection("halaqas").findOne(
    { id: halaqaId },
    { projection: { _id: 0 } },
  );
  if (!halaqa) throw httpError(404, "Halaqa not found");
  if (["admin", "staff"].includes(currentUser.role)) return halaqa;
  if (currentUser.role !== "teacher")
    throw httpError(403, "Insufficient permissions");
  const teacher = await getCollection("teachers").findOne(
    { user_id: currentUser.id },
    { projection: { _id: 0 } },
  );
  if (!teacher || !(halaqa.teacher_ids || []).includes(teacher.id)) {
    throw httpError(403, "Insufficient permissions");
  }
  return halaqa;
}

async function listHalaqas(currentUser) {
  if (currentUser.role === "teacher") {
    const teacher = await getCollection("teachers").findOne(
      { user_id: currentUser.id },
      { projection: { _id: 0 } },
    );
    if (!teacher) return [];
    return getCollection("halaqas")
      .find({ teacher_ids: teacher.id }, { projection: { _id: 0 } })
      .toArray();
  }
  if (currentUser.role === "student") {
    const student = await getCollection("students").findOne(
      { user_id: currentUser.id },
      { projection: { _id: 0 } },
    );
    const halaqaIds =
      student?.halaqa_ids || (student?.halaqa_id ? [student.halaqa_id] : []);
    if (!halaqaIds.length) return [];
    return getCollection("halaqas")
      .find({ id: { $in: halaqaIds } }, { projection: { _id: 0 } })
      .toArray();
  }
  return getCollection("halaqas")
    .find({}, { projection: { _id: 0 } })
    .toArray();
}

async function create(data) {
  const halaqa = createHalaqa(data);
  await getCollection("halaqas").insertOne(halaqa);
  return halaqa;
}

async function update(id, data) {
  const result = await getCollection("halaqas").updateOne(
    { id },
    { $set: data },
  );
  if (!result.matchedCount) throw httpError(404, "Halaqa not found");
  return getCollection("halaqas").findOne({ id }, { projection: { _id: 0 } });
}

async function remove(id) {
  const students = await getCollection("students")
    .find({ halaqa_ids: id }, { projection: { _id: 0 } })
    .toArray();
  for (const student of students) {
    const halaqa_ids = (student.halaqa_ids || []).filter(
      (halaqaId) => halaqaId !== id,
    );
    await getCollection("students").updateOne(
      { id: student.id },
      { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } },
    );
  }
  const result = await getCollection("halaqas").deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, "Halaqa not found");
}

async function assignStudent(halaqaId, studentId) {
  const student = await getCollection("students").findOne(
    { id: studentId },
    { projection: { _id: 0 } },
  );
  if (!student) throw httpError(404, "Student not found");
  const halaqa_ids = [
    ...new Set([
      ...(student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])),
      halaqaId,
    ]),
  ];
  await getCollection("students").updateOne(
    { id: studentId },
    { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } },
  );
}

async function removeStudent(halaqaId, studentId) {
  const student = await getCollection("students").findOne(
    { id: studentId },
    { projection: { _id: 0 } },
  );
  if (!student) return;
  const halaqa_ids = (
    student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])
  ).filter((id) => id !== halaqaId);
  await getCollection("students").updateOne(
    { id: studentId },
    { $set: { halaqa_ids, halaqa_id: halaqa_ids[0] || null } },
  );
}

async function markStudentAbsent(halaqaId, studentId, data, currentUser) {
  const halaqa = await assertCanManageHalaqaAttendance(halaqaId, currentUser);
  const student = await getCollection("students").findOne(
    { id: studentId },
    { projection: { _id: 0 } },
  );
  if (!student) throw httpError(404, "Student not found");
  const studentHalaqas =
    student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : []);
  if (!studentHalaqas.includes(halaqaId))
    throw httpError(400, "Student is not assigned to this halaqa");
  const day = new Date().toISOString().slice(0, 10);
  const existing = await getCollection("attendance_records").findOne(
    {
      halaqa_id: halaqaId,
      student_id: studentId,
      status: "absent",
      day,
    },
    { projection: { _id: 0 } },
  );
  if (existing) throw httpError(400, "Student is already marked absent today");

  const record = {
    id: uuid(),
    halaqa_id: halaqaId,
    student_id: studentId,
    status: "absent",
    day,
    reason: data.reason || "absent_no_response",
    notes: data.notes || null,
    marked_by: currentUser.id,
    created_at: new Date().toISOString(),
  };
  await getCollection("attendance_records").insertOne(record);
  await getCollection("notifications").insertOne({
    id: uuid(),
    audience: "admin",
    type: "student_absent",
    title: "Student absent",
    message: `${student.full_name} is absent from ${halaqa.name}`,
    data: {
      student_id: studentId,
      student_name: student.full_name,
      halaqa_id: halaqaId,
      halaqa_name: halaqa.name,
      attendance_id: record.id,
      reason: record.reason,
    },
    read: false,
    created_at: record.created_at,
  });
  return record;
}

async function listAttendance(halaqaId, currentUser) {
  await assertCanManageHalaqaAttendance(halaqaId, currentUser);
  return getCollection("attendance_records")
    .find({ halaqa_id: halaqaId }, { projection: { _id: 0 } })
    .toArray();
}

async function listTypes() {
  return getCollection("halaqa_types")
    .find({ is_active: true }, { projection: { _id: 0 } })
    .toArray();
}

async function createType(data) {
  const type = createHalaqaType(data);
  await getCollection("halaqa_types").insertOne(type);
  return type;
}

async function updateType(id, data) {
  const result = await getCollection("halaqa_types").updateOne(
    { id },
    { $set: data },
  );
  if (!result.matchedCount) throw httpError(404, "Halaqa type not found");
  return getCollection("halaqa_types").findOne(
    { id },
    { projection: { _id: 0 } },
  );
}

async function deleteType(id) {
  const inUse = await getCollection("halaqas").findOne(
    { type_id: id },
    { projection: { _id: 0 } },
  );
  if (inUse) throw httpError(400, "Halaqa type is used by existing halaqas");
  const result = await getCollection("halaqa_types").updateOne(
    { id },
    { $set: { is_active: false } },
  );
  if (!result.matchedCount) throw httpError(404, "Halaqa type not found");
}

module.exports = {
  assignStudent,
  create,
  createType,
  deleteType,
  listAttendance,
  listHalaqas,
  listTypes,
  markStudentAbsent,
  remove,
  removeStudent,
  update,
  updateType,
};
