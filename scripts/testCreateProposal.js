const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  
  // Get the DAO Treasury contract
  const treasuryAddress = "0x0B306BF915C4d645ff596e518fAf3F9669b97016";
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = await DAOTreasury.attach(treasuryAddress);
  
  console.log("Treasury contract attached to:", treasuryAddress);
  console.log("Owner address:", owner.address);
  
  // Check available functions
  console.log("Available functions:");
  const interface = treasury.interface;
  if (interface && interface.functions) {
    const functions = Object.keys(interface.functions);
    functions.forEach(func => {
      console.log("-", func);
    });
  } else {
    console.log("Interface not available");
  }
  
  // Test the 4-parameter createProposal function
  try {
    console.log("\nTesting 4-parameter createProposal function...");
    const tx = await treasury['createProposal(string,address,uint256,uint256)'](
      "Test proposal with custom duration",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      ethers.parseEther("100"),
      5 // 5 minutes
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Proposal created successfully!");
    
    // Check proposal count
    const count = await treasury.proposalCount();
    console.log("New proposal count:", count.toString());
    
  } catch (error) {
    console.error("Error creating proposal:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 