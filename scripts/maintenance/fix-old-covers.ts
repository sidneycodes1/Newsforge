import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const OUTPUTS_DIR =
  process.env.OUTPUTS_DIR || './outputs';

function escapeXml(str: string): string {
  return str.replace(/[<>&"']/g, ' ');
}

function makeCleanSvg(title: string): string {
  const safeTitle = escapeXml(title.slice(0, 70));
  return `<svg width="1200" height="630"
    xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#0A0A0A"/>
    <rect x="40" y="40" width="1120" height="550"
      fill="#111111" rx="8"/>
    <text x="600" y="260" font-family="monospace"
      font-size="56" fill="#F5C518"
      text-anchor="middle" font-weight="bold">
      NEWSFORGE
    </text>
    <text x="600" y="340" font-family="monospace"
      font-size="22" fill="#333333"
      text-anchor="middle">AI Content Agent</text>
    <text x="600" y="400" font-family="sans-serif"
      font-size="18" fill="#555555"
      text-anchor="middle">${safeTitle}</text>
  </svg>`;
}

if (!fs.existsSync(OUTPUTS_DIR)) {
  console.log('No outputs directory found.');
  process.exit(0);
}

const dirs = fs.readdirSync(OUTPUTS_DIR)
  .filter(d => {
    try {
      return fs.statSync(
        path.join(OUTPUTS_DIR, d)).isDirectory();
    } catch { return false; }
  });

let fixed = 0;
let skipped = 0;

for (const dir of dirs) {
  const coverPath = path.join(
    OUTPUTS_DIR, dir, 'cover.png');
  if (!fs.existsSync(coverPath)) {
    skipped++;
    continue;
  }
  try {
    const content = fs.readFileSync(
      coverPath, 'utf-8');
    if (!content.includes('ACE image fallback')) {
      skipped++;
      continue;
    }
    // Get title from article.md
    let title = 'Solana Ecosystem Update';
    const articlePath = path.join(
      OUTPUTS_DIR, dir, 'article.md');
    if (fs.existsSync(articlePath)) {
      const md = fs.readFileSync(
        articlePath, 'utf-8');
      const firstLine = md
        .split('\n')[0]
        .replace(/^#+\s*/, '')
        .trim();
      if (firstLine.length > 5) title = firstLine;
    }
    const cleanSvg = makeCleanSvg(title);
    fs.writeFileSync(coverPath, cleanSvg, 'utf-8');
    console.log(`Fixed: ${dir.slice(0, 8)}...
      → ${title.slice(0, 50)}`);
    fixed++;
  } catch (e: any) {
    console.log(`Error on ${dir}: ${e.message}`);
  }
}

console.log(`\nDone. Fixed: ${fixed},
  Skipped: ${skipped}`);
