// Sentinel disabled - SAP mainnet not active
// Kept as stub for future mainnet use

export async function callSentinel(
  runId: string,
  topic: string
): Promise<{
  txHash: string;
  costSol: number;
  response: string;
}> {
  console.log("[Sentinel] Disabled - stub mode");
  return {
    txHash: "sentinel-stub-" + Date.now(),
    costSol: 0,
    response: "Sentinel stub - SAP not active",
  };
}
