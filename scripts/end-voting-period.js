const { ethers } = require("hardhat");
const path = require('path');
const fs = require('fs');

// Read deployment info
const deploymentPath = path.join(__dirname, '../client/src/contracts/deployment.json');
let deployment;

try {
  deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
} catch (error) {
  console.error('Error reading deployment.json. Make sure you have deployed to the local network first.');
  process.exit(1);
}

async function main() {
  console.log("Ending voting period on all active proposals...");
  
  // Get the DAOTreasury contract
  const treasuryAddress = deployment.treasuryAddress;
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = await DAOTreasury.attach(treasuryAddress);
  
  // Get the voting period constant
  const VOTING_PERIOD = await treasury.VOTING_PERIOD();
  console.log(`Voting period is ${VOTING_PERIOD} blocks`);
  
  // Get current block number
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log(`Current block number: ${currentBlock}`);
  
  // Get the proposal count
  const proposalCount = await treasury.proposalCount();
  console.log(`Total proposals: ${proposalCount}`);
  
  if (proposalCount == 0) {
    console.log("No proposals found. Create some proposals first.");
    return;
  }
  
  // Get the latest proposal's end block
  let latestEndBlock = 0;
  
  for (let i = 1; i <= proposalCount; i++) {
    const proposal = await treasury.proposals(i);
    if (Number(proposal.endBlock) > latestEndBlock) {
      latestEndBlock = Number(proposal.endBlock);
    }
  }
  
  console.log(`Latest end block: ${latestEndBlock}`);
  
  // Calculate how many blocks to mine
  const blocksToMine = latestEndBlock - currentBlock + 5; // Add a few extra blocks to be safe
  
  if (blocksToMine <= 0) {
    console.log("All proposals have already ended their voting periods.");
    return;
  }
  
  console.log(`Mining ${blocksToMine} blocks to end all voting periods...`);
  
  // Mine the required blocks
  for (let i = 0; i < blocksToMine; i++) {
    await ethers.provider.send("evm_mine");
    
    // Log progress every 10 blocks
    if (i % 10 === 0 || i === blocksToMine - 1) {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Current block number: ${blockNumber}`);
    }
  }
  
  const finalBlockNumber = await ethers.provider.getBlockNumber();
  console.log(`Done! All voting periods should now be ended. Final block number: ${finalBlockNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 