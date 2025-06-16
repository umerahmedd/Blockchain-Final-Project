import React, { useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import ProposalList from './ProposalList';
import CreateProposal from './CreateProposal';
import DepositForm from './DepositForm';
import WithdrawForm from './WithdrawForm';

const Dashboard: React.FC = () => {
  const { isConnected, treasuryBalance, fetchProposals, tokenBalance, account, userDeposits } = useBlockchain();

  useEffect(() => {
    if (isConnected) {
      fetchProposals();
    }
  }, [isConnected]);

  const handleRefresh = () => {
    console.log("Manual refresh clicked");
    fetchProposals();
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to DAO Treasury</h2>
          <p className="text-gray-600 mb-8">Please connect your wallet to use the application.</p>
          <div className="p-8 bg-white rounded-lg shadow-lg max-w-xl mx-auto">
            <img 
              src="https://www.cdnlogo.com/logos/e/81/ethereum-eth.svg" 
              alt="Ethereum Logo" 
              className="w-32 h-32 mx-auto mb-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://www.cdnlogo.com/logos/e/81/ethereum-eth.svg';
              }}
            />
            <h3 className="text-xl font-semibold mb-4">Decentralized Autonomous Organization</h3>
            <p className="text-gray-600">
              This DAO allows token holders to create and vote on proposals for treasury fund allocation.
              Connect your wallet to participate in governance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Debug Section */}
      {/* <div className="lg:col-span-3 mb-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info:</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Connected Account:</strong> {account || 'Not connected'}</p>
            <p><strong>Token Balance (State):</strong> {tokenBalance} TKN</p>
            <p><strong>Treasury Balance (State):</strong> {treasuryBalance} TKN</p>
            <p><strong>Is Connected:</strong> {isConnected ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div> */}
      
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Treasury Overview</h2>
            <button 
              onClick={handleRefresh}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Refresh Data
            </button>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Treasury Funds</p>
              <p className="text-2xl font-bold text-gray-800">{parseFloat(treasuryBalance).toFixed(2)} TKN</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
            </div>
          </div>
          
          {/* Add User Deposits Section */}
          <div className="bg-purple-50 rounded-lg p-4 mt-4 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Your Total Deposits</p>
              <p className="text-2xl font-bold text-gray-800">{parseFloat(userDeposits).toFixed(2)} DTK</p>
              <p className="text-xs text-gray-500 mt-1">Minimum 5000 DTK required to create proposals</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H4.5m2.25 0v3m0 0v.75A.75.75 0 016 10.5h-.75m0 0V9.375c0-.621.504-1.125 1.125-1.125h.75m0 0V6.75a.75.75 0 01.75-.75h.75m0 0V4.5m0 0h.375c.621 0 1.125.504 1.125 1.125v.75m0 0v3.75m0 0v.75A.75.75 0 0112 10.5h-.75m0 0V9.375c0-.621.504-1.125 1.125-1.125H12m0 0V6.75a.75.75 0 01.75-.75h.75m0 0V4.5m0 0h.375c.621 0 1.125.504 1.125 1.125v.75m0 0v3.75" />
              </svg>
            </div>
          </div>
          
          {/* Add User Token Balance Section */}
          <div className="bg-green-50 rounded-lg p-4 mt-4 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Your Token Balance</p>
              <p className="text-2xl font-bold text-gray-800">{parseFloat(tokenBalance).toFixed(2)} TKN</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Active Proposals</h2>
          <ProposalList />
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Deposit Tokens</h2>
          <DepositForm />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Withdraw Tokens</h2>
          <WithdrawForm />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create Proposal</h2>
          <CreateProposal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 