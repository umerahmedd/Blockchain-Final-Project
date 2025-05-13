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
  console.log("Ending voting period on all active proposals by advancing time...");
  
  // Get the DAOTreasury contract
  const treasuryAddress = deployment.treasuryAddress;
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = await DAOTreasury.attach(treasuryAddress);
  
  // Get the voting period constant
  const VOTING_PERIOD = await treasury.VOTING_PERIOD();
  console.log(`Voting period is ${VOTING_PERIOD} seconds (${VOTING_PERIOD / 86400} days)`);
  
  // Get current timestamp
  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTimestamp = latestBlock.timestamp;
  console.log(`Current timestamp: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toLocaleString()})`);
  
  // Get the proposal count
  const proposalCount = await treasury.proposalCount();
  console.log(`Total proposals: ${proposalCount}`);
  
  if (proposalCount == 0) {
    console.log("No proposals found. Create some proposals first.");
    return;
  }
  
  // Get the latest proposal's end time
  let latestEndTime = 0;
  
  for (let i = 1; i <= proposalCount; i++) {
    const proposal = await treasury.proposals(i);
    if (Number(proposal.endTime) > latestEndTime) {
      latestEndTime = Number(proposal.endTime);
    }
  }
  
  console.log(`Latest end time: ${latestEndTime} (${new Date(latestEndTime * 1000).toLocaleString()})`);
  
  // Calculate how much time to advance
  const timeToAdvance = latestEndTime - currentTimestamp + 60; // Add 60 seconds to be safe
  
  if (timeToAdvance <= 0) {
    console.log("All proposals have already ended their voting periods.");
    return;
  }
  
  console.log(`Advancing time by ${timeToAdvance} seconds (${timeToAdvance / 86400} days)...`);
  
  // Advance time using evm_increaseTime
  await ethers.provider.send("evm_increaseTime", [timeToAdvance]);
  
  // Mine a new block with the advanced timestamp
  await ethers.provider.send("evm_mine");
  
  // Get the new timestamp
  const newBlock = await ethers.provider.getBlock("latest");
  console.log(`New timestamp: ${newBlock.timestamp} (${new Date(newBlock.timestamp * 1000).toLocaleString()})`);
  console.log(`Advanced time by ${newBlock.timestamp - currentTimestamp} seconds`);
  console.log("All voting periods should now be ended.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 