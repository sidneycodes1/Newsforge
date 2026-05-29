import { randomUUID } from "node:crypto";

import {
  fetchNews,
  writeArticle,
  generateImage,
  generateAudio,
} from "./services/ace";
import {
  createRun,
  updateRunStatus,
  updateRunComplete,
  createStep,
  updateStepStatus,
  updateStepComplete,
  createOutput,
  getRuns,
} from "./db/queries";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function runNewsForge(): Promise<void> {
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

  // STEP 4: Generate Audio
  const step4Id = randomUUID();
  await createStep({
    id: step4Id,
    run_id: runId,
    step_number: 4,
    step_name: "generate_audio",
    api_used: "ACE TTS API",
  });
  await updateStepStatus(step4Id, "running");
  const s4Start = Date.now();

  try {
    audioData = await generateAudio(articleData.body, runId);
    totalCostAce += audioData.costUsdc;
    await updateStepComplete(step4Id, {
      status: "complete",
      cost_usdc: audioData.costUsdc,
      tx_hash: audioData.txHash,
      duration_ms: Date.now() - s4Start,
      output_ref: audioData.filePath,
      completed_at: new Date().toISOString(),
    });
    console.log("Step 4 complete - Audio saved");
  } catch (error) {
    await updateStepComplete(step4Id, {
      status: "failed",
      cost_usdc: 0,
      tx_hash: "",
      duration_ms: Date.now() - s4Start,
      output_ref: toErrorMessage(error),
      completed_at: new Date().toISOString(),
    });
    console.error("Step 4 failed (non-fatal):", toErrorMessage(error));
  }

  const completedAt = new Date().toISOString();
  await updateRunComplete(runId, 0, totalCostAce, completedAt);

  await createOutput({
    id: randomUUID(),
    run_id: runId,
    article_title: articleData?.title || "",
    article_body: articleData?.body || "",
    image_path: imageData?.filePath || "",
    audio_path: audioData?.filePath || "",
    news_sources: JSON.stringify(newsData?.sources || []),
  });

  await updateRunStatus(runId, "complete");

  console.log(`\nRun #${runNumber} complete!`);
  console.log(`Total ACE cost: $${totalCostAce.toFixed(6)}`);
  console.log("---------------------------------\n");
}
