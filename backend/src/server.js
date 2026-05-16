const { initialize } = require("./app");
const { closeDatabase, isUsingMemory } = require("./config/database");
const dotenv = require("dotenv");
const path = require("path");

const port = Number(process.env.PORT || 8000);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

initialize()
  .then((app) => {
    const server = app.listen(port, () => {
      console.log(`Hira Institute API listening on http://127.0.0.1:${port}`);
      if (isUsingMemory())
        console.log("MONGO_URL not set; using in-memory storage for this run.");
    });

    async function shutdown() {
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((error) => {
    console.error("Failed to start API", error);
    process.exit(1);
  });
