"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createClient } = require("@libsql/client");
const { SCHEMA } = require("./schema");

const DB_PATH = process.env.DATABASE_PATH || "./data/newsforge.db";
const resolvedPath = path.resolve(DB_PATH);

const dataDir = path.dirname(resolvedPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = createClient({
  url: pathToFileURL(resolvedPath).href,
});

async function initSchema() {
  const statements = SCHEMA.split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await db.execute(statement);
  }
}

const dbReady = initSchema().catch(console.error);

module.exports = db;
module.exports.default = db;
module.exports.dbReady = dbReady;
