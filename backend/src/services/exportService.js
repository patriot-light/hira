const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { getCollection } = require("../config/database");
const reports = require("./reportService");

function blank(value) {
  return value === undefined || value === null ? "" : value;
}

function cleanText(value) {
  return String(blank(value)).trim();
}

function studentHalaqaIds(student) {
  return student.halaqa_ids || (student.halaqa_id ? [student.halaqa_id] : []);
}

async function halaqaNameMap() {
  const halaqas = await getCollection("halaqas")
    .find({}, { projection: { _id: 0 } })
    .toArray();
  return new Map(halaqas.map((halaqa) => [halaqa.id, halaqa.name]));
}

function formatHalaqas(student, namesById) {
  return studentHalaqaIds(student)
    .map((id) => {
      const name = namesById.get(id);
      return name ? `${name} (${id})` : id;
    })
    .join(", ");
}

function studentExportRow(student, namesById) {
  return {
    id: cleanText(student.id),
    full_name: cleanText(student.full_name),
    father_name: cleanText(student.father_name),
    mother_name: cleanText(student.mother_name),
    age: blank(student.age),
    national_id: cleanText(student.national_id),
    phone: cleanText(student.phone),
    father_phone: cleanText(student.father_phone),
    mother_phone: cleanText(student.mother_phone),
    parent_phone: cleanText(student.parent_phone),
    email: cleanText(student.email),
    status: cleanText(student.status),
    halaqas: formatHalaqas(student, namesById),
  };
}

async function studentsExcel() {
  const students = await getCollection("students")
    .find({}, { projection: { _id: 0 } })
    .toArray();
  const namesById = await halaqaNameMap();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "ID", key: "id", width: 38 },
    { header: "Full Name", key: "full_name", width: 28 },
    { header: "Father Name", key: "father_name", width: 24 },
    { header: "Mother Name", key: "mother_name", width: 24 },
    { header: "Age", key: "age", width: 8 },
    { header: "National ID", key: "national_id", width: 18 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Father Phone", key: "father_phone", width: 18 },
    { header: "Mother Phone", key: "mother_phone", width: 18 },
    { header: "Parent Phone", key: "parent_phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "Halaqas", key: "halaqas", width: 56 },
  ];
  sheet.addRows(
    students.map((student) => studentExportRow(student, namesById)),
  );
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

function pdfBuffer(build) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    build(doc);
    doc.end();
  });
}

async function studentsPdf() {
  const students = await getCollection("students")
    .find({}, { projection: { _id: 0 } })
    .toArray();
  const namesById = await halaqaNameMap();
  return pdfBuffer((doc) => {
    doc.fontSize(18).text("Hira Institute - Students Report").moveDown();
    for (const student of students) {
      const row = studentExportRow(student, namesById);
      doc
        .fontSize(11)
        .text(
          `${row.full_name} | Age: ${row.age} | Status: ${row.status} | Phone: ${row.phone} | Halaqas: ${row.halaqas}`,
        );
    }
  });
}

async function studentReportPdf(studentId) {
  const report = await reports.studentReport(studentId);
  return pdfBuffer((doc) => {
    doc
      .fontSize(18)
      .text(`Student Report: ${report.student?.full_name || "Unknown"}`)
      .moveDown();
    doc
      .fontSize(11)
      .text(`Total Sessions: ${report.total_sessions || 0}`)
      .text(`Average Score: ${report.average_session_score || 0}%`)
      .text(`Total Pages Read: ${report.total_pages_read || 0}`)
      .text(`Total Errors: ${report.total_errors || 0}`)
      .text(`Memorization Progress: ${report.memorization_progress || 0}%`);
  });
}

module.exports = { studentReportPdf, studentsExcel, studentsPdf };
