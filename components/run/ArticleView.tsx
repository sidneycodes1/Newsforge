"use client";

import { useState } from "react";

function decodeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\u2014/g, '—')
    .replace(/\\u2013/g, '–')
    .replace(/\\u2019/g, "'")
    .replace(/\\u201c/g, '"')
    .replace(/\\u201d/g, '"')
    .replace(/\\n/g, '\n');
}

function getRunTitle(run: any, output: any) {
  const articleTitle =
    output?.article_title ?? output?.articleTitle ?? run?.articleTitle ?? run?.article_title ?? "";
  if (articleTitle) {
    return articleTitle;
  }

  const topic = run?.topic ?? "";
  const runNumber = run?.run_number ?? run?.runNumber ?? "";
  const fallback = topic ? `${topic} \u2014 Run #${runNumber}`.trim() : "";
  return fallback || "NewsForge Report";
}

function getArticleBody(output: any) {
  return typeof output?.article_body === "string" ? output.article_body : "";
}

export default function ArticleView({
  runId,
  run,
  output,
}: {
  runId: string;
  run: any;
  output: any;
}) {
  const [imageError, setImageError] = useState(false);

  const title = decodeText(getRunTitle(run, output));
  const articleBody = decodeText(getArticleBody(output));
  const hasContent = articleBody.trim().length > 50 && !articleBody.includes("autonomous agent report");

  return (
    <article>
      <h1 className="mb-4 text-[22px] font-bold text-[#F0F0F0] sm:text-[24px]">{title}</h1>

      <div className="mb-6 overflow-hidden rounded-[6px] border border-[#222222] bg-[#111111]">
        {!imageError ? (
          <img
            src={`/api/output/${runId}/cover.png`}
            alt={title}
            className="block h-auto w-full max-w-full rounded-[6px] bg-[#111111]"
            onError={(event) => {
              (event.currentTarget as HTMLImageElement).style.display = "none";
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex min-h-[200px] items-center justify-center text-[#666666]">
            <span className="text-[13px] uppercase tracking-[0.18em]">NEWSFORGE</span>
          </div>
        )}
      </div>

      {hasContent ? (
        <div className="max-w-none">
          {articleBody
            .split("\n\n")
            .map((para: string, index: number) =>
              para.trim() ? (
                <p key={index} className="mb-4 text-[15px] leading-relaxed text-[#F0F0F0]">
                  {para.trim()}
                </p>
              ) : null
            )}
        </div>
      ) : (
        <div className="rounded-[6px] border border-[#222222] p-4 text-sm italic text-[#666666]">
          Article content unavailable - agent used fallback data for this run. New runs will show
          real content once ACE API connection is verified.
        </div>
      )}
    </article>
  );
}
