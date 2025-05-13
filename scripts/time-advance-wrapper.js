const { spawn } = require('child_process');

// Get time to advance from command line (default to 86400 seconds = 1 day)
const timeToAdvance = process.argv[2] || '86400';

// Check if it's a valid number
if (isNaN(parseInt(timeToAdvance))) {
  console.error("Please provide a valid time in seconds");
  console.log("Usage: npm run advance-time <seconds>");
  process.exit(1);
}

console.log(`Advancing blockchain time by ${timeToAdvance} seconds...`);

// Use spawn to execute hardhat with the correct arguments
const hardhat = spawn('npx', [
  'hardhat',
  'run',
  'scripts/fast-forward-time.js',
  '--network',
  'localhost'
], {
  env: {
    ...process.env,
    TIME_TO_ADVANCE: timeToAdvance
  },
  stdio: 'inherit' // This pipes the child's stdout/stderr to the parent
});

hardhat.on('close', (code) => {
  process.exit(code);
}); 