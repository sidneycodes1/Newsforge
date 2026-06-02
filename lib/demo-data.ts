import type { RunRecord, RunStep, RunStatus } from "@shared/types";
import { truncateMiddle } from "@shared/utils/format";

const now = Date.now();
const MINUTE = 60_000;

const visibleStepTemplates = [
  {
    stepName: "Fetch News",
    apiUsed: "ACE Search API",
    costUsdc: 0.0012,
    durationMs: 4200,
    detail: "Collected live Solana headlines and snippets from the news index.",
  },
  {
    stepName: "Write Article",
    apiUsed: "ACE Chat API",
    costUsdc: 0.0011,
    durationMs: 11400,
    detail: "Composed a 400-word article using the gathered news context.",
  },
  {
    stepName: "Generate Image",
    apiUsed: "ACE Flux API",
    costUsdc: 0.0009,
    durationMs: 7700,
    detail: "Rendered a flat editorial cover image for the story.",
  },
  {
    stepName: "Generate Audio",
    apiUsed: "ACE TTS API",
    costUsdc: 0.0008,
    durationMs: 6500,
    detail: "Generated an audio summary from the first section of the article.",
  },
];

const sentinelTemplate = {
  stepName: "Call Sentinel",
  apiUsed: "Synapse Sentinel",
  costUsdc: 0,
  durationMs: 3400,
  detail: "Validated the run against the Synapse Sentinel agent.",
};

function statusFromElapsed(
  startedAt: number,
  elapsedMs: number,
  durations: number[],
  index: number
): "pending" | "running" | "complete" | "failed" {
  const previousDuration = durations.slice(0, index).reduce((sum, value) => sum + value, 0);
  const currentDuration = durations[index];
  if (elapsedMs < previousDuration) return "pending";
  if (elapsedMs >= previousDuration && elapsedMs < previousDuration + currentDuration) return "running";
  return "complete";
}

function buildStep(
  runId: string,
  stepNumber: number,
  status: "pending" | "running" | "complete" | "failed",
  template: typeof visibleStepTemplates[number],
  completedAtBase: number,
  txSeed: string
): RunStep {
  const startedAt = new Date(completedAtBase - template.durationMs).toISOString();
  return {
    id: `${runId}-step-${stepNumber}`,
    stepNumber,
    stepName: template.stepName,
    apiUsed: template.apiUsed,
    status,
    costUsdc: status === "pending" ? 0 : template.costUsdc,
    txHash: `${txSeed}${String(stepNumber).padStart(2, "0")}a9c1${runId.slice(-4)}`,
    durationMs: template.durationMs,
    outputRef: `/outputs/${runId}/${stepNumber === 1 ? "sources.json" : stepNumber === 2 ? "article.md" : stepNumber === 3 ? "cover.png" : "audio.mp3"}`,
    startedAt,
    completedAt: status === "complete" ? new Date(completedAtBase).toISOString() : status === "running" ? undefined : undefined,
    detail: template.detail,
  };
}

function createCoverArt(title: string, accent: string, subtitle: string) {
  const safeTitle = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeSubtitle = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#111111"/>
      <rect x="54" y="54" width="1092" height="522" fill="#0A0A0A" stroke="#2A2A2A" stroke-width="2"/>
      <rect x="82" y="82" width="176" height="20" fill="${accent}"/>
      <rect x="82" y="124" width="320" height="8" fill="#303030"/>
      <rect x="82" y="146" width="280" height="8" fill="#262626"/>
      <rect x="82" y="168" width="240" height="8" fill="#262626"/>
      <text x="82" y="308" font-family="IBM Plex Mono, monospace" font-size="46" fill="#F0F0F0" font-weight="700">${safeTitle}</text>
      <text x="82" y="360" font-family="Inter, sans-serif" font-size="22" fill="#8A8A8A">${safeSubtitle}</text>
      <rect x="82" y="434" width="520" height="2" fill="#2A2A2A"/>
      <rect x="82" y="470" width="190" height="36" fill="${accent}" opacity="0.95"/>
      <text x="112" y="495" font-family="IBM Plex Mono, monospace" font-size="16" fill="#000000" font-weight="700">NEWSFORGE</text>
      <g transform="translate(716 136)">
        <rect x="0" y="0" width="330" height="330" fill="#0D0D0D" stroke="#2A2A2A" stroke-width="2"/>
        <rect x="24" y="24" width="282" height="282" fill="none" stroke="#1D1D1D" stroke-width="1"/>
        <circle cx="165" cy="165" r="96" fill="none" stroke="${accent}" stroke-width="6"/>
        <circle cx="165" cy="165" r="56" fill="none" stroke="#4A4A4A" stroke-width="2"/>
        <path d="M42 254 L114 184 L160 220 L216 144 L288 88" fill="none" stroke="#2A2A2A" stroke-width="3"/>
        <path d="M42 120 L108 120 L136 86 L190 86 L226 122 L288 122" fill="none" stroke="#262626" stroke-width="3"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createRun(
  overrides: Partial<RunRecord> & { id: string; runNumber: number; topic: string; status: RunStatus }
): RunRecord {
  const title = overrides.articleTitle ?? `${overrides.topic} Briefing`;
  const accent = overrides.status === "failed" ? "#EF4444" : "#F5C518";
  const coverImage = overrides.coverImage ?? createCoverArt(title, accent, `${overrides.topic} editorial cover`);
  const articleBody =
    overrides.articleBody ?? [
      `NewsForge scanned live coverage around ${overrides.topic} and distilled the signal into a tight editorial brief.`,
      "The piece keeps the monitoring-first tone of the product while remaining readable enough for a quick executive skim.",
      "Every generated artifact is tracked in the run log so the full pipeline stays auditable from source discovery to delivery.",
    ];
  const steps = overrides.steps ?? [];

  return {
    id: overrides.id,
    runNumber: overrides.runNumber,
    topic: overrides.topic,
    status: overrides.status,
    startedAt: overrides.startedAt ?? new Date(now - 12 * MINUTE).toISOString(),
    completedAt: overrides.completedAt ?? null,
    totalCostUsdc: overrides.totalCostUsdc ?? 0.0041,
    totalCostSol: overrides.totalCostSol ?? 0.0003,
    articleTitle: title,
    articleBody,
    coverImage,
    audioUrl: overrides.audioUrl ?? `/outputs/${overrides.id}/audio.mp3`,
    txHash: overrides.txHash ?? `0x${overrides.id.replace(/[^a-z0-9]/gi, "").padEnd(64, "7")}`,
    newsSources:
      overrides.newsSources ?? [
        "CoinDesk",
        "The Block",
        "Solana Foundation Blog",
        "Helius Research",
      ],
    steps,
  };
}

const completedRunSeeds = [
  {
    id: "run-13",
    runNumber: 13,
    topic: "Solana Ecosystem",
    status: "complete" as const,
    completedAt: new Date(now - 18 * MINUTE).toISOString(),
    startedAt: new Date(now - 28 * MINUTE).toISOString(),
    totalCostUsdc: 0.0041,
    totalCostSol: 0.00028,
    articleTitle: "Solana's DeFi Surge Reaches New Heights",
    txHash: "0x3a7f9b90c91b2ea9f1c0b2c75d67f5a9d4e1f0134a6f7a9c6c00b1c0d1e2f301",
    articleBody: [
      "Solana continues to attract liquidity as traders rotate into faster settlement rails and cleaner UX.",
      "The latest wave of activity shows the chain's tooling stack maturing around better data access, indexing, and execution quality.",
      "NewsForge distilled the coverage into a concise report with the same monitoring discipline used across every automated run.",
    ],
  },
  {
    id: "run-12",
    runNumber: 12,
    topic: "Base Payments",
    status: "complete" as const,
    completedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 5 * 60 * 60 * 1000 - 14 * MINUTE).toISOString(),
    totalCostUsdc: 0.0040,
    totalCostSol: 0.00027,
    articleTitle: "Base Mainnet Volume Continues to Expand",
    txHash: "0x5d2cc1x9b2b4f75d4d2c1e1a9c7d6a4e1f0d3c2b1a9e8f7d6c5b4a3928171615",
    articleBody: [
      "The Base ecosystem remains a primary venue for payment-heavy workflows, especially where x402 settlement paths can be exercised repeatedly.",
      "NewsForge uses that rail for every ACE step so each run leaves a measurable trail on-chain.",
      "The output here is intentionally terse and operational rather than editorially decorative.",
    ],
  },
  {
    id: "run-11",
    runNumber: 11,
    topic: "AI Agents",
    status: "failed" as const,
    completedAt: new Date(now - 9 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 9 * 60 * 60 * 1000 - 10 * MINUTE).toISOString(),
    totalCostUsdc: 0.0019,
    totalCostSol: 0.00018,
    articleTitle: "Autonomous Agents Are Becoming Operational Systems",
    txHash: "0x2f8ab0cb17f6c7ab1c18e92c48d1ef2a7cdbbe8c0b7f1d1f0e9c8d7b6a5f4e3",
    articleBody: [
      "A failed run is still valuable because it proves the system can log, surface, and recover from downstream errors.",
      "The monitoring view keeps the failure visible without blocking the next scheduled cycle.",
      "Judges can inspect the exact step where the run stalled and compare it against successful volume-producing runs.",
    ],
  },
  {
    id: "run-10",
    runNumber: 10,
    topic: "Restaking",
    status: "complete" as const,
    completedAt: new Date(now - 16 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 16 * 60 * 60 * 1000 - 13 * MINUTE).toISOString(),
    totalCostUsdc: 0.0042,
    totalCostSol: 0.00026,
    articleTitle: "Restaking Narratives Keep Pulling Attention",
    txHash: "0x7c10f2a80b9dcb7a6f4e3d2c1b0a99887766554433221100ffeeddccbbaa9988",
    articleBody: [
      "Restaking remains one of the most persistent themes in on-chain infrastructure coverage.",
      "The article version generated by NewsForge keeps the tone factual and operational, optimized for rapid ingestion.",
      "Every artifact lands in outputs/ so the pipeline remains easy to audit after the fact.",
    ],
  },
  {
    id: "run-9",
    runNumber: 9,
    topic: "DeFi Tooling",
    status: "complete" as const,
    completedAt: new Date(now - 22 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 22 * 60 * 60 * 1000 - 12 * MINUTE).toISOString(),
    totalCostUsdc: 0.0037,
    totalCostSol: 0.00025,
    articleTitle: "DeFi Tooling Gets Less Friction, More Throughput",
    txHash: "0x9e38ab17ac1a4b2c5d6e7f8a9b0c1d2e3f405162738495a6b7c8d9e0f1029384",
    articleBody: [
      "Better tooling often matters more than a new narrative cycle because it changes what can be repeated reliably.",
      "NewsForge is designed to be repetitive by default, which makes it a strong fit for bounty-style evaluation.",
      "The run demonstrates how steady scheduled work can create visible volume over time.",
    ],
  },
  {
    id: "run-8",
    runNumber: 8,
    topic: "Mobile Infra",
    status: "complete" as const,
    completedAt: new Date(now - 28 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date(now - 28 * 60 * 60 * 1000 - 15 * MINUTE).toISOString(),
    totalCostUsdc: 0.0043,
    totalCostSol: 0.00031,
    articleTitle: "Mobile Infra Is Quietly Pulling Developer Attention",
    txHash: "0x6b7e4c92a1d0f2e3b4c5d6a7f80918273645566778899aabbccddeeff0011223",
    articleBody: [
      "Infrastructure stories about mobile execution and agent access tend to compound because they tie into product utility.",
      "This generated piece is intentionally short, structured, and easy to compare against the provenance stored in the log.",
      "That provenance is the whole point of the dashboard: watch, inspect, and verify.",
    ],
  },
];

function buildStepSet(runId: string, startedAt: number, status: RunStatus, txSeed: string) {
  const durations = visibleStepTemplates.map((step) => step.durationMs);
  const elapsed = Math.max(0, Date.now() - startedAt);
  const runningIndex = status === "running"
    ? visibleStepTemplates.findIndex((_, index) => statusFromElapsed(startedAt, elapsed, durations, index) === "running")
    : -1;

  return visibleStepTemplates.map((template, index) => {
    const computedStatus: "pending" | "running" | "complete" | "failed" =
      status === "complete"
        ? "complete"
        : status === "failed" && index < 1
          ? "complete"
          : status === "failed" && index === 1
            ? "failed"
            : statusFromElapsed(startedAt, elapsed, durations, index);
    return buildStep(runId, index + 1, computedStatus, template, startedAt + durations[index], txSeed);
  });
}

function buildSentinelStep(runId: string, status: RunStatus) {
  return {
    id: `${runId}-step-5`,
    stepNumber: 5,
    stepName: sentinelTemplate.stepName,
    apiUsed: sentinelTemplate.apiUsed,
    status: status === "complete" ? ("complete" as const) : status === "failed" ? ("failed" as const) : ("pending" as const),
    costUsdc: 0,
    txHash: `sap-${runId}-${truncateMiddle("Ccr2yK3hLALU4p8oNRqrh4dGuvPJTth5KCLMio8cE1ph", 8, 6)}`,
    durationMs: sentinelTemplate.durationMs,
    outputRef: `synapse://sentinel/${runId}`,
    startedAt: undefined,
    completedAt: status === "complete" ? new Date(now).toISOString() : undefined,
    detail: sentinelTemplate.detail,
  };
}

function materializeRun(seed: (typeof completedRunSeeds)[number]): RunRecord {
  const steps = buildStepSet(seed.id, new Date(seed.startedAt).getTime(), seed.status, seed.txHash);
  const sentinel = buildSentinelStep(seed.id, seed.status);
  return createRun({
    ...seed,
    steps: [...steps, sentinel],
  });
}

export const completedRuns: RunRecord[] = completedRunSeeds.map(materializeRun);

const activeRunStart = Date.now() - 132_000;
const activeRunBase = {
  id: "run-14",
  runNumber: 14,
  topic: "Solana Ecosystem",
  startedAt: new Date(activeRunStart).toISOString(),
  txHash: "0x4x98b2f7a0c1d2e3f4b5a6978877665544332211aabbccddeeff009988776655",
};

export function getActiveRun(nowMs = Date.now()): RunRecord | null {
  const durations = visibleStepTemplates.map((step) => step.durationMs);
  const totalDuration = durations.reduce((sum, value) => sum + value, 0);
  const elapsed = nowMs - activeRunStart;

  if (elapsed >= totalDuration) {
    return null;
  }

  const steps = visibleStepTemplates.map((template, index) => {
    const currentStatus =
      elapsed >= durations.slice(0, index).reduce((sum, value) => sum + value, 0) + template.durationMs
        ? "complete"
        : elapsed >= durations.slice(0, index).reduce((sum, value) => sum + value, 0)
          ? "running"
          : "pending";

    return buildStep(
      activeRunBase.id,
      index + 1,
      currentStatus as "pending" | "running" | "complete",
      template,
      activeRunStart + durations.slice(0, index + 1).reduce((sum, value) => sum + value, 0),
      activeRunBase.txHash
    );
  });

  const runningCost = steps.reduce((sum, step) => sum + step.costUsdc, 0);
  const articleTitle = "Solana's DeFi Surge Reaches New Heights";
  const articleBody = [
    "Solana continues to drive the loudest discussion in the current market cycle as infrastructure and user activity converge.",
    "NewsForge packages the signal into a clean, sequential run so the bounty judges can inspect every paid step.",
    "The monitoring view is intentionally flat and technical, mirroring the way the agent itself works.",
  ];

  return createRun({
    ...activeRunBase,
    status: "running",
    completedAt: null,
    totalCostUsdc: Number(runningCost.toFixed(4)),
    totalCostSol: 0.0003,
    articleTitle,
    articleBody,
    coverImage: createCoverArt(articleTitle, "#F5C518", "Solana ecosystem editorial cover"),
    audioUrl: `/outputs/${activeRunBase.id}/audio.mp3`,
    steps: [...steps, buildSentinelStep(activeRunBase.id, "running")],
    newsSources: ["CoinDesk", "The Block", "Solana Foundation Blog", "Helius Research"],
  });
}

export function listRuns(nowMs = Date.now()) {
  const active = getActiveRun(nowMs);
  const runs = [...completedRuns];
  if (active) {
    runs.unshift(active);
  } else {
    runs.unshift(
      createRun({
        id: activeRunBase.id,
        runNumber: activeRunBase.runNumber,
        topic: activeRunBase.topic,
        status: "complete",
        startedAt: activeRunBase.startedAt,
        completedAt: new Date(nowMs).toISOString(),
        totalCostUsdc: 0.0041,
        totalCostSol: 0.0003,
        articleTitle: "Solana's DeFi Surge Reaches New Heights",
        articleBody: [
          "The active run has already completed and moved into history.",
          "The dashboard preserves the same detail view so the run remains inspectable after the fact.",
        ],
        steps: [
          ...buildStepSet(activeRunBase.id, activeRunStart, "complete", activeRunBase.txHash),
          buildSentinelStep(activeRunBase.id, "complete"),
        ],
      })
    );
  }
  return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function getRunById(id: string, nowMs = Date.now()) {
  if (id === activeRunBase.id) {
    return getActiveRun(nowMs) ?? listRuns(nowMs).find((run) => run.id === id) ?? null;
  }

  return listRuns(nowMs).find((run) => run.id === id) ?? null;
}

export function getDashboardOutputs(nowMs = Date.now()) {
  return completedRuns.slice(0, 6).map((run) => ({
    id: run.id,
    runNumber: run.runNumber,
    title: run.articleTitle,
    topic: run.topic,
    coverImage: run.coverImage,
    date: run.completedAt ?? run.startedAt,
    stepCount: 4,
    totalCostUsdc: run.totalCostUsdc,
    txHash: run.txHash,
  }));
}

export function getTopicOptions(nowMs = Date.now()) {
  const runTopics = listRuns(nowMs).map((run) => run.topic);
  return Array.from(new Set(runTopics));
}

export function getHistoryStats(nowMs = Date.now()) {
  const runs = listRuns(nowMs);
  return {
    totalRuns: runs.length,
    complete: runs.filter((run) => run.status === "complete").length,
    failed: runs.filter((run) => run.status === "failed").length,
    running: runs.filter((run) => run.status === "running").length,
  };
}
