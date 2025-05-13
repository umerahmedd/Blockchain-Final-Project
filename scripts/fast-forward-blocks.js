const { ethers } = require("hardhat");

async function main() {
  const numBlocks = process.argv[2] || 100;
  console.log(`Mining ${numBlocks} blocks...`);
  
  for (let i = 0; i < numBlocks; i++) {
    // Use evm_mine to mine blocks
    await ethers.provider.send("evm_mine");
    
    // Log progress for every 10 blocks
    if (i % 10 === 0) {
      const blockNumber = await ethers.provider.getBlockNumber();
      console.log(`Current block number: ${blockNumber}`);
    }
  }
  
  const finalBlockNumber = await ethers.provider.getBlockNumber();
  console.log(`Done! Final block number: ${finalBlockNumber}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 