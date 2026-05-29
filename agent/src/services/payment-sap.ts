// SAP payments disabled - Category 1 not active
// Kept as stub for future mainnet use

export const sapPaymentService = {
  async initialize(): Promise<void> {
    console.log("[SAP] Disabled - stub mode");
  },
  async getPaymentHeaders(): Promise<Record<string, string>> {
    return {};
  },
  async settlePayment(
    callCount: number,
    serviceData: string
  ): Promise<string> {
    return "sap-stub-" + Date.now();
  },
  getWalletAddress(): string {
    return "stub-wallet";
  },
};
