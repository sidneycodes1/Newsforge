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

// Copy static files for standalone mode
const staticSrc = path.join(process.cwd(), '.next', 'static');
const staticDst = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');
const publicSrc = path.join(process.cwd(), 'public');
const publicDst = path.join(process.cwd(), '.next', 'standalone', 'public');

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

console.log('Copying static files...');
copyDir(staticSrc, staticDst);
copyDir(publicSrc, publicDst);
console.log('Static files copied.');

console.log('=== NewsForge Starting on Railway ===');
console.log('Working directory:', process.cwd());
console.log('PORT:', process.env.PORT || '3000');
console.log('DATABASE_PATH:', process.env.DATABASE_PATH);

// Start agent worker in background
console.log('Starting agent worker...');
const agent = spawn('node', ['agent/dist/index.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,  // Inherit all parent env vars
    NODE_ENV: 'production',
    CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 9,18 * * *',
    ACE_PLATFORM_TOKEN: process.env.ACE_PLATFORM_TOKEN,
    DATABASE_PATH: process.env.DATABASE_PATH || '/app/data/newsforge.db',
    OUTPUTS_DIR: process.env.OUTPUTS_DIR || '/app/outputs',
    AGENT_TOPIC: process.env.AGENT_TOPIC || 'Solana ecosystem'
  }
});

agent.on('error', (err) => {
  console.error('Agent error:', err.message);
});

agent.on('exit', (code, signal) => {
  console.log('Agent exited:', code, signal);
});

// Start Next.js standalone server
console.log('Starting Next.js dashboard...');
const serverPath = path.join(process.cwd(), '.next', 'standalone', 'server.js');

// Check if standalone server exists
if (!fs.existsSync(serverPath)) {
  console.error('Standalone server not found at:', serverPath);
  console.log('Falling back to npm start...');
  const fallback = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000',
      HOSTNAME: '0.0.0.0',
    },
    cwd: process.cwd(),
  });
  fallback.on('exit', (code) => {
    agent.kill();
    process.exit(code || 0);
  });
} else {
  const dashboard = spawn('node', [serverPath], {
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
    agent.kill();
    process.exit(1);
  });

  dashboard.on('exit', (code) => {
    console.log('Dashboard exited:', code);
    agent.kill();
    process.exit(code || 0);
  });
}

process.on('SIGTERM', () => {
  agent.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  agent.kill('SIGTERM');
  process.exit(0);
});
