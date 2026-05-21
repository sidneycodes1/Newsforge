import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

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

export default db;
