import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH ||
  './data/newsforge.db';

let _db: any = null;

export function getDb(): any {
  if (_db) return _db;

  const resolvedPath = path.resolve(DB_PATH);

  if (!fs.existsSync(resolvedPath)) {
    console.log('[db] SQLite file not found at',
      resolvedPath);
    return null;
  }

  try {
    const Database = require('better-sqlite3');
    _db = new Database(resolvedPath, { readonly: true });
    return _db;
  } catch (err: any) {
    console.log('[db] Failed to open:', err.message);
    return null;
  }
}
