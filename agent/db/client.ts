import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SCHEMA } from "./schema";

const databasePath = path.resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? "./data/newsforge.db"
);

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(SCHEMA);

export default db;
