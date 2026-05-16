const bcrypt = require("bcryptjs");
const { getCollection } = require("../config/database");
const { createStaff, createStudent, createTeacher, createUser, publicUser, UserRole } = require("../models");
const { httpError } = require("./authService");

async function createLinkedUser(data, role) {
  if (!data.email || !data.password) return null;
  const existing = await getCollection("users").findOne({ email: data.email });
  if (existing) throw httpError(400, "Email already registered");
  const user = createUser({ email: data.email, full_name: data.full_name, role });
  const password_hash = await bcrypt.hash(data.password, 10);
  await getCollection("users").insertOne({ ...user, password_hash });
  return user.id;
}

async function syncLinkedUser(profile, data) {
  if (!profile?.user_id) return;
  await getCollection("users").updateOne({ id: profile.user_id }, { $set: { full_name: data.full_name, email: data.email || null } });
}

async function listStudents(currentUser) {
  if (currentUser.role === "student") {
    return getCollection("students").find({ user_id: currentUser.id }, { projection: { _id: 0 } }).toArray();
  }
  if (currentUser.role === "teacher") {
    const teacher = await getCollection("teachers").findOne({ user_id: currentUser.id }, { projection: { _id: 0 } });
    if (!teacher) return [];
    const halaqas = await getCollection("halaqas").find({ teacher_ids: teacher.id }, { projection: { _id: 0 } }).toArray();
    const halaqaIds = halaqas.map((h) => h.id);
    const students = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
    return students.filter((student) =>
      (student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : [])).some((id) => halaqaIds.includes(id)),
    );
  }
  return getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
}

async function createStudentProfile(data) {
  const userId = await createLinkedUser(data, UserRole.STUDENT);
  const student = createStudent({ ...data, user_id: userId || data.user_id || null });
  await getCollection("students").insertOne(student);
  return student;
}

async function updateStudentProfile(id, data) {
  const profile = await getCollection("students").findOne({ id }, { projection: { _id: 0 } });
  await syncLinkedUser(profile, data);
  const update = { ...data };
  delete update.password;
  update.halaqa_ids = update.halaqa_ids || (update.halaqa_id ? [update.halaqa_id] : []);
  update.halaqa_id = update.halaqa_ids[0] || null;
  const result = await getCollection("students").updateOne({ id }, { $set: update });
  if (!result.matchedCount) throw httpError(404, "Student not found");
  return getCollection("students").findOne({ id }, { projection: { _id: 0 } });
}

async function deleteProfile(collection, id, notFoundMessage) {
  const profile = await getCollection(collection).findOne({ id }, { projection: { _id: 0 } });
  if (profile?.user_id) await getCollection("users").deleteOne({ id: profile.user_id });
  const result = await getCollection(collection).deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, notFoundMessage);
}

async function createTeacherProfile(data) {
  const userId = await createLinkedUser(data, UserRole.TEACHER);
  const teacher = createTeacher({ ...data, user_id: userId || data.user_id || null });
  await getCollection("teachers").insertOne(teacher);
  return teacher;
}

async function updateTeacherProfile(id, data) {
  const teacher = await getCollection("teachers").findOne({ id }, { projection: { _id: 0 } });
  await syncLinkedUser(teacher, data);
  const update = { ...data };
  delete update.password;
  const result = await getCollection("teachers").updateOne({ id }, { $set: update });
  if (!result.matchedCount) throw httpError(404, "Teacher not found");
  return getCollection("teachers").findOne({ id }, { projection: { _id: 0 } });
}

async function createStaffProfile(data) {
  const userId = await createLinkedUser(data, UserRole.STAFF);
  const staff = createStaff({ ...data, user_id: userId || data.user_id || null });
  await getCollection("staff").insertOne(staff);
  return staff;
}

async function updateStaffProfile(id, data) {
  const staff = await getCollection("staff").findOne({ id }, { projection: { _id: 0 } });
  await syncLinkedUser(staff, data);
  const update = { ...data };
  delete update.password;
  const result = await getCollection("staff").updateOne({ id }, { $set: update });
  if (!result.matchedCount) throw httpError(404, "Staff not found");
  return getCollection("staff").findOne({ id }, { projection: { _id: 0 } });
}

async function listUsers() {
  const users = await getCollection("users").find({}, { projection: { _id: 0, password_hash: 0 } }).toArray();
  return users.map(publicUser);
}

async function updateUserRole(id, role) {
  const result = await getCollection("users").updateOne({ id }, { $set: { role } });
  if (!result.matchedCount) throw httpError(404, "User not found");
}

async function deleteUser(id) {
  await getCollection("students").deleteOne({ user_id: id });
  await getCollection("teachers").deleteOne({ user_id: id });
  await getCollection("staff").deleteOne({ user_id: id });
  const result = await getCollection("users").deleteOne({ id });
  if (!result.deletedCount) throw httpError(404, "User not found");
}

module.exports = {
  createStaffProfile,
  createStudentProfile,
  createTeacherProfile,
  deleteProfile,
  deleteUser,
  listStudents,
  listUsers,
  updateStaffProfile,
  updateStudentProfile,
  updateTeacherProfile,
  updateUserRole
};
