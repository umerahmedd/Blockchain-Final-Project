// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAOTreasury {
    IERC20 public token;
    uint256 public proposalCount;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        address recipient;
        uint256 amount;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        mapping(address => bool) voted;
    }

    mapping(uint256 => Proposal) public proposals;
    uint256 public constant MINIMUM_TOKENS = 1000 * 10 ** 18; // 1000 tokens
    uint256 public constant VOTING_PERIOD = 40320; // ~7 days (15s blocks)

    event Deposited(address indexed sender, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address proposer, string description, address recipient, uint256 amount);
    event Voted(uint256 indexed proposalId, address voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId, address recipient, uint256 amount);

    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposited(msg.sender, amount);
    }

    function createProposal(string memory description, address recipient, uint256 amount) external {
        require(token.balanceOf(msg.sender) >= MINIMUM_TOKENS, "Insufficient tokens to propose");
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.recipient = recipient;
        proposal.amount = amount;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + VOTING_PERIOD;
        proposal.executed = false;

        emit ProposalCreated(proposalCount, msg.sender, description, recipient, amount);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.id != 0, "Proposal does not exist");
        require(block.number <= proposal.endBlock, "Voting period ended");
        require(!proposal.voted[msg.sender], "Already voted");

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
        require(block.number > proposal.endBlock, "Voting period not ended");
        require(!proposal.executed, "Proposal already executed");
        require(proposal.forVotes > proposal.againstVotes, "Proposal not approved");
        require(token.balanceOf(address(this)) >= proposal.amount, "Insufficient treasury balance");

        proposal.executed = true;
        require(token.transfer(proposal.recipient, proposal.amount), "Transfer failed");

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    function getTreasuryBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}