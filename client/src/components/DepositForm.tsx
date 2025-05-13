import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const DepositForm: React.FC = () => {
  const { depositTokens, tokenBalance } = useBlockchain();
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  
  // USD price for DTK token (1 DTK = $1)
  const DTK_USD_PRICE = 1;
  
  // Calculate USD value
  const getUsdValue = (tokenAmount: string) => {
    if (!tokenAmount || isNaN(parseFloat(tokenAmount))) return "0.00";
    const value = parseFloat(tokenAmount) * DTK_USD_PRICE;
    return value.toFixed(2);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (parseFloat(amount) > parseFloat(tokenBalance)) {
      alert('Insufficient balance');
      return;
    }
    
    try {
      setIsDepositing(true);
      await depositTokens(amount);
      setAmount('');
    } catch (error) {
      console.error('Error depositing tokens:', error);
    } finally {
      setIsDepositing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="depositAmount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (DTK)
        </label>
        <div className="relative">
          <input
            type="number"
            id="depositAmount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">DTK</span>
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-sm text-gray-500">
            Available: {parseFloat(tokenBalance).toFixed(2)} DTK
          </p>
          {amount && (
            <p className="text-sm text-gray-500">
              ≈ ${getUsdValue(amount)} USD
            </p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAmount((parseFloat(tokenBalance) / 4).toFixed(2))}
          className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
        >
          25%
        </button>
        <button
          type="button"
          onClick={() => setAmount((parseFloat(tokenBalance) / 2).toFixed(2))}
          className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
        >
          50%
        </button>
        <button
          type="button"
          onClick={() => setAmount(tokenBalance)}
          className="flex-1 py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium rounded transition-colors"
        >
          Max
        </button>
      </div>
      
      <button
        type="submit"
        disabled={isDepositing || !amount || parseFloat(amount) <= 0}
        className={`w-full mt-4 py-2 px-4 rounded-md font-medium text-white ${
          isDepositing || !amount || parseFloat(amount) <= 0
            ? 'bg-green-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } transition-colors`}
      >
        {isDepositing ? 'Depositing...' : 'Deposit Tokens'}
      </button>
      
      <p className="mt-2 text-xs text-gray-500 text-center">
        Depositing tokens to the treasury allows you to participate in governance
      </p>
    </form>
  );
};

export default DepositForm; 