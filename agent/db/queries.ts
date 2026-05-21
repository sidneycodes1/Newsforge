import db from "./client";

const createRunStmt = db.prepare(
  `INSERT INTO runs (id, run_number, topic, started_at) VALUES (@id, @run_number, @topic, @started_at)`
);

const updateRunStatusStmt = db.prepare(
  `UPDATE runs SET status = @status, error = @error WHERE id = @id`
);

const updateRunCompleteStmt = db.prepare(
  `UPDATE runs
   SET status = 'complete',
       total_cost_ace = @total_cost_ace,
       completed_at = @completed_at
   WHERE id = @id`
);

const createStepStmt = db.prepare(
  `INSERT INTO steps (id, run_id, step_number, step_name, api_used) VALUES (@id, @run_id, @step_number, @step_name, @api_used)`
);

const updateStepStatusStmt = db.prepare(
  `UPDATE steps SET status = @status WHERE id = @id`
);

const updateStepCompleteStmt = db.prepare(
  `UPDATE steps
   SET status = @status,
       cost_usdc = @cost_usdc,
       tx_hash = @tx_hash,
       duration_ms = @duration_ms,
       output_ref = @output_ref,
       completed_at = @completed_at
   WHERE id = @id`
);

const createOutputStmt = db.prepare(
  `INSERT INTO outputs (id, run_id, article_title, article_body, image_path, audio_path, news_sources)
   VALUES (@id, @run_id, @article_title, @article_body, @image_path, @audio_path, @news_sources)`
);

const getRunsStmt = db.prepare(
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
   LIMIT @limit`
);

const getActiveRunStmt = db.prepare(
  `SELECT * FROM runs WHERE status = 'running' ORDER BY datetime(started_at) DESC LIMIT 1`
);

const getRunByIdStmt = db.prepare(`SELECT * FROM runs WHERE id = ? LIMIT 1`);

const getStepsByRunIdStmt = db.prepare(
  `SELECT * FROM steps WHERE run_id = ? ORDER BY step_number ASC`
);

const getOutputByRunIdStmt = db.prepare(
  `SELECT * FROM outputs WHERE run_id = ? LIMIT 1`
);

export function createRun(run: {
  id: string;
  run_number: number;
  topic: string;
  started_at: string;
}): void {
  createRunStmt.run(run);
}

export function updateRunStatus(
  id: string,
  status: string,
  error?: string
): void {
  updateRunStatusStmt.run({
    id,
    status,
    error: error ?? null,
  });
}

export function updateRunComplete(
  id: string,
  _ignoredSapCost: number,
  total_cost_ace: number,
  completed_at: string
): void {
  updateRunCompleteStmt.run({
    id,
    total_cost_ace,
    completed_at,
  });
}

export function createStep(step: {
  id: string;
  run_id: string;
  step_number: number;
  step_name: string;
  api_used: string;
}): void {
  createStepStmt.run(step);
}

export function updateStepStatus(id: string, status: string): void {
  updateStepStatusStmt.run({
    id,
    status,
  });
}

export function updateStepComplete(
  id: string,
  data: {
    status: string;
    cost_usdc: number;
    tx_hash: string;
    duration_ms: number;
    output_ref: string;
    completed_at: string;
  }
): void {
  updateStepCompleteStmt.run({
    id,
    ...data,
  });
}

export function createOutput(output: {
  id: string;
  run_id: string;
  article_title: string;
  article_body: string;
  image_path: string;
  audio_path: string;
  news_sources: string;
}): void {
  createOutputStmt.run(output);
}

export function getRuns(limit = 100): any[] {
  return getRunsStmt.all({ limit });
}

export function getActiveRun(): any {
  return getActiveRunStmt.get() ?? null;
}

export function getRunById(id: string): any {
  return getRunByIdStmt.get(id) ?? null;
}

export function getStepsByRunId(runId: string): any[] {
  return getStepsByRunIdStmt.all(runId);
}

export function getOutputByRunId(runId: string): any {
  return getOutputByRunIdStmt.get(runId) ?? null;
}
