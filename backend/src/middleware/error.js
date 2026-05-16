function notFound(req, res) {
  res.status(404).json({ detail: "Not found" });
}

function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ detail: error.message || "Internal server error" });
}

module.exports = { errorHandler, notFound };
