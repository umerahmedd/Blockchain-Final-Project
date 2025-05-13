const { spawn } = require('child_process');
const path = require('path');

// Get the recipient address from command line
const recipientAddress = process.argv[2];

if (!recipientAddress) {
  console.error("Please provide a recipient address");
  console.log("Usage: npm run mint-local <recipient-address>");
  process.exit(1);
}

// Use spawn to execute hardhat with the correct arguments
const hardhat = spawn('npx', [
  'hardhat',
  'run',
  'scripts/mint-local-tokens.js',
  '--network',
  'localhost'
], {
  env: {
    ...process.env,
    RECIPIENT_ADDRESS: recipientAddress
  },
  stdio: 'inherit' // This pipes the child's stdout/stderr to the parent
});

hardhat.on('close', (code) => {
  process.exit(code);
}); 