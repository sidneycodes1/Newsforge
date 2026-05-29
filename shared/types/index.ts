export type StepStatus = "pending" | "running" | "complete" | "failed";
export type RunStatus = "running" | "complete" | "failed";

export interface RunStep {
  id: string;
  stepNumber: number;
  stepName: string;
  apiUsed: string;
  status: StepStatus;
  costUsdc: number;
  costSol?: number;
  txHash: string;
  durationMs: number;
  outputRef: string;
  startedAt?: string;
  completedAt?: string;
  detail?: string;
}

export interface RunRecord {
  id: string;
  runNumber: number;
  topic: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string | null;
  totalCostUsdc: number;
  totalCostSol: number;
  articleTitle: string;
  articleBody: string[];
  coverImage: string;
  audioUrl: string;
  txHash: string;
  newsSources: string[];
  steps: RunStep[];
}

export interface SettingsRecord {
  agentName: string;
  sapAgentAddress: string;
  cronSchedule: string;
  intervalLabel: "15min" | "30min" | "1hr" | "6hr";
  topic: string;
  synapseRpcEndpoint: string;
  acePlatformHealthy: boolean;
  synapseHealthy: boolean;
  solanaBalanceSol: number;
  acePlatformTokenMasked: string;
  nextRunAt: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
