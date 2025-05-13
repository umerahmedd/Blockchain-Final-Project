const fs = require('fs');
const path = require('path');

// Local deployed contract addresses
const tokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const treasuryAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// Create deployment info object
const deploymentInfo = {
  tokenAddress,
  treasuryAddress,
  network: 'localhost',
  deployer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' // Default hardhat first account
};

// Ensure directory exists
const destDir = path.join(__dirname, '../client/src/contracts');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Save the info
fs.writeFileSync(
  path.join(destDir, 'deployment.json'),
  JSON.stringify(deploymentInfo, null, 2)
);

console.log('Local deployment info saved to client/src/contracts/deployment.json');

// We also need to copy ABIs
// Get the artifacts
const artifactsDir = path.join(__dirname, '../artifacts/contracts');

// Copy MyToken ABI
try {
  const tokenArtifactPath = path.join(artifactsDir, 'MyToken.sol/MyToken.json');
  const tokenArtifact = JSON.parse(fs.readFileSync(tokenArtifactPath, 'utf8'));
  
  // Create simplified ABI file with contract address
  const tokenData = {
    contractAddress: tokenAddress,
    abi: tokenArtifact.abi
  };
  
  fs.writeFileSync(
    path.join(destDir, 'MyToken.json'),
    JSON.stringify(tokenData, null, 2)
  );
  
  console.log('MyToken ABI copied successfully');
} catch (error) {
  console.error('Error copying MyToken ABI:', error);
}

// Copy DAOTreasury ABI
try {
  const treasuryArtifactPath = path.join(artifactsDir, 'DAOTreasury.sol/DAOTreasury.json');
  const treasuryArtifact = JSON.parse(fs.readFileSync(treasuryArtifactPath, 'utf8'));
  
  // Create simplified ABI file with contract address
  const treasuryData = {
    contractAddress: treasuryAddress,
    abi: treasuryArtifact.abi
  };
  
  fs.writeFileSync(
    path.join(destDir, 'DAOTreasury.json'),
    JSON.stringify(treasuryData, null, 2)
  );
  
  console.log('DAOTreasury ABI copied successfully');
} catch (error) {
  console.error('Error copying DAOTreasury ABI:', error);
}

console.log('ABI files copied to frontend directory with contract addresses'); 