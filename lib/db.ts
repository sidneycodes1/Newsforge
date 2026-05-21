import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH ||
  './data/newsforge.db';

export function getDb(): any {
  const resolvedPath = path.resolve(DB_PATH);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    // Use require inside function to prevent
    // Vercel from executing at build time
    // This require is wrapped so webpack cannot
    // statically analyze it
    const moduleName = 'better-sqlite3';
    // eslint-disable-next-line
    const Database = eval('require')(moduleName);
    return new Database(resolvedPath, { readonly: true });
  } catch {
    return null;
  }
}
