import db, { dbReady } from "./client";

async function runQuery(sql: string, args: any[] = []) {
  await dbReady;
  return db.execute({ sql, args });
}

export async function createRun(run: {
  id: string;
  run_number: number;
  topic: string;
  started_at: string;
  tokens_used?: number;
  token_breakdown?: string | null;
}): Promise<void> {
  await runQuery(
    `INSERT INTO runs (id, run_number, topic, started_at, tokens_used, token_breakdown)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      run.id,
      run.run_number,
      run.topic,
      run.started_at,
      run.tokens_used ?? 0,
      run.token_breakdown ?? null,
    ]
  );
}

export async function updateRunStatus(
  id: string,
  status: string,
  error?: string
): Promise<void> {
  await runQuery(
    `UPDATE runs SET status = ?, error = ?
     WHERE id = ?`,
    [status, error || null, id]
  );
}

export async function updateRunComplete(
  id: string,
  _ignoredSapCost: number,
  total_cost_ace: number,
  completed_at: string,
  tokens_used = 0,
  token_breakdown: string | null = null
): Promise<void> {
  await runQuery(
    `UPDATE runs
     SET status = 'complete',
         total_cost_ace = ?,
         completed_at = ?,
         tokens_used = ?,
         token_breakdown = ?
     WHERE id = ?`,
    [total_cost_ace, completed_at, tokens_used, token_breakdown, id]
  );
}

export async function createStep(step: {
  id: string;
  run_id: string;
  step_number: number;
  step_name: string;
  api_used: string;
}): Promise<void> {
  await runQuery(
    `INSERT INTO steps (id, run_id, step_number, step_name, api_used, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [step.id, step.run_id, step.step_number, step.step_name, step.api_used]
  );
}

export async function updateStepStatus(
  id: string,
  status: string
): Promise<void> {
  await runQuery(`UPDATE steps SET status = ? WHERE id = ?`, [status, id]);
}

export async function updateStepComplete(
  id: string,
  data: {
    status: string;
    cost_usdc: number;
    tx_hash: string;
    duration_ms: number;
    output_ref: string;
    completed_at: string;
  }
): Promise<void> {
  await runQuery(
    `UPDATE steps
     SET status = ?,
         cost_usdc = ?,
         tx_hash = ?,
         duration_ms = ?,
         output_ref = ?,
         completed_at = ?
     WHERE id = ?`,
    [
      data.status,
      data.cost_usdc,
      data.tx_hash,
      data.duration_ms,
      data.output_ref,
      data.completed_at,
      id,
    ]
  );
}

export async function createOutput(output: {
  id: string;
  run_id: string;
  article_title: string;
  article_body: string;
  image_path: string;
  audio_path: string | null;
  audio_text?: string | null;
  news_sources: string;
}): Promise<void> {
  await runQuery(
    `INSERT INTO outputs (id, run_id, article_title, article_body, image_path, audio_path, audio_text, news_sources)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      output.id,
      output.run_id,
      output.article_title,
      output.article_body,
      output.image_path,
      output.audio_path,
      output.audio_text ?? null,
      output.news_sources,
    ]
  );
}

export async function getRuns(limit = 100): Promise<any[]> {
  const result = await runQuery(
    `SELECT
       r.*,
       COALESCE(step_count.count, 0) AS step_count,
       COALESCE(output_count.count, 0) AS output_count
     FROM runs r
     LEFT JOIN (
       SELECT run_id, COUNT(*) AS count
       FROM steps
       GROUP BY run_id
     ) AS step_count ON step_count.run_id = r.id
     LEFT JOIN (
       SELECT run_id, COUNT(*) AS count
       FROM outputs
       GROUP BY run_id
     ) AS output_count ON output_count.run_id = r.id
     ORDER BY datetime(r.started_at) DESC
     LIMIT ?`,
    [limit]
  );

  return result.rows;
}

export async function getActiveRun(): Promise<any> {
  const result = await runQuery(
    `SELECT *
     FROM runs
     WHERE status = 'running'
     ORDER BY datetime(started_at) DESC
     LIMIT 1`
  );

  return result.rows[0] ?? null;
}

export async function getRunById(id: string): Promise<any> {
  const result = await runQuery(
    `SELECT * FROM runs WHERE id = ? LIMIT 1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function getStepsByRunId(runId: string): Promise<any[]> {
  const result = await runQuery(
    `SELECT * FROM steps WHERE run_id = ? ORDER BY step_number ASC`,
    [runId]
  );

  return result.rows;
}

export async function getOutputByRunId(runId: string): Promise<any> {
  const result = await runQuery(
    `SELECT * FROM outputs WHERE run_id = ? LIMIT 1`,
    [runId]
  );

  return result.rows[0] ?? null;
}
