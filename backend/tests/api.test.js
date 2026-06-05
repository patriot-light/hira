const assert = require("node:assert/strict");
const test = require("node:test");
const ExcelJS = require("exceljs");
const request = require("supertest");
const { app, initialize } = require("../src/app");

let api;
let token;

test.before(async () => {
  delete process.env.MONGO_URL;
  await initialize();
  api = request(app);
  const response = await api
    .post("/api/auth/login")
    .send({ email: "admin@hira.edu", password: "admin123" });
  assert.equal(response.status, 200);
  token = response.body.access_token;
});

function auth(req) {
  return req.set("Authorization", `Bearer ${token}`);
}

function parseBinary(res, callback) {
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
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
    status: "active",
  });
  assert.equal(student.status, 200);
  assert.ok(student.body.id);

  const teacher = await auth(api.post("/api/teachers")).send({
    full_name: "Dr. Mohammad Al-Qari",
    qualification: "PhD in Quranic Studies",
    experience_years: 10,
    phone: "+966501234568",
    email: "mohammad@hira.edu",
  });
  assert.equal(teacher.status, 200);

  const halaqa = await auth(api.post("/api/halaqas")).send({
    name: "Morning Hifz",
    level: "intermediate",
    teacher_ids: [teacher.body.id],
    schedule: [{ day: "Sunday", start_time: "08:00", end_time: "10:00" }],
  });
  assert.equal(halaqa.status, 200);

  const afternoonHalaqa = await auth(api.post("/api/halaqas")).send({
    name: "Afternoon Review",
    level: "advanced",
    teacher_ids: [teacher.body.id],
    schedule: [],
  });
  assert.equal(afternoonHalaqa.status, 200);

  const assign = await auth(
    api.post(`/api/halaqas/${halaqa.body.id}/students/${student.body.id}`),
  );
  assert.equal(assign.status, 200);
  const secondAssign = await auth(
    api.post(
      `/api/halaqas/${afternoonHalaqa.body.id}/students/${student.body.id}`,
    ),
  );
  assert.equal(secondAssign.status, 200);

  const assignedStudents = await auth(
    api.get(`/api/halaqas/${afternoonHalaqa.body.id}/students`),
  );
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
    page_ratings: [
      { page_number: 1, rating: "excellent" },
      { page_number: 2, rating: "very_good" },
      { page_number: 3, rating: "outstanding" },
    ],
  });
  assert.equal(session.status, 200);
  assert.equal(session.body.total_pages, 3);
  assert.equal(session.body.final_score, 95);
  assert.equal(session.body.total_errors, 0);

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
    phone: "+966501111111",
    status: "active",
  });
  assert.equal(student.status, 200);

  const errorTypes = await auth(api.get("/api/error-types"));
  assert.equal(errorTypes.status, 200);
  assert.ok(errorTypes.body.length >= 1);

  const customError = await auth(api.post("/api/error-types")).send({
    name: "Long pause",
    deduction: 1.5,
    description: "Student paused for too long",
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
        deduction: customError.body.deduction,
        page_number: 42,
        word: "الرحمن",
      },
      {
        error_type_id: customError.body.id,
        name: customError.body.name,
        deduction: customError.body.deduction,
      },
    ],
  });
  assert.equal(exam.status, 200);
  assert.equal(exam.body.from_juz, 3);
  assert.equal(exam.body.to_juz, 5);
  assert.equal(exam.body.total_errors, 2);
  assert.equal(exam.body.total_deduction, 3);
  assert.equal(exam.body.final_score, 97);

  const exams = await auth(
    api.get(`/api/evaluations/exams?student_id=${student.body.id}`),
  );
  assert.equal(exams.status, 200);
  assert.ok(exams.body.some((item) => item.id === exam.body.id));

  const singleExam = await auth(
    api.get(`/api/evaluations/exams/${exam.body.id}`),
  );
  assert.equal(singleExam.status, 200);
  assert.equal(singleExam.body.id, exam.body.id);
  assert.equal(singleExam.body.errors.length, 2);
  assert.equal(singleExam.body.errors[0].page_number, 42);
  assert.equal(singleExam.body.errors[0].word, "الرحمن");
});

test("exam teachers only see raised students and use the raised range", async () => {
  const student = await auth(api.post("/api/students")).send({
    full_name: "Raised Exam Student",
    age: 14,
    phone: "+966555000111",
    status: "active",
  });
  assert.equal(student.status, 200);

  const hiddenStudent = await auth(api.post("/api/students")).send({
    full_name: "Hidden Exam Student",
    age: 15,
    phone: "+966555000222",
    status: "active",
  });
  assert.equal(hiddenStudent.status, 200);

  const examTeacherUser = await api.post("/api/auth/register").send({
    email: "exam-teacher@hira.edu",
    password: "exam123",
    full_name: "Exam Teacher",
    role: "exam_teacher",
  });
  assert.equal(examTeacherUser.status, 200);
  const examTeacherToken = examTeacherUser.body.access_token;

  const roleUpdate = await auth(
    api.put(`/api/users/${examTeacherUser.body.user.id}/role`),
  ).send({ role: "exam_teacher" });
  assert.equal(roleUpdate.status, 200);

  const beforeRaise = await api
    .get("/api/students")
    .set("Authorization", `Bearer ${examTeacherToken}`);
  assert.equal(beforeRaise.status, 200);
  assert.equal(beforeRaise.body.length, 0);

  const raise = await auth(
    api.post(`/api/students/${student.body.id}/exam-request`),
  ).send({ from_juz: 7, to_juz: 9 });
  assert.equal(raise.status, 200);

  const visibleStudents = await api
    .get("/api/students")
    .set("Authorization", `Bearer ${examTeacherToken}`);
  assert.equal(visibleStudents.status, 200);
  assert.equal(visibleStudents.body.length, 1);
  assert.equal(visibleStudents.body[0].id, student.body.id);
  assert.equal(visibleStudents.body[0].exam_request.from_juz, 7);

  const forbiddenStudent = await api
    .get(`/api/students/${hiddenStudent.body.id}`)
    .set("Authorization", `Bearer ${examTeacherToken}`);
  assert.equal(forbiddenStudent.status, 403);

  const exam = await api
    .post("/api/evaluations/exams")
    .set("Authorization", `Bearer ${examTeacherToken}`)
    .send({
      student_id: student.body.id,
      from_juz: 1,
      to_juz: 1,
      errors: [],
    });
  assert.equal(exam.status, 200);
  assert.equal(exam.body.from_juz, 7);
  assert.equal(exam.body.to_juz, 9);

  const afterExam = await api
    .get("/api/students")
    .set("Authorization", `Bearer ${examTeacherToken}`);
  assert.equal(afterExam.status, 200);
  assert.equal(afterExam.body.length, 0);
});

test("teacher users are locked to their own teacher profile for sessions", async () => {
  const teacherRegister = await api.post("/api/auth/register").send({
    email: "teacher-lock@hira.edu",
    password: "teacher123",
    full_name: "Locked Teacher",
    role: "teacher",
  });
  assert.equal(teacherRegister.status, 200);
  const teacherToken = teacherRegister.body.access_token;
  const teacherProfileId = `${teacherRegister.body.user.id}_teacher`;

  const student = await auth(api.post("/api/students")).send({
    full_name: "Teacher Lock Student",
    age: 12,
    phone: "+966555000333",
    status: "active",
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
      errors: [],
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.teacher_id, teacherProfileId);
});

test("exports return binary files", async () => {
  const student = await auth(api.post("/api/students")).send({
    full_name: "Export Name Order",
    phone: "+966555000444",
    status: "active",
  });
  assert.equal(student.status, 200);

  const firstHalaqa = await auth(api.post("/api/halaqas")).send({
    name: "Export First Halaqa",
  });
  assert.equal(firstHalaqa.status, 200);
  const secondHalaqa = await auth(api.post("/api/halaqas")).send({
    name: "Export Second Halaqa",
  });
  assert.equal(secondHalaqa.status, 200);

  const assignFirst = await auth(
    api.post(`/api/halaqas/${firstHalaqa.body.id}/students/${student.body.id}`),
  );
  assert.equal(assignFirst.status, 200);
  const assignSecond = await auth(
    api.post(
      `/api/halaqas/${secondHalaqa.body.id}/students/${student.body.id}`,
    ),
  );
  assert.equal(assignSecond.status, 200);

  const excel = await auth(api.get("/api/export/students/excel"))
    .buffer(true)
    .parse(parseBinary);
  assert.equal(excel.status, 200);
  assert.match(excel.headers["content-type"], /spreadsheetml/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(excel.body);
  const sheet = workbook.getWorksheet("Students");
  const headers = sheet.getRow(1).values;
  const fullNameColumn = headers.indexOf("Full Name");
  const ageColumn = headers.indexOf("Age");
  const halaqasColumn = headers.indexOf("Halaqas");
  assert.ok(fullNameColumn > 0);
  assert.ok(ageColumn > 0);
  assert.ok(halaqasColumn > 0);
  const exportRow = sheet
    .getRows(2, sheet.rowCount - 1)
    .find((row) => row.getCell(fullNameColumn).value === "Export Name Order");
  assert.ok(exportRow);
  assert.equal(exportRow.getCell(ageColumn).value, "");
  assert.match(exportRow.getCell(halaqasColumn).value, /Export First Halaqa/);
  assert.match(exportRow.getCell(halaqasColumn).value, /Export Second Halaqa/);

  const pdf = await auth(api.get("/api/export/students/pdf"));
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers["content-type"], /pdf/);
});

test("admins can design and issue certificate PDFs", async () => {
  const background =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

  const template = await auth(api.post("/api/certificates/templates")).send({
    name: "Completion certificate",
    background_image: background,
    width: 600,
    height: 400,
    fields: [
      {
        key: "studentName",
        x: 0.5,
        y: 0.4,
        width: 0.6,
        fontSize: 32,
        color: "#111827",
        align: "center",
        fontWeight: "bold",
      },
      {
        key: "degree",
        x: 0.5,
        y: 0.55,
        width: 0.6,
        fontSize: 22,
        color: "#334155",
        align: "center",
      },
      {
        key: "issueDate",
        x: 0.5,
        y: 0.7,
        width: 0.35,
        fontSize: 16,
        color: "#334155",
        align: "center",
      },
      {
        key: "custom_teacher",
        label: "Teacher",
        x: 0.5,
        y: 0.8,
        width: 0.45,
        fontSize: 16,
        color: "#334155",
        align: "center",
      },
    ],
  });
  assert.equal(template.status, 200);
  assert.equal(template.body.fields.length, 4);

  const certificate = await auth(api.post("/api/certificates/issued")).send({
    template_id: template.body.id,
    student_name: "الطالب المجتهد",
    degree: "إتمام جزء عم",
    issue_date: "2026-05-18",
    custom_fields: {
      custom_teacher: "الشيخ أحمد",
    },
  });
  assert.equal(certificate.status, 200);
  assert.match(certificate.body.certificate_number, /^CERT-/);
  assert.equal(certificate.body.custom_fields.custom_teacher, "الشيخ أحمد");

  const pdf = await auth(
    api.get(`/api/certificates/issued/${certificate.body.id}/pdf`),
  );
  assert.equal(pdf.status, 200);
  assert.match(pdf.headers["content-type"], /pdf/);

  const deleteTemplate = await auth(
    api.delete(`/api/certificates/templates/${template.body.id}`),
  );
  assert.equal(deleteTemplate.status, 200);

  const pdfAfterDelete = await auth(
    api.get(`/api/certificates/issued/${certificate.body.id}/pdf`),
  );
  assert.equal(pdfAfterDelete.status, 200);
  assert.match(pdfAfterDelete.headers["content-type"], /pdf/);

  const studentUser = await api.post("/api/auth/register").send({
    email: "certificate-student@hira.edu",
    password: "student123",
    full_name: "Certificate Locked Student",
    role: "student",
  });
  assert.equal(studentUser.status, 200);

  const forbidden = await api
    .get("/api/certificates/templates")
    .set("Authorization", `Bearer ${studentUser.body.access_token}`);
  assert.equal(forbidden.status, 403);
});

test("admins can clear all application data and defaults are restored", async () => {
  const student = await auth(api.post("/api/students")).send({
    full_name: "Clear Data Student",
    phone: "+966555000555",
    status: "active",
  });
  assert.equal(student.status, 200);

  const clear = await auth(api.delete("/api/admin/data"));
  assert.equal(clear.status, 200);
  assert.equal(clear.body.message, "All data cleared successfully");
  assert.ok(clear.body.deleted.users >= 1);
  assert.ok(clear.body.deleted.students >= 1);

  const login = await api
    .post("/api/auth/login")
    .send({ email: "admin@hira.edu", password: "admin123" });
  assert.equal(login.status, 200);

  const restoredToken = login.body.access_token;
  const dashboard = await api
    .get("/api/reports/dashboard")
    .set("Authorization", `Bearer ${restoredToken}`);
  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.total_students, 0);

  const errorTypes = await api
    .get("/api/error-types")
    .set("Authorization", `Bearer ${restoredToken}`);
  assert.equal(errorTypes.status, 200);
  assert.ok(errorTypes.body.length >= 1);
});
