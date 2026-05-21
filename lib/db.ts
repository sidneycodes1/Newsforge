import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "./data/newsforge.db";

let db: any = null;

function getDb() {
  if (db) return db;

  try {
    const resolvedPath = path.resolve(DB_PATH);
    if (!fs.existsSync(resolvedPath)) {
      console.log("[db] SQLite file not found at", resolvedPath);
      return null;
    }

    const Database = require("better-sqlite3");
    db = new Database(resolvedPath, { readonly: true });
    return db;
  } catch (err: any) {
    console.log("[db] Failed to open database:", err.message);
    return null;
  }
}

export default getDb;
