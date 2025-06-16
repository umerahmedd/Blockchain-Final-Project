// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAOTreasury is Ownable {
    IERC20 public token;
    uint256 public proposalCount;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address recipient;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool deleted;  // New field to mark proposals as deleted
        mapping(address => bool) voted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public userDeposits; // Track individual user deposits
    
    uint256 public constant MINIMUM_TOKENS = 1000 * 10 ** 18; // 1000 tokens for voting
    uint256 public constant MINIMUM_DEPOSIT_FOR_PROPOSAL = 5000 * 10 ** 18; // 5000 tokens deposited to create proposals
    uint256 public constant VOTING_PERIOD = 7 days; // 7 days in seconds

    event Deposited(address indexed sender, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description, address recipient, uint256 amount);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);
    event ProposalDeleted(uint256 indexed proposalId);
    event Withdrawn(address indexed user, uint256 amount);

    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Track user's total deposits
        userDeposits[msg.sender] += amount;
        
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(userDeposits[msg.sender] >= amount, "Insufficient deposit balance");
        
        // Check if user has any active proposals they created
        require(!hasActiveProposals(msg.sender), "Cannot withdraw while having active proposals");
        
        // Ensure withdrawal doesn't violate minimum deposit requirement for existing proposals
        uint256 remainingDeposit = userDeposits[msg.sender] - amount;
        if (hasCreatedAnyProposal(msg.sender)) {
            require(remainingDeposit >= MINIMUM_DEPOSIT_FOR_PROPOSAL, 
                "Withdrawal would violate minimum deposit requirement for proposal creation");
        }
        
        // Update user's deposit balance
        userDeposits[msg.sender] -= amount;
        
        // Transfer tokens back to user
        require(token.transfer(msg.sender, amount), "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }

    function hasActiveProposals(address user) public view returns (bool) {
        for (uint256 i = 1; i <= proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            if (proposal.proposer == user && 
                !proposal.executed && 
                !proposal.deleted && 
                block.timestamp <= proposal.endTime) {
                return true;
            }
        }
        return false;
    }

    function hasCreatedAnyProposal(address user) public view returns (bool) {
        for (uint256 i = 1; i <= proposalCount; i++) {
            Proposal storage proposal = proposals[i];
            if (proposal.proposer == user && !proposal.deleted) {
                return true;
            }
        }
        return false;
    }

    function getWithdrawableAmount(address user) external view returns (uint256) {
        uint256 totalDeposit = userDeposits[user];
        
        // If user has active proposals, they cannot withdraw anything
        if (hasActiveProposals(user)) {
            return 0;
        }
        
        // If user has created any proposals (even executed ones), 
        // they must maintain minimum deposit
        if (hasCreatedAnyProposal(user)) {
            if (totalDeposit <= MINIMUM_DEPOSIT_FOR_PROPOSAL) {
                return 0;
            }
            return totalDeposit - MINIMUM_DEPOSIT_FOR_PROPOSAL;
        }
        
        // If user never created proposals, they can withdraw everything
        return totalDeposit;
    }

    function createProposal(string memory description, address recipient, uint256 amount) external {
        createProposal(description, recipient, amount, 7 * 24 * 60); // 7 days in minutes
    }

    function createProposal(string memory description, address recipient, uint256 amount, uint256 votingDurationMinutes) public {
        require(token.balanceOf(msg.sender) >= MINIMUM_TOKENS, "Insufficient tokens to vote");
        require(userDeposits[msg.sender] >= MINIMUM_DEPOSIT_FOR_PROPOSAL, "Must deposit at least 5000 DTK to create proposals");
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(votingDurationMinutes > 0, "Voting duration must be greater than 0");

        // Convert minutes to seconds
        uint256 votingDurationSeconds = votingDurationMinutes * 60;

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.recipient = recipient;
        proposal.amount = amount;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingDurationSeconds;
        proposal.executed = false;
        proposal.deleted = false;

        emit ProposalCreated(proposalCount, msg.sender, description, recipient, amount);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.deleted, "Proposal has been deleted");
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.voted[msg.sender], "Already voted");
        require(msg.sender != proposal.proposer, "Cannot vote on own proposal");

        uint256 voterBalance = token.balanceOf(msg.sender);
        require(voterBalance > 0, "No tokens to vote");

        proposal.voted[msg.sender] = true;
        if (support) {
            proposal.forVotes += voterBalance;
        } else {
            proposal.againstVotes += voterBalance;
        }

        emit Voted(proposalId, msg.sender, support, voterBalance);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.deleted, "Proposal has been deleted");
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal not approved");
        require(token.balanceOf(address(this)) >= proposal.amount, "Insufficient treasury balance");

        proposal.executed = true;
        require(token.transfer(proposal.recipient, proposal.amount), "Transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    // New function to delete a proposal (owner only)
    function deleteProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(!proposal.executed, "Cannot delete executed proposal");
        require(!proposal.deleted, "Proposal already deleted");
        
        proposal.deleted = true;
        emit ProposalDeleted(proposalId);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getUserDeposits(address user) external view returns (uint256) {
        return userDeposits[user];
    }

    function getMinimumDepositForProposal() external pure returns (uint256) {
        return MINIMUM_DEPOSIT_FOR_PROPOSAL;
    }
}