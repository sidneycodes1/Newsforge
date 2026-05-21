import fs from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

const FLAG_PATH = path.join(process.cwd(), "data", "trigger.flag");

export async function POST() {
  fs.mkdirSync(path.dirname(FLAG_PATH), { recursive: true });
  fs.writeFileSync(FLAG_PATH, new Date().toISOString(), "utf8");

  return NextResponse.json({
    data: {
      triggered: true,
    },
    error: null,
  });
}
