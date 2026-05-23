"use strict";

const db = require("./client");
const { dbReady } = db;

async function runQuery(sql, args = []) {
  await dbReady;
  return db.execute({ sql, args });
}

async function createRun(run) {
  await runQuery(
    `INSERT INTO runs (id, run_number, topic, started_at)
     VALUES (?, ?, ?, ?)`,
    [run.id, run.run_number, run.topic, run.started_at]
  );
}

async function updateRunStatus(id, status, error) {
  await runQuery(
    `UPDATE runs SET status = ?, error = ?
     WHERE id = ?`,
    [status, error || null, id]
  );
}

async function updateRunComplete(id, _ignoredSapCost, total_cost_ace, completed_at) {
  await runQuery(
    `UPDATE runs
     SET status = 'complete',
         total_cost_ace = ?,
         completed_at = ?
     WHERE id = ?`,
    [total_cost_ace, completed_at, id]
  );
}

async function createStep(step) {
  await runQuery(
    `INSERT INTO steps (id, run_id, step_number, step_name, api_used, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [step.id, step.run_id, step.step_number, step.step_name, step.api_used]
  );
}

async function updateStepStatus(id, status) {
  await runQuery(`UPDATE steps SET status = ? WHERE id = ?`, [status, id]);
}

async function updateStepComplete(id, data) {
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

async function createOutput(output) {
  await runQuery(
    `INSERT INTO outputs (id, run_id, article_title, article_body, image_path, audio_path, news_sources)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      output.id,
      output.run_id,
      output.article_title,
      output.article_body,
      output.image_path,
      output.audio_path,
      output.news_sources,
    ]
  );
}

async function getRuns(limit = 100) {
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

async function getActiveRun() {
  const result = await runQuery(
    `SELECT *
     FROM runs
     WHERE status = 'running'
     ORDER BY datetime(started_at) DESC
     LIMIT 1`
  );

  return result.rows[0] || null;
}

async function getRunById(id) {
  const result = await runQuery(
    `SELECT * FROM runs WHERE id = ? LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function getStepsByRunId(runId) {
  const result = await runQuery(
    `SELECT * FROM steps WHERE run_id = ? ORDER BY step_number ASC`,
    [runId]
  );

  return result.rows;
}

async function getOutputByRunId(runId) {
  const result = await runQuery(
    `SELECT * FROM outputs WHERE run_id = ? LIMIT 1`,
    [runId]
  );

  return result.rows[0] || null;
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
