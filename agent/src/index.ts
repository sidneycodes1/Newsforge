import fs from "node:fs";
import path from "node:path";
import cron from "node-cron";

async function bootstrap() {
  // Load .env from project root dynamically (handles process.cwd() being either the project root or the agent/ folder)
  let projectRoot = process.cwd();
  if (!fs.existsSync(path.join(projectRoot, ".env.local"))) {
    if (fs.existsSync(path.join(projectRoot, "..", ".env.local"))) {
      projectRoot = path.resolve(projectRoot, "..");
    } else if (fs.existsSync(path.join(__dirname, "..", "..", ".env.local"))) {
      projectRoot = path.resolve(__dirname, "..", "..");
    }
  }
  
  const envPath = path.join(projectRoot, ".env.local");
  
  console.log(`[Bootstrap] Loading env from: ${envPath}`);
  console.log(`[Bootstrap] Env exists: ${fs.existsSync(envPath)}`);
  
  const dotenv = await import("dotenv");
  
  if (fs.existsSync(envPath)) {
    dotenv.default.config({ path: envPath });
  }
  dotenv.default.config({ path: path.join(projectRoot, ".env") });

  // Try to load config from newsforge.json
  const configPath = path.join(projectRoot, "config", "runtime", "newsforge.json");
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(raw) as {
      topic?: string;
      schedule?: string;
    };

    // Environment variables take precedence over the JSON configuration
    if (config.topic && !process.env.AGENT_TOPIC) {
      process.env.AGENT_TOPIC = config.topic;
    }

    if (config.schedule && !process.env.CRON_SCHEDULE) {
      process.env.CRON_SCHEDULE = config.schedule;
    }
  } catch (err) {
    // No persisted config yet; fall back to env vars
    console.log("[Bootstrap] No config file found or could not read config, using env vars");
  }

  const { runNewsForge } = await import("@agent/runtime/runner");
  const { default: db } = await import("@agent/db/client");

  // Set defaults BEFORE logging
  const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 9,18 * * *';
  const AGENT_TOPIC = process.env.AGENT_TOPIC || 'Solana ecosystem';

  // Now log the actual values
  console.log("🤖 NewsForge Agent started");
  console.log(`Schedule: ${CRON_SCHEDULE}`);
  console.log(`Topic: ${AGENT_TOPIC}`);
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

  const triggerFlagPath = path.join(projectRoot, "data", "trigger.flag");

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
