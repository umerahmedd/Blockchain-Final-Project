const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Minting tokens with account:", deployer.address);
  
  // Get recipient address from environment variable
  const recipient = process.env.RECIPIENT_ADDRESS;
  if (!recipient || !ethers.isAddress(recipient)) {
    console.error("Please provide a valid recipient address");
    process.exit(1);
  }

  console.log(`Sending tokens to: ${recipient}`);

  // Get token contract
  const Token = await ethers.getContractFactory("MyToken");
  const token = await Token.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  try {
    // Get token name and symbol
    const name = await token.name();
    const symbol = await token.symbol();
    console.log(`Token: ${name} (${symbol})`);
    
    // Get balance before
    const balanceBefore = await token.balanceOf(recipient);
    console.log(`Recipient's balance before: ${ethers.formatEther(balanceBefore)} ${symbol}`);
    
    // Mint tokens
    const amount = ethers.parseEther("10000");
    const tx = await token.transfer(recipient, amount);
    await tx.wait();
    console.log(`Transaction hash: ${tx.hash}`);
    
    // Get balance after
    const balanceAfter = await token.balanceOf(recipient);
    console.log(`Recipient's balance after: ${ethers.formatEther(balanceAfter)} ${symbol}`);
    console.log(`Successfully sent 10000 ${symbol} to ${recipient}`);
  } catch (error) {
    console.error("Error minting tokens:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 