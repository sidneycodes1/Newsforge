import { NextResponse } from "next/server";

import getDb from "@/lib/db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json(
        {
          data: null,
          error: "Not found",
        },
        { status: 404 }
      );
    }

    const { id } = context.params;

    const run = db.prepare(`SELECT * FROM runs WHERE id = ? LIMIT 1`).get(id);
    if (!run) {
      return NextResponse.json(
        {
          data: null,
          error: "Not found",
        },
        { status: 404 }
      );
    }

    const steps = db
      .prepare(
        `SELECT * FROM steps
         WHERE run_id = ?
         ORDER BY step_number`
      )
      .all(id);

    const output = db
      .prepare(`SELECT * FROM outputs WHERE run_id = ? LIMIT 1`)
      .get(id);

    return NextResponse.json({
      data: {
        run,
        steps,
        output: output ?? null,
      },
      error: null,
    });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: "Not found",
      },
      { status: 404 }
    );
  }
}
