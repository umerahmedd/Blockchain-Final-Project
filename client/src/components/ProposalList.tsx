import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const ProposalList: React.FC = () => {
  const { proposals, vote, executeProposal, deleteProposal, account, provider } = useBlockchain();
  const [showExecuteInfo, setShowExecuteInfo] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now() / 1000); // Current time in seconds

  // USD price for DTK token (1 DTK = $1)
  const DTK_USD_PRICE = 1;

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now() / 1000);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter out deleted proposals
  const activeProposals = proposals.filter(proposal => !proposal.deleted);

  if (activeProposals.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No proposals have been created yet.</p>
      </div>
    );
  }

  // Function to check if voting period is over based on current time
  const isVotingEnded = (endTime: number) => {
    return currentTime > endTime;
  };

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format time remaining in days, hours, minutes
  const formatTimeRemaining = (endTime: number) => {
    const timeRemaining = endTime - currentTime;
    if (timeRemaining <= 0) return "Ended";
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  // Format token amount with USD value
  const formatTokenAmount = (amount: string) => {
    const tokenAmount = parseFloat(amount);
    const usdValue = tokenAmount * DTK_USD_PRICE;
    return `${tokenAmount.toFixed(2)} DTK ($${usdValue.toFixed(2)})`;
  };

  const toggleExecuteInfo = () => {
    setShowExecuteInfo(!showExecuteInfo);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Proposals</h2>
        <button 
          onClick={toggleExecuteInfo}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <span className="mr-1">What is Execute?</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {showExecuteInfo && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-blue-800 mb-2">About Executing Proposals</h3>
          <p className="text-blue-700 text-sm">
            Execution is the final step in the proposal process. Once the voting period ends (7 days after creation),
            anyone can execute a winning proposal (where "For" votes exceed "Against" votes).
            Executing a proposal transfers the requested tokens from the treasury to the proposal's recipient.
          </p>
        </div>
      )}

      {activeProposals.map((proposal) => {
        const votingEnded = isVotingEnded(proposal.endTime);
        const isWinning = parseFloat(proposal.forVotes) > parseFloat(proposal.againstVotes);
        const isProposer = account && account.toLowerCase() === proposal.proposer.toLowerCase();
        const isOwner = account && account.toLowerCase() === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".toLowerCase();

        return (
          <div key={proposal.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{proposal.description}</h3>
              <div className="flex items-center gap-2">
                {isOwner && !proposal.executed && (
                  <button
                    onClick={() => deleteProposal(proposal.id)}
                    className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    title="Delete Proposal"
                  >
                    🗑️ Delete
                  </button>
                )}
                <span className={`text-sm px-3 py-1 rounded-full ${
                  proposal.executed 
                    ? 'bg-green-100 text-green-800' 
                    : votingEnded 
                      ? isWinning 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {proposal.executed 
                    ? 'Executed' 
                    : votingEnded 
                      ? isWinning 
                        ? 'Ready for Execution' 
                        : 'Rejected'
                      : 'Voting Active'
                  }
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <p className="text-gray-500">Proposer</p>
                <p className="font-medium truncate">
                  {isProposer 
                    ? <span className="text-blue-600">You</span> 
                    : `${proposal.proposer.substring(0, 10)}...`
                  }
                </p>
              </div>
              <div>
                <p className="text-gray-500">Recipient</p>
                <p className="font-medium truncate">{proposal.recipient.substring(0, 10)}...</p>
              </div>
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium">{formatTokenAmount(proposal.amount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Time</p>
                <p className="font-medium">
                  {votingEnded 
                    ? `Ended on ${formatDate(proposal.endTime)}` 
                    : formatTimeRemaining(proposal.endTime)
                  }
                </p>
                <p className="text-xs text-gray-500">
                  Created: {formatDate(proposal.startTime)}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>For: {formatTokenAmount(proposal.forVotes)}</span>
                <span>Against: {formatTokenAmount(proposal.againstVotes)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ 
                    width: `${
                      parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes) > 0
                        ? (parseFloat(proposal.forVotes) / (parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes))) * 100
                        : 0
                    }%` 
                  }}
                ></div>
              </div>
            </div>
            
            {!proposal.executed && (
              <div className="flex flex-wrap gap-2">
                {!votingEnded && !isProposer && (
                  <>
                    <button
                      onClick={() => vote(proposal.id, true)}
                      className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      Vote For
                    </button>
                    <button
                      onClick={() => vote(proposal.id, false)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Vote Against
                    </button>
                  </>
                )}
                {votingEnded && isWinning && (
                  <button
                    onClick={() => executeProposal(proposal.id)}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    Execute
                  </button>
                )}
                {isProposer && (
                  <span className="text-xs text-gray-500 italic">
                    (You created this proposal)
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProposalList; 