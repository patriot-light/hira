const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { getCollection } = require("../config/database");
const { createCertificateTemplate, createIssuedCertificate } = require("../models");

const FIELD_LABELS = {
  studentName: "Student name",
  degree: "Degree",
  issueDate: "Issue date",
  certificateNumber: "Certificate number"
};

function notFound(message) {
  const error = new Error(message);
  error.status = 404;
  return error;
}

function validateImageDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !/^data:image\/(png|jpeg|jpg);base64,/i.test(dataUrl)) {
    const error = new Error("Certificate background must be a PNG or JPEG image");
    error.status = 400;
    throw error;
  }
}

function normalizeFields(fields = []) {
  return fields.map((field, index) => {
    const key = field.key || `custom_${Date.now()}_${index}`;
    return {
    key,
    label: field.label || FIELD_LABELS[key] || key,
    x: Math.max(0, Math.min(1, Number(field.x ?? 0.5))),
    y: Math.max(0, Math.min(1, Number(field.y ?? 0.5))),
    width: Math.max(0.05, Math.min(1, Number(field.width ?? 0.35))),
    fontSize: Math.max(8, Math.min(96, Number(field.fontSize ?? 32))),
    fontFamily: field.fontFamily || "Arial",
    color: field.color || "#111827",
    align: field.align || "center",
    fontWeight: field.fontWeight || "normal"
  };
  });
}

function mapCertificateValues(certificate) {
  return {
    studentName: certificate.student_name,
    degree: certificate.degree,
    issueDate: certificate.issue_date,
    certificateNumber: certificate.certificate_number,
    ...(certificate.custom_fields || {})
  };
}

function getWindowsFont(name) {
  const fontPath = path.join("C:\\Windows\\Fonts", name);
  return fs.existsSync(fontPath) ? fontPath : null;
}

function registerCertificateFonts(doc) {
  const regular = getWindowsFont("arial.ttf");
  const bold = getWindowsFont("arialbd.ttf");
  if (regular) doc.registerFont("CertificateRegular", regular);
  if (bold) doc.registerFont("CertificateBold", bold);
  return {
    regular: regular ? "CertificateRegular" : "Helvetica",
    bold: bold ? "CertificateBold" : "Helvetica-Bold"
  };
}

function imageBufferFromDataUrl(dataUrl) {
  const [, base64] = dataUrl.split(",");
  return Buffer.from(base64, "base64");
}

async function listTemplates() {
  return getCollection("certificate_templates").find({}, { projection: { _id: 0 } }).toArray();
}

async function createTemplate(data, user) {
  validateImageDataUrl(data.background_image);
  const template = createCertificateTemplate(
    {
      ...data,
      width: Number(data.width),
      height: Number(data.height),
      fields: normalizeFields(data.fields)
    },
    user.id
  );
  await getCollection("certificate_templates").insertOne(template);
  return template;
}

async function updateTemplate(id, data) {
  const existing = await getCollection("certificate_templates").findOne({ id }, { projection: { _id: 0 } });
  if (!existing) throw notFound("Certificate template not found");
  if (data.background_image) validateImageDataUrl(data.background_image);
  const updated = {
    ...existing,
    name: data.name ?? existing.name,
    background_image: data.background_image ?? existing.background_image,
    width: Number(data.width ?? existing.width),
    height: Number(data.height ?? existing.height),
    fields: normalizeFields(data.fields ?? existing.fields),
    updated_at: new Date().toISOString()
  };
  await getCollection("certificate_templates").updateOne({ id }, { $set: updated });
  return updated;
}

async function deleteTemplate(id) {
  const result = await getCollection("certificate_templates").deleteOne({ id });
  if (!result.deletedCount) throw notFound("Certificate template not found");
}

async function issueCertificate(data, user) {
  const template = await getCollection("certificate_templates").findOne({ id: data.template_id }, { projection: { _id: 0 } });
  if (!template) throw notFound("Certificate template not found");
  const certificate = createIssuedCertificate(
    {
      template_id: data.template_id,
      student_id: data.student_id || null,
      student_name: data.student_name,
      degree: data.degree,
      issue_date: data.issue_date || new Date().toISOString().slice(0, 10),
      custom_fields: data.custom_fields || {},
      certificate_number: data.certificate_number,
      template_snapshot: {
        background_image: template.background_image,
        width: template.width,
        height: template.height,
        fields: template.fields
      }
    },
    user.id
  );
  await getCollection("issued_certificates").insertOne(certificate);
  return certificate;
}

async function listIssuedCertificates() {
  return getCollection("issued_certificates").find({}, { projection: { _id: 0 } }).toArray();
}

async function renderCertificatePdf(id) {
  const certificate = await getCollection("issued_certificates").findOne({ id }, { projection: { _id: 0 } });
  if (!certificate) throw notFound("Issued certificate not found");
  const template =
    certificate.template_snapshot ||
    (await getCollection("certificate_templates").findOne({ id: certificate.template_id }, { projection: { _id: 0 } }));
  if (!template) throw notFound("Certificate template not found");

  const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
  const fonts = registerCertificateFonts(doc);
  doc.addPage({ size: [template.width, template.height], margin: 0 });
  doc.image(imageBufferFromDataUrl(template.background_image), 0, 0, {
    width: template.width,
    height: template.height
  });

  const values = mapCertificateValues(certificate);
  for (const field of template.fields || []) {
    const value = values[field.key] || "";
    if (!value) continue;
    const x = field.x * template.width;
    const y = field.y * template.height;
    const width = field.width * template.width;
    doc
      .fillColor(field.color || "#111827")
      .font(field.fontWeight === "bold" ? fonts.bold : fonts.regular)
      .fontSize(field.fontSize || 28)
      .text(value, x - width / 2, y, { width, align: field.align || "center" });
  }

  doc.end();
  return { doc, filename: `${certificate.certificate_number}.pdf` };
}

module.exports = {
  createTemplate,
  deleteTemplate,
  issueCertificate,
  listIssuedCertificates,
  listTemplates,
  renderCertificatePdf,
  updateTemplate
};
