import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import MyTokenABI from '../contracts/MyToken.json';
import DAOTreasuryABI from '../contracts/DAOTreasury.json';
import deploymentInfo from '../contracts/deployment.json';

// Network configuration
const LOCAL_CHAIN_ID = '0x7a69';     // Hex for 31337 (Hardhat's default chainId)

interface BlockchainContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  isConnected: boolean;
  tokenContract: ethers.Contract | null;
  treasuryContract: ethers.Contract | null;
  tokenBalance: string;
  treasuryBalance: string;
  userDeposits: string;
  proposals: any[];
  connectWallet: () => Promise<void>;
  fetchProposals: () => Promise<void>;
  createProposal: (description: string, recipient: string, amount: string, durationMinutes?: number) => Promise<void>;
  vote: (proposalId: number, support: boolean) => Promise<void>;
  executeProposal: (proposalId: number) => Promise<void>;
  depositTokens: (amount: string) => Promise<void>;
  deleteProposal: (proposalId: number) => Promise<void>;
  networkName: string;
}

const defaultContextValue: BlockchainContextType = {
  provider: null,
  signer: null,
  account: null,
  isConnected: false,
  tokenContract: null,
  treasuryContract: null,
  tokenBalance: "0",
  treasuryBalance: "0",
  userDeposits: "0",
  proposals: [],
  connectWallet: async () => {},
  fetchProposals: async () => {},
  createProposal: async () => {},
  vote: async () => {},
  executeProposal: async () => {},
  depositTokens: async () => {},
  deleteProposal: async () => {},
  networkName: "",
};

const BlockchainContext = createContext<BlockchainContextType>(defaultContextValue);

export const useBlockchain = () => useContext(BlockchainContext);

interface BlockchainProviderProps {
  children: ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [treasuryContract, setTreasuryContract] = useState<ethers.Contract | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [treasuryBalance, setTreasuryBalance] = useState<string>("0");
  const [userDeposits, setUserDeposits] = useState<string>("0");
  const [proposals, setProposals] = useState<any[]>([]);
  const [networkName, setNetworkName] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [proposalFetchTimer, setProposalFetchTimer] = useState<NodeJS.Timeout | null>(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        console.log("Connecting wallet...");
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get current network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log("Current chainId:", chainId);
        
        // If not on local network, ask to switch
        if (chainId !== LOCAL_CHAIN_ID) {
          console.log("Not on local network, attempting to switch...");
          try {
            // Try to switch to local network
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: LOCAL_CHAIN_ID }],
            });
          } catch (switchError: any) {
            console.log("Switch error:", switchError);
            // If local network is not added to MetaMask, add it
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: LOCAL_CHAIN_ID,
                      chainName: 'Hardhat Local',
                      nativeCurrency: {
                        name: 'Ethereum',
                        symbol: 'ETH',
                        decimals: 18,
                      },
                      rpcUrls: ['http://127.0.0.1:8545/'],
                    },
                  ],
                });
              } catch (addError) {
                console.error("Failed to add local network to MetaMask", addError);
                alert("Failed to add local network to MetaMask. Make sure your local node is running at http://127.0.0.1:8545");
              }
            } else {
              console.error("Failed to switch to local network", switchError);
              alert("Failed to switch to local network. Make sure your local node is running.");
            }
          }
        }
        
        // Create provider and signer
        console.log("Creating provider and signer...");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);
        
        // Get network information
        const network = await provider.getNetwork();
        console.log("Network:", network);
        setNetworkName(network.name === 'unknown' ? 'Local Network' : network.name);
        
        const signer = provider.getSigner();
        setSigner(signer);
        
        const account = await signer.getAddress();
        console.log("Connected account:", account);
        setAccount(account);
        setIsConnected(true);
        
        // Initialize contracts using deployment info
        console.log("Initializing contracts...");
        console.log("Token address:", deploymentInfo.tokenAddress);
        console.log("Treasury address:", deploymentInfo.treasuryAddress);
        
        const tokenContract = new ethers.Contract(
          deploymentInfo.tokenAddress,
          MyTokenABI.abi,
          signer
        );
        setTokenContract(tokenContract);
        
        const treasuryContract = new ethers.Contract(
          deploymentInfo.treasuryAddress,
          DAOTreasuryABI.abi,
          signer
        );
        setTreasuryContract(treasuryContract);
        
        // Fetch balances after contract initialization is confirmed
        if (account && tokenContract && treasuryContract) {
          console.log("Contract initialization completed, fetching balances...");
          await fetchBalances(account, tokenContract, treasuryContract);
          console.log("Balances fetched, now fetching proposals...");
          // Slight delay to ensure contracts are fully initialized
          setTimeout(() => {
            fetchProposals();
          }, 500);
        }
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert("Please install MetaMask to use this dApp!");
    }
  };

  const fetchBalances = async (
    account: string, 
    tokenContract: ethers.Contract, 
    treasuryContract: ethers.Contract
  ) => {
    try {
      console.log("=== FETCHING BALANCES ===");
      console.log("Fetching balance for account:", account);
      console.log("Token contract address:", tokenContract.address);
      console.log("Treasury contract address:", treasuryContract.address);
      
      const balance = await tokenContract.balanceOf(account);
      console.log("Raw token balance (BigNumber):", balance);
      console.log("Raw token balance (string):", balance.toString());
      
      const formattedBalance = ethers.utils.formatEther(balance);
      console.log("Formatted token balance:", formattedBalance);
      setTokenBalance(formattedBalance);
      console.log("Token balance set in state:", formattedBalance);
      
      console.log("Fetching treasury balance");
      const treasuryBalance = await treasuryContract.getTreasuryBalance();
      console.log("Raw treasury balance (BigNumber):", treasuryBalance);
      console.log("Raw treasury balance (string):", treasuryBalance.toString());
      
      const formattedTreasuryBalance = ethers.utils.formatEther(treasuryBalance);
      console.log("Formatted treasury balance:", formattedTreasuryBalance);
      setTreasuryBalance(formattedTreasuryBalance);
      console.log("Treasury balance set in state:", formattedTreasuryBalance);
      
      console.log("Fetching user deposits");
      const userDepositsAmount = await treasuryContract.getUserDeposits(account);
      console.log("Raw user deposits (BigNumber):", userDepositsAmount);
      console.log("Raw user deposits (string):", userDepositsAmount.toString());
      
      const formattedUserDeposits = ethers.utils.formatEther(userDepositsAmount);
      console.log("Formatted user deposits:", formattedUserDeposits);
      setUserDeposits(formattedUserDeposits);
      console.log("User deposits set in state:", formattedUserDeposits);
      
      console.log("=== BALANCE FETCHING COMPLETE ===");
    } catch (error: any) {
      console.error("Error fetching balances:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
  };

  // Effect for fetching proposals when treasury contract changes
  useEffect(() => {
    let mounted = true;
    
    const initialFetch = async () => {
      if (treasuryContract && !isFetching && mounted) {
        try {
          setIsFetching(true);
          console.log("Initial fetch triggered by useEffect");
          
          const proposalCount = await treasuryContract.proposalCount();
          console.log("Raw proposal count:", proposalCount);
          const count = Number(proposalCount);
          console.log("Total proposals (as number):", count);
          
          if (!mounted) return;
          
          const fetchedProposals = [];
          for (let i = 1; i <= count; i++) {
            if (!mounted) break;
            console.log(`Fetching proposal ${i}...`);
            try {
              const proposal = await treasuryContract.proposals(i);
              console.log(`Raw proposal ${i} data:`, proposal);
              fetchedProposals.push({
                id: Number(proposal.id),
                proposer: proposal.proposer,
                description: proposal.description,
                recipient: proposal.recipient,
                amount: ethers.utils.formatEther(proposal.amount),
                startTime: Number(proposal.startTime),
                endTime: Number(proposal.endTime),
                forVotes: ethers.utils.formatEther(proposal.forVotes),
                againstVotes: ethers.utils.formatEther(proposal.againstVotes),
                executed: proposal.executed,
                deleted: proposal.deleted
              });
              console.log(`Processed proposal ${i}:`, fetchedProposals[fetchedProposals.length - 1]);
            } catch (proposalError) {
              console.error(`Error fetching proposal ${i}:`, proposalError);
            }
          }
          
          if (!mounted) return;
          
          console.log("All fetched proposals:", fetchedProposals);
          setProposals(fetchedProposals);
        } catch (error) {
          console.error("Error in fetchProposals within useEffect:", error);
        } finally {
          if (mounted) {
            setIsFetching(false);
          }
        }
      }
    };
    
    initialFetch();
    
    return () => {
      mounted = false;
    };
  }, [treasuryContract]);

  // Separate manual fetchProposals function that can be called from buttons, etc.
  const fetchProposals = async () => {
    if (!treasuryContract || isFetching) {
      console.log("Manual fetch: Treasury contract is null or already fetching, skipping...");
      return;
    }
    
    // Clear any existing timer
    if (proposalFetchTimer) {
      clearTimeout(proposalFetchTimer);
    }
    
    // Use debounce to prevent multiple rapid calls
    const newTimer = setTimeout(async () => {
      try {
        setIsFetching(true);
        console.log("Starting manual fetch of proposals...");
        console.log("Treasury contract address:", treasuryContract.address);
        console.log("Current account:", account);
        
        try {
          // Try to directly fetch proposal 1 as a test
          console.log("Attempting to fetch proposal 1 directly...");
          try {
            const proposal1 = await treasuryContract.proposals(1);
            console.log("Proposal 1 direct fetch result:", {
              id: Number(proposal1.id),
              proposer: proposal1.proposer,
              description: proposal1.description,
              recipient: proposal1.recipient,
              amount: ethers.utils.formatEther(proposal1.amount),
              startTime: Number(proposal1.startTime),
              endTime: Number(proposal1.endTime),
              forVotes: ethers.utils.formatEther(proposal1.forVotes),
              againstVotes: ethers.utils.formatEther(proposal1.againstVotes),
              executed: proposal1.executed,
              deleted: proposal1.deleted
            });
          } catch (directFetchError) {
            console.error("Error fetching proposal 1 directly:", directFetchError);
          }
          
          // Get count of proposals
          const proposalCount = await treasuryContract.proposalCount();
          console.log("Raw proposal count:", proposalCount);
          const count = Number(proposalCount);
          console.log("Total proposals (as number):", count);
          
          // Check events as an alternative way to find proposals
          console.log("Checking ProposalCreated events...");
          try {
            const filter = treasuryContract.filters.ProposalCreated();
            const events = await treasuryContract.queryFilter(filter);
            console.log(`Found ${events.length} ProposalCreated events:`, events);
          } catch (eventsError) {
            console.error("Error fetching events:", eventsError);
          }
          
          const fetchedProposals = [];
          for (let i = 1; i <= count; i++) {
            console.log(`Fetching proposal ${i}...`);
            try {
              const proposal = await treasuryContract.proposals(i);
              console.log(`Raw proposal ${i} data:`, proposal);
              fetchedProposals.push({
                id: Number(proposal.id),
                proposer: proposal.proposer,
                description: proposal.description,
                recipient: proposal.recipient,
                amount: ethers.utils.formatEther(proposal.amount),
                startTime: Number(proposal.startTime),
                endTime: Number(proposal.endTime),
                forVotes: ethers.utils.formatEther(proposal.forVotes),
                againstVotes: ethers.utils.formatEther(proposal.againstVotes),
                executed: proposal.executed,
                deleted: proposal.deleted
              });
              console.log(`Processed proposal ${i}:`, fetchedProposals[fetchedProposals.length - 1]);
            } catch (proposalError) {
              console.error(`Error fetching proposal ${i}:`, proposalError);
              console.error(`Error details:`, proposalError);
            }
          }
          
          console.log("All fetched proposals:", fetchedProposals);
          setProposals(fetchedProposals);
        } catch (countError) {
          console.error("Error getting proposal count:", countError);
        }
      } catch (error) {
        console.error("Error in manual fetchProposals:", error);
      } finally {
        setIsFetching(false);
        setProposalFetchTimer(null);
      }
    }, 300); // 300ms debounce period
    
    setProposalFetchTimer(newTimer);
  };

  const createProposal = async (description: string, recipient: string, amount: string, durationMinutes?: number) => {
    if (!treasuryContract || !signer) return;
    
    try {
      // Check if user has deposited at least 5000 DTK
      const userDepositsAmount = await treasuryContract.getUserDeposits(account);
      const minimumDeposit = await treasuryContract.getMinimumDepositForProposal();
      
      if (userDepositsAmount.lt(minimumDeposit)) {
        const requiredAmount = ethers.utils.formatEther(minimumDeposit);
        const currentAmount = ethers.utils.formatEther(userDepositsAmount);
        throw new Error(`INSUFFICIENT_DEPOSITS:You need to deposit at least ${requiredAmount} DTK to create proposals. You have deposited ${currentAmount} DTK.`);
      }
      
      // Always use the 4-parameter version, default to 7 days (10080 minutes) if not specified
      const duration = durationMinutes || 10080; // 7 days in minutes
      
      console.log("Creating proposal with duration:", duration, "minutes");
      console.log("Available functions:", Object.keys(treasuryContract.functions));
      
      // Use the specific function selector for the 4-parameter version
      const tx = await treasuryContract['createProposal(string,address,uint256,uint256)'](
        description, 
        recipient, 
        ethers.utils.parseEther(amount),
        duration
      );
      
      await tx.wait();
      await fetchProposals();
    } catch (error) {
      console.error("Error creating proposal:", error);
      throw error; // Re-throw to let the UI handle it
    }
  };

  const vote = async (proposalId: number, support: boolean) => {
    if (!treasuryContract || !signer || !account) return;
    
    try {
      // Find the proposal in our local state
      const proposal = proposals.find(p => p.id === proposalId);
      
      // Check if the current account is the proposer
      if (proposal && proposal.proposer.toLowerCase() === account.toLowerCase()) {
        alert("Proposers cannot vote on their own proposals!");
        return;
      }
      
      const tx = await treasuryContract.vote(proposalId, support);
      await tx.wait();
      await fetchProposals();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const executeProposal = async (proposalId: number) => {
    if (!treasuryContract || !signer) return;
    
    try {
      const tx = await treasuryContract.executeProposal(proposalId);
      await tx.wait();
      await fetchProposals();
    } catch (error) {
      console.error("Error executing proposal:", error);
    }
  };

  const depositTokens = async (amount: string) => {
    if (!tokenContract || !treasuryContract || !signer) return;
    
    try {
      // First approve
      const approveTx = await tokenContract.approve(
        treasuryContract.address,
        ethers.utils.parseEther(amount)
      );
      await approveTx.wait();
      
      // Then deposit
      const depositTx = await treasuryContract.deposit(ethers.utils.parseEther(amount));
      await depositTx.wait();
      
      // Update balances
      if (account) {
        await fetchBalances(account, tokenContract, treasuryContract);
      }
    } catch (error) {
      console.error("Error depositing tokens:", error);
    }
  };

  const deleteProposal = async (proposalId: number) => {
    if (!treasuryContract || !signer) return;
    
    try {
      const tx = await treasuryContract.deleteProposal(proposalId);
      await tx.wait();
      await fetchProposals();
    } catch (error) {
      console.error("Error deleting proposal:", error);
    }
  };

  // Effect for initial connection and account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          setAccount(null);
          setIsConnected(false);
          setProvider(null);
          setSigner(null);
          setTokenContract(null);
          setTreasuryContract(null);
          setTokenBalance("0");
          setTreasuryBalance("0");
          setUserDeposits("0");
          setProposals([]);
        } else {
          // Account changed
          setAccount(accounts[0]);
          connectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        })
        .catch((err: any) => console.error(err));
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        provider,
        signer,
        account,
        isConnected,
        tokenContract,
        treasuryContract,
        tokenBalance,
        treasuryBalance,
        userDeposits,
        proposals,
        connectWallet,
        fetchProposals,
        createProposal,
        vote,
        executeProposal,
        depositTokens,
        deleteProposal,
        networkName,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}; 