const { ethers } = require("hardhat");

async function main() {
  // Get current timestamp in seconds
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(`Setting blockchain time to current time: ${currentTime} (${new Date(currentTime * 1000).toLocaleString()})`);
  
  // Get current blockchain timestamp
  const latestBlock = await ethers.provider.getBlock("latest");
  const blockchainTime = latestBlock.timestamp;
  console.log(`Current blockchain timestamp: ${blockchainTime} (${new Date(blockchainTime * 1000).toLocaleString()})`);
  
  // Calculate time difference
  const timeDiff = currentTime - blockchainTime;
  console.log(`Time difference: ${timeDiff} seconds (${timeDiff / 86400} days)`);
  
  if (timeDiff <= 0) {
    console.log("Blockchain time is already current or ahead. No need to advance time.");
    return;
  }
  
  // Advance time using evm_increaseTime
  await ethers.provider.send("evm_increaseTime", [timeDiff]);
  
  // Mine a new block with the advanced timestamp
  await ethers.provider.send("evm_mine");
  
  // Verify the new timestamp
  const newBlock = await ethers.provider.getBlock("latest");
  console.log(`New blockchain timestamp: ${newBlock.timestamp} (${new Date(newBlock.timestamp * 1000).toLocaleString()})`);
  console.log(`Time synchronized successfully!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 