import { readFileSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    runId: string;
    file: string;
  };
};

const OUTPUTS_ROOT = path.resolve(process.cwd(), "outputs");

function getContentType(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case ".png":
      return "image/png";
    case ".mp3":
      return "audio/mpeg";
    case ".md":
      return "text/markdown; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { runId, file } = context.params;
    const filePath = path.resolve(OUTPUTS_ROOT, runId, file);

    if (!filePath.startsWith(OUTPUTS_ROOT + path.sep)) {
      return new NextResponse("Not found", { status: 404 });
    }

    const data = readFileSync(filePath);
    if (file === "cover.png") {
      const preview = data.toString("utf-8", 0, 10);
      const contentType = preview.trim().startsWith("<svg")
        ? "image/svg+xml"
        : "image/png";
      if (contentType === "image/svg+xml") {
        return new NextResponse(data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    return new NextResponse(data, {
      headers: {
        "Content-Type": getContentType(file),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
