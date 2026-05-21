// Payment x402 disabled - using ACE free credits
// This file is kept as a stub for future mainnet use

export async function payWithAceX402(
  orderId: string
): Promise<{ txHash: string; amountPaid: number }> {
  console.log("[x402] Skipped - using free credits");
  return {
    txHash: "free-credit-" + Date.now(),
    amountPaid: 0,
  };
}

export async function createAceOrder(
  serviceType: string,
  payload: Record<string, any>
): Promise<{ orderId: string }> {
  return { orderId: "free-" + Date.now() };
}
