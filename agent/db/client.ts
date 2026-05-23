import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { SCHEMA } from "./schema";

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/newsforge.db"
);

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.exec(SCHEMA);

export default db;
