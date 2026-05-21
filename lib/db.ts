import path from 'path';
import fs from 'fs';

export function getDb(): any {
  const dbPath = process.env.DATABASE_PATH ||
    './data/newsforge.db';
  const resolvedPath = path.resolve(dbPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    return new Database(resolvedPath, { readonly: true });
  } catch {
    return null;
  }
}
