import React, { useState } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import Alert from './Alert';

const CreateProposal: React.FC = () => {
  const { createProposal } = useBlockchain();
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [durationType, setDurationType] = useState('preset'); // 'preset' or 'custom'
  const [presetDuration, setPresetDuration] = useState('10080'); // 7 days in minutes
  const [customDuration, setCustomDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'error' | 'success' | 'warning' | 'info';
    message: string;
    isVisible: boolean;
  }>({
    type: 'error',
    message: '',
    isVisible: false
  });
  
  // USD price for DTK token (1 DTK = $1)
  const DTK_USD_PRICE = 1;
  
  // Preset duration options (in minutes)
  const presetOptions = [
    { value: '5', label: '5 minutes (Testing)' },
    { value: '30', label: '30 minutes (Testing)' },
    { value: '60', label: '1 hour' },
    { value: '1440', label: '1 day' },
    { value: '4320', label: '3 days' },
    { value: '10080', label: '7 days (Default)' },
    { value: '20160', label: '14 days' },
  ];
  
  // Calculate USD value
  const getUsdValue = (tokenAmount: string) => {
    if (!tokenAmount || isNaN(parseFloat(tokenAmount))) return "0.00";
    const value = parseFloat(tokenAmount) * DTK_USD_PRICE;
    return value.toFixed(2);
  };
  
  // Get the final duration in minutes
  const getFinalDuration = () => {
    if (durationType === 'preset') {
      return parseInt(presetDuration);
    } else {
      return parseInt(customDuration) || 0;
    }
  };
  
  // Format duration for display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} min` : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return `${days} day${days !== 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}` : ''}`;
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !recipient || !amount) {
      setAlert({
        type: 'error',
        message: 'Please fill in all fields',
        isVisible: true
      });
      return;
    }
    
    const duration = getFinalDuration();
    if (duration <= 0) {
      setAlert({
        type: 'error',
        message: 'Please enter a valid voting duration',
        isVisible: true
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createProposal(description, recipient, amount, duration);
      
      // Show success message
      setAlert({
        type: 'success',
        message: 'Proposal created successfully!',
        isVisible: true
      });
      
      // Reset form
      setDescription('');
      setRecipient('');
      setAmount('');
      setDurationType('preset');
      setPresetDuration('10080');
      setCustomDuration('');
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      
      // Check if it's an insufficient deposits error
      if (error.message && error.message.includes('INSUFFICIENT_DEPOSITS:')) {
        const message = error.message.replace('INSUFFICIENT_DEPOSITS:', '');
        setAlert({
          type: 'error',
          message: message,
          isVisible: true
        });
      } else {
        setAlert({
          type: 'error',
          message: 'Failed to create proposal. Please try again.',
          isVisible: true
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <>
      <Alert
        type={alert.type}
        message={alert.message}
        isVisible={alert.isVisible}
        onClose={closeAlert}
      />
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
        
        {/* Voting Duration Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voting Duration
          </label>
          
          {/* Duration Type Selection */}
          <div className="flex space-x-4 mb-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="preset"
                checked={durationType === 'preset'}
                onChange={(e) => setDurationType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Preset</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="custom"
                checked={durationType === 'custom'}
                onChange={(e) => setDurationType(e.target.value)}
                className="mr-2"
              />
              <span className="text-sm">Custom</span>
            </label>
          </div>
          
          {/* Preset Duration Dropdown */}
          {durationType === 'preset' && (
            <select
              value={presetDuration}
              onChange={(e) => setPresetDuration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {presetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {/* Custom Duration Input */}
          {durationType === 'custom' && (
            <div className="relative">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Enter minutes"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">minutes</span>
              </div>
            </div>
          )}
          
          {/* Duration Preview */}
          {getFinalDuration() > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Voting will end in: {formatDuration(getFinalDuration())}
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
    </>
  );
};

export default CreateProposal; 