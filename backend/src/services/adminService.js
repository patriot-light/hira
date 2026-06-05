const { getCollection } = require("../config/database");
const { seedDemoAdmin } = require("./authService");
const { seedErrorTypes } = require("./evaluationService");

const APP_COLLECTIONS = Object.freeze([
  "attendance_records",
  "certificate_templates",
  "evaluation_error_types",
  "exam_evaluations",
  "exam_requests",
  "halaqa_types",
  "halaqas",
  "issued_certificates",
  "juz_evaluations",
  "notifications",
  "page_evaluations",
  "recitation_sessions",
  "staff",
  "students",
  "teachers",
  "users",
]);

async function clearAllData() {
  const deleted = {};
  for (const collectionName of APP_COLLECTIONS) {
    const result = await getCollection(collectionName).deleteMany({});
    deleted[collectionName] = result.deletedCount || 0;
  }

  await seedDemoAdmin();
  await seedErrorTypes();

  return {
    message: "All data cleared successfully",
    deleted,
  };
}

module.exports = { APP_COLLECTIONS, clearAllData };
