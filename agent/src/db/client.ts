import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SCHEMA } from "./schema";

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

  try {
    await db.execute(`ALTER TABLE runs ADD COLUMN tokens_used INTEGER DEFAULT 0`);
  } catch (error) {
    if (!String(error).toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await db.execute(`ALTER TABLE runs ADD COLUMN token_breakdown TEXT`);
  } catch (error) {
    if (!String(error).toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }

  try {
    await db.execute(`ALTER TABLE outputs ADD COLUMN audio_text TEXT`);
  } catch (error) {
    if (!String(error).toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

export const dbReady = initSchema().catch(console.error);

export default db;
