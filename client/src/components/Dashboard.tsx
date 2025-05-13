import React, { useEffect } from 'react';
import { useBlockchain } from '../context/BlockchainContext';
import ProposalList from './ProposalList';
import CreateProposal from './CreateProposal';
import DepositForm from './DepositForm';

const Dashboard: React.FC = () => {
  const { isConnected, treasuryBalance, fetchProposals } = useBlockchain();

  useEffect(() => {
    if (isConnected) {
      fetchProposals();
    }
  }, [isConnected, fetchProposals]);

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
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Treasury Overview</h2>
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
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Create Proposal</h2>
          <CreateProposal />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 