const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { getCollection } = require("../config/database");
const reports = require("./reportService");

async function studentsExcel() {
  const students = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Students");
  sheet.columns = [
    { header: "ID", key: "id", width: 38 },
    { header: "Full Name", key: "full_name", width: 28 },
    { header: "Age", key: "age", width: 8 },
    { header: "National ID", key: "national_id", width: 18 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Status", key: "status", width: 12 },
    { header: "Halaqa ID", key: "halaqa_id", width: 38 }
  ];
  sheet.addRows(students.map((student) => ({
    ...student,
    national_id: student.national_id || "",
    phone: student.phone || "",
    email: student.email || "",
    status: student.status || "",
    halaqa_id: student.halaqa_id || ""
  })));
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
  const students = await getCollection("students").find({}, { projection: { _id: 0 } }).toArray();
  return pdfBuffer((doc) => {
    doc.fontSize(18).text("Hira Institute - Students Report").moveDown();
    for (const student of students) {
      doc.fontSize(11).text(`${student.full_name} | Age: ${student.age} | Status: ${student.status || ""} | Phone: ${student.phone || ""}`);
    }
  });
}

async function studentReportPdf(studentId) {
  const report = await reports.studentReport(studentId);
  return pdfBuffer((doc) => {
    doc.fontSize(18).text(`Student Report: ${report.student?.full_name || "Unknown"}`).moveDown();
    doc.fontSize(11)
      .text(`Total Sessions: ${report.total_sessions || 0}`)
      .text(`Average Score: ${report.average_session_score || 0}%`)
      .text(`Total Pages Read: ${report.total_pages_read || 0}`)
      .text(`Total Errors: ${report.total_errors || 0}`)
      .text(`Memorization Progress: ${report.memorization_progress || 0}%`);
  });
}

module.exports = { studentReportPdf, studentsExcel, studentsPdf };
