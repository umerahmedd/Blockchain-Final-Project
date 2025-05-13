import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const CreateProposal: React.FC = () => {
  const { createProposal } = useBlockchain();
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    
    if (!description || !recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createProposal(description, recipient, amount);
      // Reset form
      setDescription('');
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Error creating proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the proposal"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Address
        </label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (DTK)
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
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
        {amount && (
          <p className="mt-1 text-sm text-gray-500">
            ≈ ${getUsdValue(amount)} USD
          </p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium text-white ${
          isSubmitting 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {isSubmitting ? 'Creating...' : 'Create Proposal'}
      </button>
    </form>
  );
};

export default CreateProposal; 