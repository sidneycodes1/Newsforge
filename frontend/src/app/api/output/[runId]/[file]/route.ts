import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { runId: string; file: string } }
) {
  const { runId, file } = params;

  // Sanitize inputs — prevent path traversal
  if (file.includes("..") || file.includes("/") || runId.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const outputsDir = process.env.OUTPUTS_DIR || "./outputs";

  const possiblePaths = [
    // Railway absolute path
    path.join("/app/outputs", runId, file),
    // Env var path (absolute or relative)
    path.resolve(outputsDir, runId, file),
    // Relative to cwd
    path.join(process.cwd(), "outputs", runId, file),
  ];

  let filePath: string | null = null;
  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      filePath = candidate;
      break;
    }
  }

  if (!filePath) {
    console.log("[output] File not found:", {
      runId,
      file,
      tried: possiblePaths,
    });
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const content = fs.readFileSync(filePath);

    // Detect content type
    let contentType = "application/octet-stream";
    if (file === "cover.png") {
      const preview = content.toString("utf-8", 0, 10);
      contentType = preview.trim().startsWith("<svg")
        ? "image/svg+xml"
        : "image/png";
    } else if (file === "audio.mp3") {
      contentType = "audio/mpeg";
    } else if (file === "article.md") {
      contentType = "text/markdown";
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[output] Read error:", err.message);
    return new NextResponse("Error", { status: 500 });
  }
}
