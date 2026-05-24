const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create required directories
const dirs = [
  path.join(process.cwd(), 'data'),
  path.join(process.cwd(), 'outputs'),
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log('Created:', dir);
  }
});

console.log('=== NewsForge Starting on Railway ===');
console.log('Working directory:', process.cwd());
console.log('PORT:', process.env.PORT || '3000');
console.log('DATABASE_PATH:', process.env.DATABASE_PATH);

// Start agent worker in background
console.log('Starting agent worker...');
const agent = spawn('npx', ['tsx', 'agent/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: process.cwd(),
});

agent.on('error', (err) => {
  console.error('Agent error:', err.message);
});

agent.on('exit', (code, signal) => {
  console.log('Agent exited:', code, signal);
});

// Start Next.js dashboard
console.log('Starting Next.js dashboard...');
const dashboard = spawn('node', ['.next/standalone/server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000',
    HOSTNAME: '0.0.0.0',
  },
  cwd: process.cwd(),
});

dashboard.on('error', (err) => {
  console.error('Dashboard error:', err.message);
  // Fallback to npm start if standalone fails
  const fallback = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000',
    },
    cwd: process.cwd(),
  });
  fallback.on('exit', (code) => {
    agent.kill();
    process.exit(code || 0);
  });
});

dashboard.on('exit', (code) => {
  console.log('Dashboard exited:', code);
  agent.kill();
  process.exit(code || 0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  agent.kill('SIGTERM');
  dashboard.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  agent.kill('SIGTERM');
  dashboard.kill('SIGTERM');
  process.exit(0);
});
