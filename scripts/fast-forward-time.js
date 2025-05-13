const { ethers } = require("hardhat");

async function main() {
  const timeToAdvance = process.env.TIME_TO_ADVANCE || 86400; // Default to 1 day (in seconds)
  console.log(`Advancing time by ${timeToAdvance} seconds...`);
  
  // Get current timestamp
  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTimestamp = latestBlock.timestamp;
  console.log(`Current timestamp: ${currentTimestamp} (${new Date(currentTimestamp * 1000).toLocaleString()})`);
  
  // Advance time using evm_increaseTime
  await ethers.provider.send("evm_increaseTime", [parseInt(timeToAdvance)]);
  
  // Mine a new block with the advanced timestamp
  await ethers.provider.send("evm_mine");
  
  // Get the new timestamp
  const newBlock = await ethers.provider.getBlock("latest");
  console.log(`New timestamp: ${newBlock.timestamp} (${new Date(newBlock.timestamp * 1000).toLocaleString()})`);
  console.log(`Advanced time by ${newBlock.timestamp - currentTimestamp} seconds`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 