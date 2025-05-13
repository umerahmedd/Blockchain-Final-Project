const { ethers } = require("hardhat");

async function main() {
  // Get all signers
  const signers = await ethers.getSigners();
  
  // Find the signer with the specific address we want
  const secondAccountAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  
  // Find the signer with the matching address
  let secondAccount = null;
  for (const signer of signers) {
    if (await signer.getAddress() === secondAccountAddress) {
      secondAccount = signer;
      break;
    }
  }
  
  if (!secondAccount) {
    console.error(`Account ${secondAccountAddress} not found among available signers.`);
    // Print available signers for debugging
    console.log("Available signers:");
    for (let i = 0; i < signers.length; i++) {
      console.log(`${i}: ${await signers[i].getAddress()}`);
    }
    process.exit(1);
  }
  
  console.log("Creating proposal from account:", await secondAccount.getAddress());
  
  // Get the DAO Treasury contract
  const treasuryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Treasury address from deployment
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = DAOTreasury.connect(secondAccount).attach(treasuryAddress);
  
  // Create a proposal
  const description = "Test proposal from account 2";
  const recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Another account
  const amount = ethers.parseEther("100"); // 100 tokens
  
  console.log(`Creating proposal: "${description}" to send ${ethers.formatEther(amount)} tokens to ${recipient}`);
  
  // First approve tokens for the treasury
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Token address from deployment
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = MyToken.connect(secondAccount).attach(tokenAddress);
  
  // Check token balance first
  const balance = await token.balanceOf(secondAccountAddress);
  console.log("Token balance of second account:", ethers.formatEther(balance));
  
  // First deposit some tokens to the treasury
  const depositAmount = ethers.parseEther("1000");
  console.log(`Approving ${ethers.formatEther(depositAmount)} tokens for the treasury...`);
  
  const approveTx = await token.approve(treasuryAddress, depositAmount);
  await approveTx.wait();
  console.log("Tokens approved");
  
  console.log(`Depositing ${ethers.formatEther(depositAmount)} tokens to the treasury...`);
  const depositTx = await treasury.deposit(depositAmount);
  await depositTx.wait();
  console.log("Tokens deposited");
  
  // Now create the proposal
  console.log("Creating proposal...");
  const proposalTx = await treasury.createProposal(description, recipient, amount);
  await proposalTx.wait();
  
  // Get the proposal count to confirm
  const proposalCount = await treasury.proposalCount();
  console.log("New proposal count:", proposalCount.toString());
  
  console.log("Proposal created successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 