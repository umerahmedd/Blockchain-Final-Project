import React, { useState, useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const WithdrawForm: React.FC = () => {
  const { 
    withdrawTokens, 
    userDeposits, 
    getWithdrawableAmount, 
    hasActiveProposals 
  } = useBlockchain();
  
  const [amount, setAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawableAmount, setWithdrawableAmount] = useState('0');
  const [hasActive, setHasActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // USD price for DTK token (1 DTK = $1)
  const DTK_USD_PRICE = 1;
  
  // Calculate USD value
  const getUsdValue = (tokenAmount: string) => {
    if (!tokenAmount || isNaN(parseFloat(tokenAmount))) return "0.00";
    const value = parseFloat(tokenAmount) * DTK_USD_PRICE;
    return value.toFixed(2);
  };

  // Fetch withdrawable amount and active proposals status
  useEffect(() => {
    const fetchWithdrawInfo = async () => {
      setIsLoading(true);
      try {
        const [withdrawable, activeProposals] = await Promise.all([
          getWithdrawableAmount(),
          hasActiveProposals()
        ]);
        setWithdrawableAmount(withdrawable);
        setHasActive(activeProposals);
      } catch (error) {
        console.error('Error fetching withdraw info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWithdrawInfo();
  }, [userDeposits]); // Re-fetch when user deposits change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(withdrawableAmount)) {
      alert('Amount exceeds withdrawable balance');
      return;
    }
    
    try {
      setIsWithdrawing(true);
      await withdrawTokens(amount);
      setAmount('');
      
      // Refresh withdrawable amount after successful withdrawal
      const newWithdrawable = await getWithdrawableAmount();
      setWithdrawableAmount(newWithdrawable);
    } catch (error: any) {
      console.error('Error withdrawing tokens:', error);
      
      // Handle specific error messages
      if (error.message?.includes('Cannot withdraw while having active proposals')) {
        alert('Cannot withdraw while you have active proposals. Please wait for them to complete.');
      } else if (error.message?.includes('Withdrawal would violate minimum deposit requirement')) {
        alert('Cannot withdraw this amount as it would violate the minimum deposit requirement for proposal creators.');
      } else if (error.message?.includes('Insufficient deposit balance')) {
        alert('Insufficient deposit balance for this withdrawal.');
      } else {
        alert('Failed to withdraw tokens. Please try again.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getWithdrawStatus = () => {
    if (isLoading) return { message: 'Loading...', color: 'text-gray-500' };
    
    if (hasActive) {
      return { 
        message: 'Cannot withdraw while having active proposals', 
        color: 'text-red-600' 
      };
    }
    
    if (parseFloat(withdrawableAmount) === 0) {
      return { 
        message: 'No withdrawable amount available', 
        color: 'text-orange-600' 
      };
    }
    
    return { 
      message: `${parseFloat(withdrawableAmount).toFixed(2)} DTK available for withdrawal`, 
      color: 'text-green-600' 
    };
  };

  const status = getWithdrawStatus();
  const canWithdraw = !isLoading && !hasActive && parseFloat(withdrawableAmount) > 0;

  return (
    <div className="space-y-4">
      {/* Status Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Withdrawal Status</span>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>
        <p className={`text-sm ${status.color}`}>{status.message}</p>
        
        <div className="mt-3 space-y-1 text-xs text-gray-600">
          <p><strong>Total Deposits:</strong> {parseFloat(userDeposits).toFixed(2)} DTK</p>
          <p><strong>Withdrawable:</strong> {parseFloat(withdrawableAmount).toFixed(2)} DTK</p>
        </div>
      </div>

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="withdrawAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Withdrawal Amount (DTK)
          </label>
          <div className="relative">
            <input
              type="number"
              id="withdrawAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              min="0"
              step="0.01"
              max={withdrawableAmount}
              disabled={!canWithdraw}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 ${
                !canWithdraw ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500">DTK</span>
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-sm text-gray-500">
              Available: {parseFloat(withdrawableAmount).toFixed(2)} DTK
            </p>
            {amount && (
              <p className="text-sm text-gray-500">
                ≈ ${getUsdValue(amount)} USD
              </p>
            )}
          </div>
        </div>
        
        {/* Quick Amount Buttons */}
        {canWithdraw && parseFloat(withdrawableAmount) > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setAmount((parseFloat(withdrawableAmount) / 4).toFixed(2))}
              className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
              disabled={!canWithdraw}
            >
              25%
            </button>
            <button
              type="button"
              onClick={() => setAmount((parseFloat(withdrawableAmount) / 2).toFixed(2))}
              className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
              disabled={!canWithdraw}
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setAmount(withdrawableAmount)}
              className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
              disabled={!canWithdraw}
            >
              Max
            </button>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isWithdrawing || !canWithdraw || !amount || parseFloat(amount) <= 0}
          className={`w-full py-2 px-4 rounded-md font-medium text-white transition-colors ${
            isWithdrawing || !canWithdraw || !amount || parseFloat(amount) <= 0
              ? 'bg-red-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isWithdrawing ? 'Withdrawing...' : 'Withdraw Tokens'}
        </button>
        
        <p className="mt-2 text-xs text-gray-500 text-center">
          {hasActive 
            ? 'Complete your active proposals before withdrawing'
            : 'Withdraw your deposited tokens back to your wallet'
          }
        </p>
      </form>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Withdrawal Rules</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Cannot withdraw while having active proposals</li>
          <li>• Proposal creators must maintain 5000 DTK minimum deposit</li>
          <li>• Users who never created proposals can withdraw everything</li>
        </ul>
      </div>
    </div>
  );
};

export default WithdrawForm; 