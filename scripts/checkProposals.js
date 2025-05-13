const { ethers } = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  
  // Define both accounts
  const account1Address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const account2Address = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  
  // Get the DAO Treasury contract
  const treasuryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
  const treasury = await DAOTreasury.attach(treasuryAddress);
  
  // Get token contract
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.attach(tokenAddress);
  
  // Check proposal count
  const proposalCount = await treasury.proposalCount();
  console.log(`Total proposals on chain: ${proposalCount}`);
  
  // Get treasury state
  const treasuryBalance = await token.balanceOf(treasuryAddress);
  console.log(`Treasury balance: ${ethers.formatEther(treasuryBalance)}`);
  
  // Check all proposals
  for (let i = 1; i <= Number(proposalCount); i++) {
    try {
      const proposal = await treasury.proposals(i);
      console.log(`\nProposal ${i}:`);
      console.log(`- Proposer: ${proposal.proposer}`);
      console.log(`- Description: ${proposal.description}`);
      console.log(`- Recipient: ${proposal.recipient}`);
      console.log(`- Amount: ${ethers.formatEther(proposal.amount)}`);
      console.log(`- Start time: ${new Date(Number(proposal.startTime) * 1000).toLocaleString()}`);
      console.log(`- End time: ${new Date(Number(proposal.endTime) * 1000).toLocaleString()}`);
      console.log(`- For votes: ${ethers.formatEther(proposal.forVotes)}`);
      console.log(`- Against votes: ${ethers.formatEther(proposal.againstVotes)}`);
      console.log(`- Executed: ${proposal.executed}`);
      console.log(`- Deleted: ${proposal.deleted}`);
    } catch (error) {
      console.error(`Error fetching proposal ${i}:`, error.message);
    }
  }
  
  // Check if account1 created a proposal from the events
  console.log("\nChecking ProposalCreated events:");
  const filter = treasury.filters.ProposalCreated();
  const events = await treasury.queryFilter(filter);
  
  console.log(`Found ${events.length} ProposalCreated events`);
  
  for (const event of events) {
    console.log("\nEvent details:");
    console.log(`- Proposal ID: ${event.args.proposalId}`);
    console.log(`- Proposer: ${event.args.proposer}`);
    console.log(`- Description: ${event.args.description}`);
    console.log(`- Recipient: ${event.args.recipient}`);
    console.log(`- Amount: ${ethers.formatEther(event.args.amount)}`);
    
    // Check which block this event was emitted in
    const block = await ethers.provider.getBlock(event.blockNumber);
    console.log(`- Block number: ${event.blockNumber}`);
    console.log(`- Block timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 