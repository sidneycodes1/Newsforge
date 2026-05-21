"use strict";

const { existsSync } = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/newsforge.db"
);

function openReadOnlyDatabase() {
  if (!existsSync(databasePath)) {
    console.warn(`[db] SQLite file not found at ${databasePath}`);
    return null;
  }

  try {
    return new DatabaseSync(databasePath, { readOnly: true });
  } catch (error) {
    console.warn(`[db] Failed to open readonly database at ${databasePath}`, error);
    return null;
  }
}

const db = openReadOnlyDatabase();

module.exports = db;
module.exports.default = db;
