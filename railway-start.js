const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const outputsDir = path.join(process.cwd(), 'outputs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

console.log('Starting NewsForge agent...');
const agent = spawn('npx', ['tsx', 'agent/index.ts'], {
  stdio: 'inherit',
  env: process.env,
});

agent.on('error', (err) => {
  console.error('Agent failed:', err.message);
});

console.log('Starting Next.js dashboard...');
const dashboard = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '3000' },
});

dashboard.on('exit', (code) => {
  agent.kill();
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  agent.kill();
  dashboard.kill();
  process.exit(0);
});
