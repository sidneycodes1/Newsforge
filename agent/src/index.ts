import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";

async function bootstrap() {
  const dotenv = await import("dotenv");
  dotenv.default.config({ path: ".env.local" });
  dotenv.default.config({ path: ".env" });

  const configPath = path.join(
    process.cwd(),
    "config",
    "runtime",
    "newsforge.json"
  );
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(raw) as {
      topic?: string;
      schedule?: string;
    };

    if (config.topic) {
      process.env.AGENT_TOPIC = config.topic;
    }

    if (config.schedule) {
      process.env.CRON_SCHEDULE = config.schedule;
    }
  } catch {
    // No persisted config yet; fall back to env vars.
  }

  const { runNewsForge } = await import("@agent/runtime/runner");
  const { default: db } = await import("@agent/db/client");

  const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9,18 * * *';
  const triggerFlagPath = path.join(process.cwd(), "data", "trigger.flag");

  console.log("🤖 NewsForge Agent started");
  console.log(`Schedule: ${process.env.CRON_SCHEDULE}`);
  console.log(`Topic: ${process.env.AGENT_TOPIC}`);
  console.log("Mode: ACE free credits (Category 2)");

  void db;

  let isRunning = false;
  let manualTriggerPending = false;

  async function runOnce() {
    if (isRunning) {
      console.log("Agent run skipped: previous run still active");
      return;
    }

    isRunning = true;
    try {
      await runNewsForge();
    } catch (error) {
      console.error("Agent run failed:", error);
    } finally {
      isRunning = false;
      if (manualTriggerPending) {
        manualTriggerPending = false;
        void runOnce();
      }
    }
  }

  void runOnce();

  cron.schedule(CRON_SCHEDULE, () => {
    void runOnce();
  });

  setInterval(() => {
    if (!fs.existsSync(triggerFlagPath)) {
      return;
    }

    fs.unlinkSync(triggerFlagPath);
    console.log("Manual trigger detected");

    if (isRunning) {
      manualTriggerPending = true;
      return;
    }

    void runOnce();
  }, 2000);

  process.on("SIGTERM", () => {
    console.log("Agent shutting down...");
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error("Agent bootstrap failed:", error);
});
