const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");
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

function containsArabic(text) {
  return /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/.test(text);
}

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean);

const FONT_PATHS = [
  "C:\\Windows\\Fonts\\arial.ttf",
  "C:\\Windows\\Fonts\\tahoma.ttf",
  "C:\\Windows\\Fonts\\arabtype.ttf"
];

let certificateFontCss;

function getChromePath() {
  return CHROME_PATHS.find((chromePath) => fs.existsSync(chromePath));
}

async function getBrowser() {
  const executablePath = getChromePath();
  if (!executablePath) {
    const error = new Error("Chrome or Edge is required to render certificate PDFs");
    error.status = 500;
    throw error;
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function certificateTextToHtml(value, align = "center") {
  const text = String(value || "");
  if (!containsArabic(text)) return escapeHtml(text);
  const justify = align === "right" ? "flex-end" : align === "left" ? "flex-start" : "center";
  return escapeHtml(text)
    .split(/\r?\n/)
    .map((line) =>
      `<span class="arabic-line" style="justify-content: ${justify};">` +
      (line.match(/\S+/g) || [""])
        .map((token) => `<span class="arabic-word" dir="rtl">${token}</span>`)
        .join('<span class="arabic-space"></span>') +
      "</span>"
    )
    .join("<br />");
}

function getCertificateFontCss() {
  if (certificateFontCss !== undefined) return certificateFontCss;
  const fontPath = FONT_PATHS.find((candidate) => fs.existsSync(candidate));
  if (!fontPath) {
    certificateFontCss = "";
    return certificateFontCss;
  }
  const fontBase64 = fs.readFileSync(fontPath).toString("base64");
  certificateFontCss = `
    @font-face {
      font-family: "CertificateArabic";
      src: url("data:font/truetype;base64,${fontBase64}") format("truetype");
      font-weight: 400 700;
    }
  `;
  return certificateFontCss;
}

function fieldToHtml(field, value, template) {
  const text = String(value || "");
  if (!text) return "";
  const width = field.width * template.width;
  const left = field.x * template.width;
  const top = field.y * template.height;
  const align = ["left", "center", "right"].includes(field.align) ? field.align : "center";
  const fontWeight = field.fontWeight === "bold" ? 700 : 400;
  return `
    <div class="certificate-field" style="
      left: ${left}px;
      top: ${top}px;
      width: ${width}px;
      color: ${escapeAttribute(field.color || "#111827")};
      font-size: ${Number(field.fontSize || 28)}px;
      font-weight: ${fontWeight};
      text-align: ${align};
      transform: translateX(-50%);
    ">${certificateTextToHtml(text, align)}</div>
  `;
}

function certificateHtml(template, values) {
  const fields = (template.fields || []).map((field) => fieldToHtml(field, values[field.key], template)).join("");
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        ${getCertificateFontCss()}
        @page { size: ${template.width}px ${template.height}px; margin: 0; }
        * { box-sizing: border-box; }
        html, body {
          width: ${template.width}px;
          height: ${template.height}px;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #fff;
        }
        .certificate {
          position: relative;
          width: ${template.width}px;
          height: ${template.height}px;
          background-image: url("${escapeAttribute(template.background_image)}");
          background-size: 100% 100%;
          background-repeat: no-repeat;
          font-family: "CertificateArabic", Arial, Tahoma, "Segoe UI", sans-serif;
        }
        .certificate-field {
          position: absolute;
          white-space: pre-wrap;
          line-height: 1.2;
          direction: ltr;
          unicode-bidi: isolate;
        }
        .arabic-line {
          display: flex;
          flex-direction: row-reverse;
          align-items: baseline;
          width: 100%;
        }
        .arabic-word {
          direction: rtl;
          unicode-bidi: isolate;
          display: inline-block;
        }
        .arabic-space {
          display: inline-block;
          width: 0.35em;
          flex: 0 0 0.35em;
        }
      </style>
    </head>
    <body>
      <div class="certificate">${fields}</div>
    </body>
  </html>`;
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

  const values = mapCertificateValues(certificate);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: template.width, height: template.height, deviceScaleFactor: 1 });
    await page.setContent(certificateHtml(template, values), { waitUntil: "load" });
    const buffer = await page.pdf({
      width: `${template.width}px`,
      height: `${template.height}px`,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });
    return { buffer, filename: `${certificate.certificate_number}.pdf` };
  } finally {
    await page.close();
    await browser.close();
  }
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
