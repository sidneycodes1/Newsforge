"use strict";

const { mkdirSync } = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { SCHEMA } = require("./schema");

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/newsforge.db"
);

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.exec(SCHEMA);

module.exports = db;
module.exports.default = db;
