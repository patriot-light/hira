const assert = require("node:assert/strict");
const test = require("node:test");
const request = require("supertest");
const { app, initialize } = require("../src/app");

let api;
let token;

test.before(async () => {
  delete process.env.MONGO_URL;
  await initialize();
  api = request(app);
  const response = await api.post("/api/auth/login").send({ email: "admin@hira.edu", password: "admin123" });
  assert.equal(response.status, 200);
  token = response.body.access_token;
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

test("auth/me returns the current admin user", async () => {
  const response = await auth(api.get("/api/auth/me"));
  assert.equal(response.status, 200);
  assert.equal(response.body.email, "admin@hira.edu");
  assert.equal(response.body.role, "admin");
  assert.equal(response.body.full_name, "Demo Admin");
});

test("student, teacher, halaqa, session, and reports flow", async () => {
  const student = await auth(api.post("/api/students")).send({
    full_name: "Ahmed Al-Hafiz",
    age: 15,
    national_id: "1234567890",
    phone: "+966501234567",
    email: "ahmed@example.com",
    status: "active"
  });
  assert.equal(student.status, 200);
  assert.ok(student.body.id);

  const teacher = await auth(api.post("/api/teachers")).send({
    full_name: "Dr. Mohammad Al-Qari",
    qualification: "PhD in Quranic Studies",
    experience_years: 10,
    phone: "+966501234568",
    email: "mohammad@hira.edu"
  });
  assert.equal(teacher.status, 200);

  const halaqa = await auth(api.post("/api/halaqas")).send({
    name: "Morning Hifz",
    level: "intermediate",
    teacher_ids: [teacher.body.id],
    schedule: [{ day: "Sunday", start_time: "08:00", end_time: "10:00" }]
  });
  assert.equal(halaqa.status, 200);

  const afternoonHalaqa = await auth(api.post("/api/halaqas")).send({
    name: "Afternoon Review",
    level: "advanced",
    teacher_ids: [teacher.body.id],
    schedule: []
  });
  assert.equal(afternoonHalaqa.status, 200);

  const assign = await auth(api.post(`/api/halaqas/${halaqa.body.id}/students/${student.body.id}`));
  assert.equal(assign.status, 200);
  const secondAssign = await auth(api.post(`/api/halaqas/${afternoonHalaqa.body.id}/students/${student.body.id}`));
  assert.equal(secondAssign.status, 200);

  const assignedStudents = await auth(api.get(`/api/halaqas/${afternoonHalaqa.body.id}/students`));
  assert.equal(assignedStudents.status, 200);
  assert.equal(assignedStudents.body[0].id, student.body.id);

  const sharedErrorTypes = await auth(api.get("/api/error-types"));
  assert.equal(sharedErrorTypes.status, 200);
  assert.ok(sharedErrorTypes.body.length >= 1);

  const session = await auth(api.post("/api/sessions")).send({
    student_id: student.body.id,
    teacher_id: teacher.body.id,
    duration_minutes: 45,
    from_page: 1,
    to_page: 3,
    errors: [{
      error_type_id: sharedErrorTypes.body[0].id,
      name: sharedErrorTypes.body[0].name,
      page_number: 1,
      deduction: 2
    }]
  });
  assert.equal(session.status, 200);
  assert.equal(session.body.total_pages, 3);
  assert.equal(session.body.final_score, 98);

  const dashboard = await auth(api.get("/api/reports/dashboard"));
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.total_students, 1);
  assert.equal(dashboard.body.total_sessions, 1);

  const report = await auth(api.get(`/api/reports/student/${student.body.id}`));
  assert.equal(report.status, 200);
  assert.equal(report.body.total_pages_read, 3);
});

test("dynamic exam evaluations calculate final score", async () => {
  const student = await auth(api.post("/api/students")).send({
    full_name: "Fatima Al-Hafiza",
    age: 13,
    status: "active"
  });
  assert.equal(student.status, 200);

  const errorTypes = await auth(api.get("/api/error-types"));
  assert.equal(errorTypes.status, 200);
  assert.ok(errorTypes.body.length >= 1);

  const customError = await auth(api.post("/api/error-types")).send({
    name: "Long pause",
    deduction: 1.5,
    description: "Student paused for too long"
  });
  assert.equal(customError.status, 200);

  const exam = await auth(api.post("/api/evaluations/exams")).send({
    student_id: student.body.id,
    from_juz: 3,
    to_juz: 5,
    errors: [
      {
        error_type_id: customError.body.id,
        name: customError.body.name,
        deduction: customError.body.deduction
      },
      {
        error_type_id: customError.body.id,
        name: customError.body.name,
        deduction: customError.body.deduction
      }
    ]
  });
  assert.equal(exam.status, 200);
  assert.equal(exam.body.from_juz, 3);
  assert.equal(exam.body.to_juz, 5);
  assert.equal(exam.body.total_errors, 2);
  assert.equal(exam.body.total_deduction, 3);
  assert.equal(exam.body.final_score, 97);

  const exams = await auth(api.get(`/api/evaluations/exams?student_id=${student.body.id}`));
  assert.equal(exams.status, 200);
  assert.ok(exams.body.some((item) => item.id === exam.body.id));

  const singleExam = await auth(api.get(`/api/evaluations/exams/${exam.body.id}`));
  assert.equal(singleExam.status, 200);
  assert.equal(singleExam.body.id, exam.body.id);
  assert.equal(singleExam.body.errors.length, 2);
});

test("teacher users are locked to their own teacher profile for sessions", async () => {
  const teacherRegister = await api.post("/api/auth/register").send({
    email: "teacher-lock@hira.edu",
    password: "teacher123",
    full_name: "Locked Teacher",
    role: "teacher"
  });
  assert.equal(teacherRegister.status, 200);
  const teacherToken = teacherRegister.body.access_token;
  const teacherProfileId = `${teacherRegister.body.user.id}_teacher`;

  const student = await auth(api.post("/api/students")).send({
    full_name: "Teacher Lock Student",
    age: 12,
    status: "active"
  });
  assert.equal(student.status, 200);

  const response = await api
    .post("/api/sessions")
    .set("Authorization", `Bearer ${teacherToken}`)
    .send({
      student_id: student.body.id,
      teacher_id: "spoofed-teacher-id",
      duration_minutes: 30,
      from_page: 10,
      to_page: 12,
      errors: []
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.teacher_id, teacherProfileId);
});

test("exports return binary files", async () => {
  const excel = await auth(api.get("/api/export/students/excel"));
  assert.equal(excel.status, 200);
  assert.match(excel.headers["content-type"], /spreadsheetml/);

  const pdf = await auth(api.get("/api/export/students/pdf"));
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers["content-type"], /pdf/);
});
