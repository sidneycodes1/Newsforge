const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== NewsForge Starting on Railway ===');
console.log('Working directory:', process.cwd());
console.log('PORT:', process.env.PORT || 8080);
console.log('DATABASE_PATH:', process.env.DATABASE_PATH);

// === STEP 1: Create required directories ===
const dataDir = process.env.DATABASE_PATH 
  ? path.dirname(process.env.DATABASE_PATH)
  : '/app/data';
const outputsDir = process.env.OUTPUTS_DIR || '/app/outputs';

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created:', dataDir);
}
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
  console.log('Created:', outputsDir);
}

// === STEP 2: Copy static files ===
console.log('Copying static files...');
try {
  const standaloneStatic = path.join(process.cwd(), '.next', 'standalone', '.next', 'static');
  const targetStatic = path.join(process.cwd(), '.next', 'static');
  if (fs.existsSync(targetStatic) && !fs.existsSync(standaloneStatic)) {
    fs.mkdirSync(path.dirname(standaloneStatic), { recursive: true });
    execSync(`cp -r "${targetStatic}" "${standaloneStatic}"`, { stdio: 'inherit' });
  }

  const publicSrc = path.join(process.cwd(), 'public');
  const publicDst = path.join(process.cwd(), '.next', 'standalone', 'public');
  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDst)) {
    execSync(`cp -r "${publicSrc}" "${publicDst}"`, { stdio: 'inherit' });
  }
  console.log('Static files copied.');
} catch (err) {
  console.log('Static copy note:', err.message);
}

// === STEP 3: Compile agent TypeScript ===
console.log('=== Compiling agent TypeScript ===');
try {
  execSync('npx tsc --project tsconfig.agent.json', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('=== Agent compiled successfully ===');
} catch (err) {
  console.error('=== Agent compilation failed:', err.message);
  // Try to continue if dist already exists
  if (!fs.existsSync(path.join(process.cwd(), 'agent', 'dist', 'index.js'))) {
    console.error('No fallback dist found. Exiting.');
    process.exit(1);
  }
  console.log('Using existing dist as fallback.');
}

// === STEP 4: Set up agent environment ===
const agentEnv = {
  ...process.env,
  NODE_ENV: 'production',
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 9,18 * * *',
  ACE_PLATFORM_TOKEN: process.env.ACE_PLATFORM_TOKEN || '',
  DATABASE_PATH: process.env.DATABASE_PATH || '/app/data/newsforge.db',
  OUTPUTS_DIR: process.env.OUTPUTS_DIR || '/app/outputs',
  AGENT_TOPIC: process.env.AGENT_TOPIC || 'Solana ecosystem',
};

console.log('=== Agent Environment ===');
console.log('CRON_SCHEDULE:', agentEnv.CRON_SCHEDULE);
console.log('ACE_PLATFORM_TOKEN:', agentEnv.ACE_PLATFORM_TOKEN ? 'SET' : 'NOT SET');
console.log('DATABASE_PATH:', agentEnv.DATABASE_PATH);

// === STEP 5: Initialize database ===
console.log('=== Initializing database ===');
try {
  const dbPath = process.env.DATABASE_PATH || '/app/data/newsforge.db';
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  console.log('DB path:', dbPath);
  console.log('=== Database directory ready ===');
} catch (err) {
  console.log('=== DB init note:', err.message, '===');
}

// === STEP 6: Start agent worker ===
console.log('Starting agent worker...');
const agentDistPath = path.join(process.cwd(), 'agent', 'dist', 'index.js');

console.log('Looking for agent at:', agentDistPath);
console.log('Agent dist exists:', fs.existsSync(agentDistPath));

// List what IS in agent/dist for debugging
try {
  const distContents = fs.readdirSync(path.join(process.cwd(), 'agent', 'dist'));
  console.log('agent/dist contents:', distContents);
} catch (e) {
  console.log('agent/dist does not exist yet');
}

if (!fs.existsSync(agentDistPath)) {
  console.error('Agent dist not found at:', agentDistPath);
  console.error('Trying to compile again...');
  try {
    execSync('npx tsc --project tsconfig.agent.json', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (e) {
    console.error('Second compile failed:', e.message);
    process.exit(1);
  }
}

const agent = spawn('node', ['-r', './register-paths.js', agentDistPath], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: agentEnv,
});

agent.on('error', (err) => {
  console.error('Agent error:', err.message);
});

agent.on('exit', (code, signal) => {
  console.log(`Agent exited: ${code} ${signal}`);
  if (code !== 0) {
    console.error('Agent crashed. Restarting in 10 seconds...');
    setTimeout(() => {
      process.exit(1); // Let Railway restart the container
    }, 10000);
  }
});

// === STEP 6.5: Verify Next.js build exists ===
const nextBuildId = path.join(process.cwd(), '.next', 'BUILD_ID');
if (!fs.existsSync(nextBuildId)) {
  console.log('Next.js build not found, building now...');
  try {
    execSync('npx next build', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('Next.js built successfully');
  } catch (err) {
    console.error('Next.js build failed:', err.message);
    process.exit(1);
  }
}

// === STEP 7: Start Next.js dashboard ===
console.log('Starting Next.js dashboard...');
const port = process.env.PORT || 8080;

const standaloneServer = path.join(process.cwd(), '.next', 'standalone', 'server.js');

let nextProcess;
if (fs.existsSync(standaloneServer)) {
  console.log('Using standalone server...');
  nextProcess = spawn('node', [standaloneServer], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port,
      HOSTNAME: '0.0.0.0',
    },
  });
} else {
  console.log('Standalone not found, using next start...');
  nextProcess = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
}

nextProcess.on('error', (err) => {
  console.error('Next.js error:', err.message);
});

// === STEP 8: Handle shutdown ===
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  agent.kill();
  nextProcess.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  agent.kill();
  nextProcess.kill();
  process.exit(0);
});
