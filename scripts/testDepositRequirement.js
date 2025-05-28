const { ethers } = require("hardhat");

async function main() {
  const [owner, account1] = await ethers.getSigners();
  
  // Get contract addresses
  const tokenAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
  const treasuryAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b";
  
  // Get contracts
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.attach(tokenAddress);
  
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = await DAOTreasury.attach(treasuryAddress);
  
  console.log("=== Testing Deposit Requirement ===");
  console.log("Token address:", tokenAddress);
  console.log("Treasury address:", treasuryAddress);
  console.log("Account1 address:", account1.address);
  
  // Check minimum deposit requirement
  const minDeposit = await treasury.getMinimumDepositForProposal();
  console.log("Minimum deposit required:", ethers.formatEther(minDeposit), "DTK");
  
  // Check account1's current deposits
  let userDeposits = await treasury.getUserDeposits(account1.address);
  console.log("Account1 current deposits:", ethers.formatEther(userDeposits), "DTK");
  
  // Check account1's token balance
  const balance = await token.balanceOf(account1.address);
  console.log("Account1 token balance:", ethers.formatEther(balance), "DTK");
  
  // Try to create proposal without sufficient deposits (should fail)
  console.log("\n=== Testing Proposal Creation Without Deposits ===");
  try {
    const tx = await treasury.connect(account1)['createProposal(string,address,uint256,uint256)'](
      "Test proposal without deposits",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ethers.parseEther("100"),
      5 // 5 minutes
    );
    console.log("ERROR: Proposal creation should have failed!");
  } catch (error) {
    console.log("✓ Proposal creation correctly failed:", error.reason || error.message);
  }
  
  // Deposit some tokens (but less than required)
  console.log("\n=== Testing Insufficient Deposit ===");
  const insufficientAmount = ethers.parseEther("3000"); // Less than 5000 required
  
  // First approve
  await token.connect(account1).approve(treasuryAddress, insufficientAmount);
  console.log("Approved", ethers.formatEther(insufficientAmount), "DTK for deposit");
  
  // Then deposit
  await treasury.connect(account1).deposit(insufficientAmount);
  console.log("Deposited", ethers.formatEther(insufficientAmount), "DTK");
  
  // Check deposits again
  userDeposits = await treasury.getUserDeposits(account1.address);
  console.log("Account1 deposits after insufficient deposit:", ethers.formatEther(userDeposits), "DTK");
  
  // Try to create proposal with insufficient deposits (should still fail)
  try {
    const tx = await treasury.connect(account1)['createProposal(string,address,uint256,uint256)'](
      "Test proposal with insufficient deposits",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ethers.parseEther("100"),
      5 // 5 minutes
    );
    console.log("ERROR: Proposal creation should have failed!");
  } catch (error) {
    console.log("✓ Proposal creation correctly failed with insufficient deposits:", error.reason || error.message);
  }
  
  // Deposit sufficient tokens
  console.log("\n=== Testing Sufficient Deposit ===");
  const additionalAmount = ethers.parseEther("2500"); // Total will be 5500 DTK
  
  // Approve and deposit additional amount
  await token.connect(account1).approve(treasuryAddress, additionalAmount);
  await treasury.connect(account1).deposit(additionalAmount);
  console.log("Deposited additional", ethers.formatEther(additionalAmount), "DTK");
  
  // Check final deposits
  userDeposits = await treasury.getUserDeposits(account1.address);
  console.log("Account1 total deposits:", ethers.formatEther(userDeposits), "DTK");
  
  // Now try to create proposal (should succeed)
  try {
    const tx = await treasury.connect(account1)['createProposal(string,address,uint256,uint256)'](
      "Test proposal with sufficient deposits",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ethers.parseEther("100"),
      5 // 5 minutes
    );
    await tx.wait();
    console.log("✓ Proposal created successfully!");
    
    // Check proposal count
    const count = await treasury.proposalCount();
    console.log("Total proposals:", count.toString());
  } catch (error) {
    console.log("ERROR: Proposal creation failed:", error.reason || error.message);
  }
  
  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 