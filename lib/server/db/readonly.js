"use strict";

const { existsSync } = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { createClient } = require("@libsql/client");

const databasePath = process.env.DATABASE_PATH || path.resolve(process.cwd(), "data", "newsforge.db");

function openReadOnlyDatabase() {
  if (!existsSync(databasePath)) {
    console.warn(`[db] SQLite file not found at ${databasePath}`);
    return null;
  }

  try {
    return createClient({
      url: `file:${databasePath}`,
    });
  } catch (error) {
    console.warn(`[db] Failed to open readonly database at ${databasePath}`, error);
    return null;
  }
}

const db = openReadOnlyDatabase();

module.exports = db;
module.exports.default = db;
