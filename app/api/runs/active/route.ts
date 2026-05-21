import { NextResponse } from "next/server";

import db from "@/lib/db";

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        {
          data: null,
          error: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const run = db
      .prepare(
        `SELECT * FROM runs
         WHERE status = 'running'
         ORDER BY started_at DESC
         LIMIT 1`
      )
      .get();

    if (!run) {
      return NextResponse.json(
        {
          data: null,
          error: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const steps = db
      .prepare(
        `SELECT * FROM steps
         WHERE run_id = ?
         ORDER BY step_number`
      )
      .all((run as { id: string }).id);

    return NextResponse.json(
      {
        data: {
          run,
          steps,
        },
        error: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
