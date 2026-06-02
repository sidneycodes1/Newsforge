import { randomUUID } from "node:crypto";

import {
  fetchNews,
  writeArticle,
  generateImage,
  generateAudio,
  getTokenUsage,
  resetTokenUsage,
} from "@agent/services/ace";
import {
  createRun,
  updateRunStatus,
  updateRunComplete,
  createStep,
  updateStepStatus,
  updateStepComplete,
  createOutput,
  getRuns,
} from "@agent/db/queries";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

const cleanTitle = (raw: string, topic: string = "News Update"): string => {
  if (!raw) return topic;
  
  // Remove search queries
  if (raw.includes('search(')) {
    return topic;
  }
  
  return raw
    .replace(/^#+\s*/, '')
    .replace(/^\*\*Headline:\*\*/i, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^[>-]\s*/, '')
    .replace(/\\/g, '')
    .trim() || topic;
};

export async function runNewsForge(): Promise<void> {
  resetTokenUsage();
  const runId = randomUUID();
  const topic = process.env.AGENT_TOPIC || "Solana ecosystem";

  const previousRuns = await getRuns();
  const runNumber = previousRuns.length + 1;

  console.log(`\nStarting Run #${runNumber} - ${topic}`);
  console.log(`Run ID: ${runId}`);

  await createRun({
    id: runId,
    run_number: runNumber,
    topic,
    started_at: new Date().toISOString(),
  });

  let totalCostAce = 0;
  let newsData: any = null;
  let articleData: any = null;
  let imageData: any = null;
  let audioData: any = null;

  const failRun = async (stepId: string, stepStart: number, error: unknown) => {
    const message = toErrorMessage(error);
    await updateStepComplete(stepId, {
      status: "failed",
      cost_usdc: 0,
      tx_hash: "",
      duration_ms: Date.now() - stepStart,
      output_ref: message,
      completed_at: new Date().toISOString(),
    });
    await updateRunStatus(runId, "failed", message);
    console.error("Run failed:", message);
  };

  // STEP 1: Fetch News
  const step1Id = randomUUID();
  await createStep({
    id: step1Id,
    run_id: runId,
    step_number: 1,
    step_name: "fetch_news",
    api_used: "ACE Serp Google API",
  });
  await updateStepStatus(step1Id, "running");
  const s1Start = Date.now();

  try {
    newsData = await fetchNews(topic, runId);
    totalCostAce += newsData.costUsdc;
    await updateStepComplete(step1Id, {
      status: "complete",
      cost_usdc: newsData.costUsdc,
      tx_hash: newsData.txHash,
      duration_ms: Date.now() - s1Start,
      output_ref: JSON.stringify(newsData.headlines),
      completed_at: new Date().toISOString(),
    });
    console.log(
      `Step 1 complete - ${newsData.headlines.length} headlines fetched`
    );
  } catch (error) {
    await failRun(step1Id, s1Start, error);
    return;
  }

  // STEP 2: Write Article
  const step2Id = randomUUID();
  await createStep({
    id: step2Id,
    run_id: runId,
    step_number: 2,
    step_name: "write_article",
    api_used: "ACE Chat API",
  });
  await updateStepStatus(step2Id, "running");
  const s2Start = Date.now();

  try {
    articleData = await writeArticle(topic, newsData, runId);
    totalCostAce += articleData.costUsdc;
    await updateStepComplete(step2Id, {
      status: "complete",
      cost_usdc: articleData.costUsdc,
      tx_hash: articleData.txHash,
      duration_ms: Date.now() - s2Start,
      output_ref: articleData.filePath,
      completed_at: new Date().toISOString(),
    });
    console.log(`Step 2 complete - Article: "${articleData.title}"`);
  } catch (error) {
    await failRun(step2Id, s2Start, error);
    return;
  }

  // STEP 3: Generate Image
  const step3Id = randomUUID();
  await createStep({
    id: step3Id,
    run_id: runId,
    step_number: 3,
    step_name: "generate_image",
    api_used: "ACE Flux API",
  });
  await updateStepStatus(step3Id, "running");
  const s3Start = Date.now();

  try {
    imageData = await generateImage(articleData.title, runId);
    totalCostAce += imageData.costUsdc;
    await updateStepComplete(step3Id, {
      status: "complete",
      cost_usdc: imageData.costUsdc,
      tx_hash: imageData.txHash,
      duration_ms: Date.now() - s3Start,
      output_ref: imageData.filePath,
      completed_at: new Date().toISOString(),
    });
    console.log("Step 3 complete - Image saved");
  } catch (error) {
    await updateStepComplete(step3Id, {
      status: "failed",
      cost_usdc: 0,
      tx_hash: "",
      duration_ms: Date.now() - s3Start,
      output_ref: toErrorMessage(error),
      completed_at: new Date().toISOString(),
    });
    console.error("Step 3 failed (non-fatal):", toErrorMessage(error));
  }

  // STEP 4: Audio generation SKIPPED (removed feature)
  console.log('[runner] Skipping audio (feature removed)');
  audioData = {
    filePath: null,
    textFallback: null,
    costUsdc: 0,
    txHash: "skipped"
  };

  const completedAt = new Date().toISOString();
  const tokenState = getTokenUsage();
  const tokenBreakdown = JSON.stringify(tokenState);
  await updateRunComplete(
    runId,
    0,
    totalCostAce,
    completedAt,
    tokenState.total,
    tokenBreakdown
  );

  await createOutput({
    id: randomUUID(),
    run_id: runId,
    article_title: cleanTitle(articleData?.title || topic, topic),
    article_body: articleData?.body || "",
    image_path: imageData?.filePath || "",
    audio_path: audioData?.filePath || null,
    audio_text: audioData?.textFallback || null,
    news_sources: JSON.stringify(newsData?.sources || []),
  });

  await updateRunStatus(runId, "complete");

  console.log(`\nRun #${runNumber} complete!`);
  console.log(`Total ACE cost: $${totalCostAce.toFixed(6)}`);
  console.log("---------------------------------\n");
}
