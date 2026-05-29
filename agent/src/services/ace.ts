import axios, { type AxiosResponse } from "axios";
import fs from "fs";
import path from "path";

const TOKEN = process.env.ACE_PLATFORM_TOKEN || "";
const OUTPUTS_DIR = process.env.OUTPUTS_DIR || "./outputs";
const BASE_URL = "https://api.acedata.cloud";

type NewsResultItem = {
  title?: string;
  headline?: string;
  snippet?: string;
  description?: string;
  link?: string;
  url?: string;
  source?: string;
};

type RequestAttempt = {
  method: "get" | "post";
  url: string;
  data?: unknown;
  params?: Record<string, unknown>;
  responseType?: "json" | "arraybuffer";
};

function authHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
  };
}

function ensureRunDir(runId: string) {
  const dir = path.join(OUTPUTS_DIR, runId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function freeTxHash() {
  return `free-credit-${Date.now()}`;
}

function logAceStart(functionName: string) {
  console.log(`[ACE] Calling ${functionName}...`);
  console.log(`[ACE] Token: ${TOKEN ? "set" : "MISSING"}`);
}

function logAceAttempt(url: string) {
  console.log(`[ACE] URL: ${url}`);
}

function logAceSuccess(functionName: string, response: AxiosResponse<unknown>) {
  console.log(`[ACE] ${functionName} response status:`, response.status);
  console.log(
    `[ACE] ${functionName} response keys:`,
    Object.keys((response.data as Record<string, unknown>) || {})
  );
}

function logAceFailure(functionName: string, url: string, error: unknown) {
  const status = axios.isAxiosError(error) ? error.response?.status : null;
  console.log(
    `[ACE] ${functionName} failed${status ? ` (${status})` : ""}:`,
    url,
    axios.isAxiosError(error) ? error.message : error
  );
}

async function requestAttempt<T>(
  functionName: string,
  attempt: RequestAttempt
): Promise<AxiosResponse<T> | null> {
  logAceAttempt(attempt.url);

  try {
    const response = await axios.request<T>({
      method: attempt.method,
      url: attempt.url,
      data: attempt.data,
      params: attempt.params,
      responseType: attempt.responseType,
      timeout: 30000,
      headers: {
        ...authHeaders(),
        Accept: attempt.responseType === "arraybuffer" ? "*/*" : "application/json",
        ...(attempt.method === "post" ? { "Content-Type": "application/json" } : {}),
      },
    });

    logAceSuccess(functionName, response as AxiosResponse<unknown>);
    return response;
  } catch (error) {
    logAceFailure(functionName, attempt.url, error);
    return null;
  }
}

async function writeBinaryToFile(url: string, filePath: string) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  fs.writeFileSync(filePath, Buffer.from(response.data));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function unwrapData(input: unknown): Record<string, unknown> {
  const record = asRecord(input);
  if (!record) {
    return {};
  }

  if (record.data && typeof record.data === "object") {
    return asRecord(record.data) ?? {};
  }

  if (record.result && typeof record.result === "object") {
    return asRecord(record.result) ?? {};
  }

  return record;
}

function collectItems(input: unknown): NewsResultItem[] {
  const data = unwrapData(input);
  const candidateCollections = [
    data.data,
    data.organic_results,
    data.organicResults,
    data.organic,
    data.results,
    data.items,
    data.news,
    data.articles,
  ];

  for (const collection of candidateCollections) {
    if (Array.isArray(collection)) {
      return collection as NewsResultItem[];
    }
  }

  return [];
}

function parseNewsResponse(input: unknown) {
  const items = collectItems(input);
  return {
    headlines: items.map((item) => item.title || item.headline || "").filter(Boolean),
    snippets: items.map((item) => item.snippet || item.description || "").filter(Boolean),
    sources: items.map((item) => item.link || item.url || item.source || "").filter(Boolean),
  };
}

function extractChatContent(input: unknown) {
  const data = unwrapData(input);
  const choices = Array.isArray(data.choices) ? data.choices : [];

  if (choices.length > 0) {
    const first = asRecord(choices[0]);
    const message = first ? asRecord(first.message) : null;
    const content =
      (message && typeof message.content === "string" && message.content) ||
      (first && typeof first.content === "string" && first.content) ||
      (first && typeof first.text === "string" && first.text) ||
      "";

    if (content) {
      return content;
    }
  }

  if (typeof data.content === "string") {
    return data.content;
  }

  if (Array.isArray(data.content)) {
    const text = data.content
      .map((part) => {
        const partRecord = asRecord(part);
        if (!partRecord) {
          return "";
        }

        if (typeof partRecord.text === "string") {
          return partRecord.text;
        }

        if (
          typeof partRecord.type === "string" &&
          partRecord.type === "text" &&
          typeof partRecord.content === "string"
        ) {
          return partRecord.content;
        }

        return "";
      })
      .filter(Boolean)
      .join("\n")
      .trim();

    if (text) {
      return text;
    }
  }

  if (typeof data.text === "string") {
    return data.text;
  }

  if (typeof data.message === "object" && data.message) {
    const message = asRecord(data.message);
    if (message && typeof message.content === "string") {
      return message.content;
    }
  }

  return "";
}

function splitArticleContent(content: string, topic: string) {
  const cleaned = content.trim();

  let title = "";
  let body = cleaned;

  if (cleaned.includes("TITLE:")) {
    const parts = cleaned.split("TITLE:");
    const afterTitle = (parts[1] || "").trim();
    const firstNewline = afterTitle.indexOf("\n");
    if (firstNewline > -1) {
      title = afterTitle.substring(0, firstNewline).trim();
      body = afterTitle.substring(firstNewline).trim();
    } else {
      title = afterTitle.trim();
      body = "";
    }
  } else {
    const lines = cleaned
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    title = lines[0] || "NewsForge Report";
    body = lines.slice(1).join("\n\n").trim();
  }

  title = title.replace(/^#+\s*/, "").trim();
  if (!title) {
    title = `${topic} Report — ${new Date().toLocaleDateString()}`;
  }

  return {
    title,
    body: body || "",
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function extractImageUrl(input: unknown) {
  const data = unwrapData(input);
  return (
    (Array.isArray(data.data) && data.data[0] && asRecord(data.data[0])?.url) ||
    (Array.isArray(data.data) && data.data[0] && asRecord(data.data[0])?.b64_json) ||
    (Array.isArray(data.data) && data.data[0] && asRecord(data.data[0])?.image_url) ||
    (typeof data.url === "string" && data.url) ||
    (typeof data.image_url === "string" && data.image_url) ||
    (typeof data.b64_json === "string" && data.b64_json) ||
    null
  );
}

function getBinarySize(data: unknown) {
  if (Buffer.isBuffer(data)) {
    return data.length;
  }

  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }

  if (ArrayBuffer.isView(data)) {
    return data.byteLength;
  }

  return 0;
}

export async function fetchNews(
  topic: string,
  runId: string
): Promise<{
  headlines: string[];
  snippets: string[];
  sources: string[];
  txHash: string;
  costUsdc: number;
}> {
  console.log("[ACE] Calling fetchNews...");
  console.log("[ACE] Token:", TOKEN ? "set" : "MISSING");

  const serpUrls = [
    "https://api.acedata.cloud/serp/google",
    "https://api.acedata.cloud/serp/google/search",
  ];

  for (const url of serpUrls) {
    try {
      console.log("[ACE] URL:", url);
      const res = await axios.post(
        url,
        {
          query: `${topic} latest news`,
          num: 5,
          gl: "us",
          hl: "en",
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );
      console.log("[ACE] fetchNews response status:", res.status);
      console.log("[ACE] fetchNews response keys:", Object.keys(res.data || {}));

      const items =
        (res.data as any)?.data?.organic_results ||
        (res.data as any)?.organic_results ||
        (res.data as any)?.results ||
        (res.data as any)?.data ||
        [];

      if (Array.isArray(items) && items.length > 0) {
        return {
          headlines: items.map((r: any) => r.title || r.headline || ""),
          snippets: items.map((r: any) => r.snippet || r.description || ""),
          sources: items.map((r: any) => r.link || r.url || ""),
          txHash: "free-credit-" + Date.now(),
          costUsdc: 0,
        };
      }

      console.log("[ACE] fetchNews: empty results from", url);
    } catch (e: any) {
      console.log("[ACE] fetchNews failed:", url, e.response?.status || e.message);
      if (e.response?.data) {
        console.log(
          "[ACE] fetchNews error body:",
          JSON.stringify(e.response.data).slice(0, 200)
        );
      }
    }
  }

  console.log("[ACE] fetchNews: using fallback headlines");
  return {
    headlines: [
      `Latest developments in ${topic}`,
      `${topic} ecosystem growth continues`,
      `New updates in ${topic} space`,
    ],
    snippets: [
      `The ${topic} space continues to evolve rapidly.`,
      `Developers and investors are closely watching ${topic}.`,
      `Innovation in ${topic} reaches new milestones.`,
    ],
    sources: [],
    txHash: "free-credit-" + Date.now(),
    costUsdc: 0,
  };
}

export async function writeArticle(
  topic: string,
  newsData: {
    headlines: string[];
    snippets: string[];
  },
  runId: string
): Promise<{
  title: string;
  body: string;
  filePath: string;
  txHash: string;
  costUsdc: number;
}> {
  logAceStart("writeArticle");

  const dir = ensureRunDir(runId);
  const filePath = path.join(dir, "article.md");
  const prompt = `Write a 400-word news article about "${topic}". Use these headlines as context: ${newsData.headlines
    .slice(0, 3)
    .join(". ")}.

Format EXACTLY like this:
TITLE: [your title here]

[article paragraph 1]

[article paragraph 2]

[article paragraph 3]

[article paragraph 4]`;

  const response = await requestAttempt<unknown>("writeArticle", {
    method: "post",
    url: `${BASE_URL}/v1/chat/completions`,
    data: {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    },
  });

  const fallbackTitle = `${topic} Report`;
  const fallbackBody = `Article content unavailable for ${topic} while ACE chat output is being verified.`;

  try {
    const content = extractChatContent(response?.data) || `TITLE: ${fallbackTitle}\n\n${fallbackBody}`;
    const { title, body } = splitArticleContent(content, topic);
    const finalBody = body || fallbackBody;

    fs.writeFileSync(filePath, `# ${title}\n\n${finalBody}`, "utf-8");

    return {
      title,
      body: finalBody,
      filePath,
      txHash: freeTxHash(),
      costUsdc: 0,
    };
  } catch (error) {
    console.error("[ACE] writeArticle failed:", error);
    fs.writeFileSync(filePath, `# ${fallbackTitle}\n\n${fallbackBody}`, "utf-8");
    return {
      title: fallbackTitle,
      body: fallbackBody,
      filePath,
      txHash: freeTxHash(),
      costUsdc: 0,
    };
  }
}

export async function generateImage(
  title: string,
  runId: string
): Promise<{
  filePath: string;
  txHash: string;
  costUsdc: number;
}> {
  const dir = path.join(OUTPUTS_DIR, runId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "cover.png");

  console.log("[ACE] Calling generateImage...");
  console.log("[ACE] Token:", TOKEN ? "set" : "MISSING");

  const prompt = `Professional editorial news cover image,
    clean modern design, topic: ${title.slice(0, 150)}`;

  const ATTEMPTS = [
    {
      url: "https://api.acedata.cloud/openai/images/generations",
      body: {
        prompt,
        model: "dall-e-3",
        n: 1,
      },
      parseUrl: (data: any) => data?.data?.[0]?.url || null,
    },
    {
      url: "https://api.acedata.cloud/flux/images",
      body: {
        action: "generate",
        prompt,
        model: "flux-schnell",
      },
      parseUrl: (data: any) =>
        data?.data?.[0]?.image_url || data?.data?.[0]?.url || data?.image_url || null,
    },
  ];

  const safeTitle = (title || "").slice(0, 70).replace(/[<>&"']/g, " ");
  const fallbackSvg = (() => {
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
  })();

  for (const attempt of ATTEMPTS) {
    try {
      console.log("[ACE] URL:", attempt.url);
      const res = await axios.post(attempt.url, attempt.body, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      });
      console.log("[ACE] generateImage response status:", res.status);
      console.log("[ACE] generateImage response data:", JSON.stringify(res.data).slice(0, 300));
      console.log("[ACE] generateImage response keys:", Object.keys(res.data || {}));

      const imageUrl = attempt.parseUrl(res.data);
      if (!imageUrl) {
        continue;
      }

      try {
        const imgRes = await axios.get(imageUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        fs.writeFileSync(filePath, Buffer.from(imgRes.data));
        console.log("[ACE] generateImage: saved real image");
        return {
          filePath,
          txHash: "free-credit-" + Date.now(),
          costUsdc: 0,
        };
      } catch (downloadErr: any) {
        console.log(
          "[ACE] generateImage download failed:",
          downloadErr.response?.status || downloadErr.message
        );
      }
    } catch (e: any) {
      console.log("[ACE] generateImage failed:", attempt.url, e.response?.status || e.message);
      if (e.response?.data) {
        console.log(
          "[ACE] generateImage error body:",
          JSON.stringify(e.response.data).slice(0, 300)
        );
      }
    }
  }

  fs.writeFileSync(filePath, fallbackSvg, "utf-8");
  console.log("[ACE] generateImage: using dark SVG placeholder");
  return {
    filePath,
    txHash: "free-credit-" + Date.now(),
    costUsdc: 0,
  };
}

export async function generateAudio(
  articleBody: string,
  runId: string
): Promise<{
  filePath: string;
  txHash: string;
  costUsdc: number;
}> {
  const dir = path.join(OUTPUTS_DIR, runId);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "audio.mp3");

  console.log("[ACE] Calling generateAudio...");
  console.log("[ACE] Token:", TOKEN ? "set" : "MISSING");

  const summary = articleBody
    .split(" ")
    .slice(0, 100)
    .join(" ")
    .trim()
    .slice(0, 200);

  try {
    console.log("[ACE] Trying Fish TTS...");
    const fishRes = await axios.post(
      "https://api.acedata.cloud/fish/audios",
      {
        action: "generate",
        text: summary,
        reference_id: "54a5170264694bfc8e9ad98df7cache",
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    console.log("[ACE] Fish TTS status:", fishRes.status);
    console.log("[ACE] Fish TTS data:", JSON.stringify(fishRes.data).slice(0, 300));

    const audioUrl =
      (fishRes.data as any)?.data?.[0]?.audio_url ||
      (fishRes.data as any)?.audio_url ||
      (fishRes.data as any)?.url ||
      null;

    if (audioUrl) {
      const audioRes = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      if (audioRes.data.byteLength > 500) {
        fs.writeFileSync(filePath, Buffer.from(audioRes.data));
        console.log("[ACE] Fish TTS: audio saved");
        return {
          filePath,
          txHash: "free-credit-" + Date.now(),
          costUsdc: 0,
        };
      }
    }

    const taskId = (fishRes.data as any)?.task_id || (fishRes.data as any)?.data?.[0]?.id;
    if (taskId) {
      for (let i = 0; i < 12; i++) {
        console.log("[ACE] Fish poll attempt", i + 1, "taskId:", taskId);
        await new Promise((r) => setTimeout(r, 3000));
        const poll = await axios.get("https://api.acedata.cloud/fish/audios", {
          params: { task_id: taskId },
          headers: { Authorization: `Bearer ${TOKEN}` },
          timeout: 10000,
        });
        console.log(
          "[ACE] Fish poll response:",
          JSON.stringify(poll.data).slice(0, 200)
        );
        const state = (poll.data as any)?.data?.[0]?.state || (poll.data as any)?.state;
        const url = (poll.data as any)?.data?.[0]?.audio_url || (poll.data as any)?.audio_url;
        console.log("[ACE] Fish poll:", state, url);
        if (url && (state === "succeeded" || state === "complete")) {
          const audioRes = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
          });
          if (audioRes.data.byteLength > 500) {
            fs.writeFileSync(filePath, Buffer.from(audioRes.data));
            return {
              filePath,
              txHash: "free-credit-" + Date.now(),
              costUsdc: 0,
            };
          }
        }
        if (state === "failed") break;
      }
    }
  } catch (fishErr: any) {
    console.log("[ACE] Fish TTS failed:", fishErr.response?.status || fishErr.message);
    if (fishErr.response?.data) {
      console.log("[ACE] Fish error:", JSON.stringify(fishErr.response.data).slice(0, 200));
    }
  }

  const sunoUrls = ["https://api.acedata.cloud/suno/audios"];

  for (const url of sunoUrls) {
    try {
      console.log("[ACE] URL:", url);
      const res = await axios.post(
        url,
        {
          action: "generate",
          prompt: `Background news music inspired by: ${summary}`,
          model: "chirp-v3-5",
          instrumental: true,
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );
      console.log("[ACE] generateAudio response status:", res.status);

      const taskId = (res.data as any)?.task_id || (res.data as any)?.data?.[0]?.id || null;

      if (!taskId) {
        const audioUrl =
          (res.data as any)?.data?.[0]?.audio_url || (res.data as any)?.audio_url || null;

        if (audioUrl) {
          const audioRes = await axios.get(audioUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
          });
          fs.writeFileSync(filePath, Buffer.from(audioRes.data));
          console.log("[ACE] generateAudio: saved audio");
          return {
            filePath,
            txHash: "free-credit-" + Date.now(),
            costUsdc: 0,
          };
        }
        continue;
      }

      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 10000));
        try {
          const pollRes = await axios.get(`https://api.acedata.cloud/suno/audios/${taskId}`, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
            timeout: 10000,
          });
          const state = (pollRes.data as any)?.data?.[0]?.state || (pollRes.data as any)?.state;

          if (state === "succeeded" || state === "complete") {
            const audioUrl =
              (pollRes.data as any)?.data?.[0]?.audio_url || (pollRes.data as any)?.audio_url;
            if (audioUrl) {
              const audioRes = await axios.get(audioUrl, {
                responseType: "arraybuffer",
                timeout: 30000,
              });
              fs.writeFileSync(filePath, Buffer.from(audioRes.data));
              console.log("[ACE] generateAudio: Suno complete");
              return {
                filePath,
                txHash: "free-credit-" + Date.now(),
                costUsdc: 0,
              };
            }
          }
          if (state === "failed") break;
        } catch (pollErr: any) {
          console.log("[ACE] Suno poll error:", pollErr.message);
        }
      }
    } catch (e: any) {
      console.log("[ACE] generateAudio Suno failed:", url, e.response?.status || e.message);
      if (e.response?.data) {
        console.log("[ACE] Suno error body:", JSON.stringify(e.response.data).slice(0, 300));
      }
    }
  }

  console.log("[ACE] generateAudio: all attempts failed");
  return {
    filePath: "",
    txHash: "audio-skipped-" + Date.now(),
    costUsdc: 0,
  };
}
