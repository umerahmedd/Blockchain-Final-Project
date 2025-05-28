const { ethers } = require("hardhat");

async function main() {
  // Get the signers (accounts)
  const [owner] = await ethers.getSigners();
  
  // Get the token contract
  const tokenAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d"; // Updated token address from deployment
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.attach(tokenAddress);

  // Get the second account address from logs
  const secondAccountAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  
  // Transfer tokens to the second account
  const amount = ethers.parseEther("10000"); // Transfer 10000 tokens
  console.log(`Transferring ${ethers.formatEther(amount)} tokens to ${secondAccountAddress}`);
  
  const tx = await token.transfer(secondAccountAddress, amount);
  await tx.wait();
  
  // Check balances
  const ownerBalance = await token.balanceOf(owner.address);
  const recipientBalance = await token.balanceOf(secondAccountAddress);
  
  console.log("Owner balance:", ethers.formatEther(ownerBalance));
  console.log("Second account balance:", ethers.formatEther(recipientBalance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 