const { ethers } = require("hardhat");

async function main() {
  // Get the signers (accounts)
  const [owner, account1] = await ethers.getSigners();
  
  // Get the token contract
  const tokenAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.attach(tokenAddress);

  console.log("Account1 address:", account1.address);
  
  // Transfer tokens to account1
  const amount = ethers.parseEther("10000"); // Transfer 10000 tokens
  console.log(`Transferring ${ethers.formatEther(amount)} tokens to account1`);
  
  const tx = await token.transfer(account1.address, amount);
  await tx.wait();
  
  // Check balances
  const ownerBalance = await token.balanceOf(owner.address);
  const account1Balance = await token.balanceOf(account1.address);
  
  console.log("Owner balance:", ethers.formatEther(ownerBalance));
  console.log("Account1 balance:", ethers.formatEther(account1Balance));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 