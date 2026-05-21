"use strict";

const db = require("./client");

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

function createRun(run) {
  createRunStmt.run(run);
}

function updateRunStatus(id, status, error) {
  updateRunStatusStmt.run({
    id,
    status,
    error: error ?? null,
  });
}

function updateRunComplete(id, _ignoredSapCost, total_cost_ace, completed_at) {
  updateRunCompleteStmt.run({
    id,
    total_cost_ace,
    completed_at,
  });
}

function createStep(step) {
  createStepStmt.run(step);
}

function updateStepStatus(id, status) {
  updateStepStatusStmt.run({
    id,
    status,
  });
}

function updateStepComplete(id, data) {
  updateStepCompleteStmt.run({
    id,
    ...data,
  });
}

function createOutput(output) {
  createOutputStmt.run(output);
}

function getRuns(limit = 100) {
  return getRunsStmt.all({ limit });
}

function getActiveRun() {
  return getActiveRunStmt.get() ?? null;
}

function getRunById(id) {
  return getRunByIdStmt.get(id) ?? null;
}

function getStepsByRunId(runId) {
  return getStepsByRunIdStmt.all(runId);
}

function getOutputByRunId(runId) {
  return getOutputByRunIdStmt.get(runId) ?? null;
}

module.exports = {
  createRun,
  updateRunStatus,
  updateRunComplete,
  createStep,
  updateStepStatus,
  updateStepComplete,
  createOutput,
  getRuns,
  getActiveRun,
  getRunById,
  getStepsByRunId,
  getOutputByRunId,
};
