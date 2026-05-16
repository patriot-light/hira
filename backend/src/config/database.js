const { MongoClient } = require("mongodb");

class MemoryCollection {
  constructor() {
    this.items = [];
  }

  matches(item, query = {}) {
    return Object.entries(query).every(([key, expected]) => {
      const actual = item[key];
      if (expected && typeof expected === "object" && !Array.isArray(expected)) {
        if ("$in" in expected) {
          if (Array.isArray(actual)) return actual.some((value) => expected.$in.includes(value));
          return expected.$in.includes(actual);
        }
        if ("$ne" in expected) return actual !== expected.$ne;
      }
      if (Array.isArray(actual)) return actual.includes(expected);
      return actual === expected;
    });
  }

  project(item, projection) {
    if (!projection) return { ...item };
    const result = { ...item };
    for (const [key, value] of Object.entries(projection)) {
      if (value === 0) delete result[key];
    }
    return result;
  }

  async findOne(query = {}, options = {}) {
    const item = this.items.find((entry) => this.matches(entry, query));
    return item ? this.project(item, options.projection) : null;
  }

  find(query = {}, options = {}) {
    const rows = this.items
      .filter((entry) => this.matches(entry, query))
      .map((entry) => this.project(entry, options.projection));
    return { toArray: async () => rows };
  }

  async insertOne(document) {
    this.items.push({ ...document });
    return { acknowledged: true };
  }

  async updateOne(query, update) {
    const index = this.items.findIndex((entry) => this.matches(entry, query));
    if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
    this.items[index] = { ...this.items[index], ...(update.$set || {}) };
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update) {
    let modifiedCount = 0;
    this.items = this.items.map((entry) => {
      if (!this.matches(entry, query)) return entry;
      modifiedCount += 1;
      return { ...entry, ...(update.$set || {}) };
    });
    return { modifiedCount };
  }

  async deleteOne(query) {
    const before = this.items.length;
    this.items = this.items.filter((entry, index) => index !== this.items.findIndex((item) => this.matches(item, query)));
    return { deletedCount: before === this.items.length ? 0 : 1 };
  }

  async countDocuments(query = {}) {
    return this.items.filter((entry) => this.matches(entry, query)).length;
  }
}

class MemoryDatabase {
  constructor() {
    this.collections = new Map();
  }

  collection(name) {
    if (!this.collections.has(name)) this.collections.set(name, new MemoryCollection());
    return this.collections.get(name);
  }
}

let client;
let database = new MemoryDatabase();
let usingMemory = true;

async function connectDatabase() {
  if (!process.env.MONGO_URL) return database;
  client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  database = client.db(process.env.DB_NAME || "hira");
  usingMemory = false;
  return database;
}

function getDb() {
  return database;
}

function getCollection(name) {
  return getDb().collection(name);
}

async function closeDatabase() {
  if (client) await client.close();
}

module.exports = { closeDatabase, connectDatabase, getCollection, getDb, isUsingMemory: () => usingMemory };
