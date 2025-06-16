# Withdraw Deposits Feature Implementation

## Overview

The Withdraw Deposits feature allows users to withdraw their deposited tokens from the DAO Treasury contract while maintaining the integrity of the governance system. This implementation includes several safety mechanisms to prevent abuse and ensure the DAO continues to function properly.

## Key Features

1. **Secure Withdrawal**: Users can withdraw their deposited tokens with proper validation
2. **Active Proposal Protection**: Users cannot withdraw if they have active proposals
3. **Minimum Deposit Enforcement**: Users who have created proposals must maintain minimum deposit
4. **Withdrawable Amount Calculator**: Helper function to check how much a user can withdraw

## Implementation Details

### 1. New Event Added

```solidity
event Withdrawn(address indexed user, uint256 amount);
```

**Purpose**: Emitted when a user successfully withdraws tokens from their deposit balance.

**Parameters**:
- `user`: Address of the user withdrawing tokens
- `amount`: Amount of tokens withdrawn

### 2. Main Withdrawal Function

```solidity
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
```

**Security Checks**:
1. **Amount Validation**: Ensures withdrawal amount is greater than 0
2. **Balance Check**: Verifies user has sufficient deposit balance
3. **Active Proposal Check**: Prevents withdrawal if user has active proposals
4. **Minimum Deposit Enforcement**: Ensures users who created proposals maintain minimum deposit

**Process Flow**:
1. Validate input parameters
2. Check user's deposit balance
3. Verify no active proposals exist
4. Check minimum deposit requirements
5. Update user's deposit balance
6. Transfer tokens to user
7. Emit withdrawal event

### 3. Active Proposals Checker

```solidity
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
```

**Purpose**: Checks if a user has any active (ongoing) proposals.

**Logic**:
- Iterates through all proposals
- Checks if user is the proposer
- Verifies proposal is not executed or deleted
- Confirms voting period hasn't ended
- Returns `true` if any active proposal is found

### 4. Proposal History Checker

```solidity
function hasCreatedAnyProposal(address user) public view returns (bool) {
    for (uint256 i = 1; i <= proposalCount; i++) {
        Proposal storage proposal = proposals[i];
        if (proposal.proposer == user && !proposal.deleted) {
            return true;
        }
    }
    return false;
}
```

**Purpose**: Checks if a user has ever created any proposals (including executed ones).

**Logic**:
- Iterates through all proposals
- Checks if user is the proposer
- Excludes deleted proposals
- Returns `true` if user has created any proposal

### 5. Withdrawable Amount Calculator

```solidity
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
```

**Purpose**: Calculates the maximum amount a user can withdraw based on their status.

**Logic Flow**:
1. **Active Proposals**: If user has active proposals → withdrawable = 0
2. **Has Created Proposals**: If user created proposals → withdrawable = total - minimum required
3. **Never Created Proposals**: If user never created proposals → withdrawable = total deposit

## Business Rules

### Withdrawal Restrictions

1. **Active Proposal Restriction**: 
   - Users with active proposals cannot withdraw any amount
   - Prevents abandonment of ongoing proposals

2. **Minimum Deposit Maintenance**:
   - Users who have created proposals must maintain `MINIMUM_DEPOSIT_FOR_PROPOSAL` (5000 DTK)
   - Applies even to executed proposals to maintain accountability

3. **Full Withdrawal for Non-Proposers**:
   - Users who never created proposals can withdraw their entire deposit
   - No restrictions for passive participants

### Security Considerations

1. **Reentrancy Protection**: 
   - State updates before external calls
   - Uses `require` statements for validation

2. **Integer Overflow Protection**:
   - Solidity 0.8.0+ built-in overflow protection
   - Explicit balance checks before subtraction

3. **Access Control**:
   - Only users can withdraw their own deposits
   - No admin override for withdrawals

## Usage Examples

### Example 1: Regular User Withdrawal
```solidity
// User with 10000 DTK deposited, never created proposals
// Can withdraw full amount
uint256 withdrawable = treasury.getWithdrawableAmount(userAddress); // Returns 10000
treasury.withdraw(5000); // Withdraws 5000 DTK successfully
```

### Example 2: Proposal Creator Withdrawal
```solidity
// User with 8000 DTK deposited, created proposals before
// Must maintain 5000 DTK minimum
uint256 withdrawable = treasury.getWithdrawableAmount(userAddress); // Returns 3000
treasury.withdraw(3000); // Withdraws 3000 DTK, leaves 5000 DTK
```

### Example 3: Active Proposal Restriction
```solidity
// User with active proposal
uint256 withdrawable = treasury.getWithdrawableAmount(userAddress); // Returns 0
treasury.withdraw(1000); // Fails: "Cannot withdraw while having active proposals"
```

## Gas Optimization Notes

The implementation includes loops in `hasActiveProposals` and `hasCreatedAnyProposal` functions. For large numbers of proposals, this could become gas-intensive. Future optimizations could include:

1. **Proposal Indexing**: Maintain separate mappings for user proposals
2. **Pagination**: Implement paginated proposal checking
3. **State Caching**: Cache proposal states to reduce computation

## Testing Recommendations

1. **Basic Functionality**: Test successful withdrawals
2. **Restriction Testing**: Test all withdrawal restrictions
3. **Edge Cases**: Test boundary conditions (exact minimum amounts)
4. **Security Testing**: Test reentrancy and overflow scenarios
5. **Gas Testing**: Test with large numbers of proposals

## Integration Notes

This feature integrates seamlessly with existing contract functionality:
- Uses existing `userDeposits` mapping
- Leverages existing proposal structure
- Maintains all existing security patterns
- Adds new event for transparency

The implementation maintains backward compatibility and doesn't affect existing contract functionality. 