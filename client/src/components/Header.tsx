import React from 'react';
import { useBlockchain } from '../context/BlockchainContext';

const Header: React.FC = () => {
  const { 
    account, 
    isConnected, 
    connectWallet, 
    tokenBalance, 
    networkName
  } = useBlockchain();

  // USD price for DTK token (1 DTK = $1)
  const DTK_USD_PRICE = 1;

  // Calculate USD value of token balance
  const getUsdValue = (tokenAmount: string) => {
    const balance = parseFloat(tokenAmount);
    const usdValue = balance * DTK_USD_PRICE;
    return usdValue.toFixed(2);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800 mr-4">DAO Treasury</h1>
            {networkName && (
              <div className="mr-4 text-xs py-1 px-3 bg-gray-100 rounded-full">
                <span className="font-medium text-gray-600">
                  {networkName}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center">
                <div className="mr-4 text-sm py-2 px-4 bg-green-100 rounded-md">
                  <span className="text-gray-600">Balance: </span>
                  <span className="font-medium text-gray-800">
                    {parseFloat(tokenBalance).toFixed(2)} DTK 
                    <span className="text-gray-500 text-xs ml-1">(${getUsdValue(tokenBalance)})</span>
                  </span>
                </div>
                <div className="text-sm py-2 px-4 bg-blue-100 rounded-md">
                  <span className="font-medium text-gray-800">{account?.substring(0, 6)}...{account?.substring(account.length - 4)}</span>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 