'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { parseEther, hexlify, toUtf8Bytes, ContractRunner } from 'ethers';
import {
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  LightBulbIcon,
  PlusCircleIcon,
  IdentificationIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

// Proposal status enum
enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled'
}

// Proposal interface
interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  status: ProposalStatus;
  forVotes: number;
  againstVotes: number;
  quorum: number;
  minEduRequired: number;
  link: string;
  executionTime?: number;
}

// Vote type interface
enum VoteType {
  FOR = 'for',
  AGAINST = 'against'
}

// User vote interface
interface UserVote {
  proposalId: string;
  vote: VoteType;
  votingPower: number;
  timestamp: number;
}

// Mock proposals
const mockProposals: Proposal[] = [
  {
    id: '1',
    title: 'Add New DeFi Learning Course and Token',
    description: 'Proposal to add an advanced DeFi strategies course with a corresponding course token DFI. This course will cover liquidity mining, yield optimization, and DeFi protocol risk management.',
    proposer: '0x1234...5678',
    startTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
    status: ProposalStatus.ACTIVE,
    forVotes: 125000,
    againstVotes: 45000,
    quorum: 200000,
    minEduRequired: 1000,
    link: 'https://example.com/proposal/1'
  },
  {
    id: '2',
    title: 'Adjust EDU Token Mining Parameters',
    description: 'Proposal to increase EDU mining efficiency and adjust daily mining cap to incentivize more user participation. Specifically, increase base mining rate by 15% and enhance consecutive mining reward multipliers.',
    proposer: '0x2345...6789',
    startTime: Date.now() - 10 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    status: ProposalStatus.PASSED,
    forVotes: 180000,
    againstVotes: 20000,
    quorum: 150000,
    minEduRequired: 500,
    link: 'https://example.com/proposal/2',
    executionTime: Date.now() - 2 * 24 * 60 * 60 * 1000
  },
  {
    id: '3',
    title: 'Platform Fee Distribution Update',
    description: 'Proposal to update the distribution mechanism for platform transaction fees: 50% to EDU stakers, 30% for buyback and burn of EDU, and 20% for platform development and operations.',
    proposer: '0x3456...7890',
    startTime: Date.now() - 15 * 24 * 60 * 60 * 1000,
    endTime: Date.now() - 8 * 24 * 60 * 60 * 1000,
    status: ProposalStatus.REJECTED,
    forVotes: 75000,
    againstVotes: 125000,
    quorum: 150000,
    minEduRequired: 1000,
    link: 'https://example.com/proposal/3'
  },
  {
    id: '4',
    title: 'Increase Governance Participation Rewards',
    description: 'Proposal to provide additional rewards for users who actively participate in governance voting, including exclusive NFTs and additional EDU incentives to improve community engagement and governance activity.',
    proposer: '0x4567...8901',
    startTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    endTime: Date.now() + 4 * 24 * 60 * 60 * 1000,
    status: ProposalStatus.ACTIVE,
    forVotes: 95000,
    againstVotes: 15000,
    quorum: 150000,
    minEduRequired: 800,
    link: 'https://example.com/proposal/4'
  }
];

// Mock user votes
const mockUserVotes: UserVote[] = [
  {
    proposalId: '1',
    vote: VoteType.FOR,
    votingPower: 2500,
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000
  }
];

export default function GovernancePage() {
  const { isConnected, walletAddress } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteAmount, setVoteAmount] = useState<string>('');
  const [selectedVoteType, setSelectedVoteType] = useState<VoteType>(VoteType.FOR);
  const [votingPower, setVotingPower] = useState<number>(0);
  const [showVotingModal, setShowVotingModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'closed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [votingSuccess, setVotingSuccess] = useState(false);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] = useState<Proposal | null>(null);
  
  // 使用与原代码匹配的newProposal结构
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: '',
    durationDays: '7',
    minEduRequired: 1000,
    stakeAmount: ''
  });
  
  // Filter proposals based on tab
  const filteredProposals = proposals.filter(proposal => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') 
      return proposal.status === ProposalStatus.ACTIVE;
    if (activeTab === 'closed')
      return proposal.status !== ProposalStatus.ACTIVE;
    return true;
  });
  
  // 计算投票进度
  const calculateProgress = (votesFor: number, votesAgainst: number) => {
    const total = votesFor + votesAgainst;
    if (total === 0) return 0;
    return (votesFor / total) * 100;
  };
  
  // 计算剩余时间
  const calculateTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return '已结束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}天 ${hours}小时`;
  };
  
  // 投票
  const vote = async (proposalId: string, voteFor: boolean) => {
    if (!walletAddress || !signer) {
      toast.error("Please connect your wallet to vote");
      return;
    }
    
    if (!isConnected) {
      toast.error("Please switch to the correct network");
      return;
    }
    
    try {
      setVotingLoading(true);
      
      // This is a mock implementation. In a real app, you would call a voting contract function
      if (signer && typeof signer.sendTransaction === 'function') {
        const tx = await signer.sendTransaction({
          to: walletAddress,
          value: parseEther("0"), // Zero value transaction
          data: hexlify(toUtf8Bytes(
            `Vote ${voteFor ? 'FOR' : 'AGAINST'} on Proposal #${proposalId}`
          ))
        });
        
        await tx.wait(1);
        
        // Record the vote in our mock data
        const newVote: UserVote = {
          proposalId,
          vote: voteFor ? VoteType.FOR : VoteType.AGAINST,
          votingPower: 10, // Simulate 10 votes based on token holdings
          timestamp: Date.now()
        };
        
        setUserVotes(prev => [...prev, newVote]);
        
        // Update proposal in our mock data
        setProposals(prev => prev.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              forVotes: voteFor ? p.forVotes + 10 : p.forVotes,
              againstVotes: voteFor ? p.againstVotes : p.againstVotes + 10
            };
          }
          return p;
        }));
        
        toast.success(`Your vote has been recorded for Proposal #${proposalId}`);
        setShowVotingModal(false);
      } else {
        toast.error("Transaction signer not available. Please try again later.");
      }
    } catch (error: any) {
      console.error("Voting error:", error);
      toast.error(`Failed to submit vote: ${error.message}`);
    } finally {
      setVotingLoading(false);
    }
  };
  
  // Create proposal
  const createProposal = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!newProposal.title || !newProposal.description) {
      toast.error('Please fill in all the required fields');
      return;
    }
    
    const duration = parseFloat(newProposal.durationDays);
    if (isNaN(duration) || duration <= 0) {
      toast.error('Please enter a valid duration');
      return;
    }
    
    const stake = parseFloat(newProposal.stakeAmount);
    if (isNaN(stake) || stake <= 0) {
      toast.error('Please enter a valid stake amount');
      return;
    }
    
    if (stake < newProposal.minEduRequired * 0.1) {
      toast.error(`Stake amount must be at least ${newProposal.minEduRequired * 0.1} EDU (10% of minimum required)`);
      return;
    }
    
    if (stake > votingPower) {
      toast.error('Stake amount cannot exceed your voting power');
      return;
    }
    
    // In a real app, this would call the blockchain
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Create new proposal
          const newProposalData: Proposal = {
            id: (proposals.length + 1).toString(),
            title: newProposal.title,
            description: newProposal.description,
            status: ProposalStatus.ACTIVE,
            proposer: walletAddress || '0x0000...0000',
            startTime: Date.now(),
            endTime: Date.now() + (duration * 24 * 60 * 60 * 1000),
            forVotes: stake, // Creator's stake counts as "for" votes
            againstVotes: 0,
            quorum: newProposal.minEduRequired * 10,
            minEduRequired: newProposal.minEduRequired,
            link: `https://example.com/proposal/${proposals.length + 1}`
          };
          
          // Add new proposal
          setProposals([newProposalData, ...proposals]);
          
          // Record creator's vote
          const creatorVote: UserVote = {
            proposalId: newProposalData.id,
            vote: VoteType.FOR,
            votingPower: stake,
            timestamp: Date.now()
          };
          setUserVotes([...userVotes, creatorVote]);
          
          // Update voting power
          setVotingPower(votingPower - stake);
          
          // Reset form
          setNewProposal({
            title: '',
            description: '',
            category: '',
            durationDays: '7',
            minEduRequired: 1000,
            stakeAmount: ''
          });
          
          // Close modal
          setShowCreateModal(false);
          
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Creating proposal...',
        success: 'Proposal created successfully!',
        error: 'Failed to create proposal. Please try again.',
      }
    );
  };
  
  // Load governance data
  useEffect(() => {
    const loadGovernanceData = async () => {
      try {
        // In a real app, this would fetch from the blockchain
        setTimeout(() => {
          setProposals(mockProposals);
          setUserVotes(mockUserVotes);
          setVotingPower(isConnected ? 5000 : 0); // Mock voting power based on EDU balance
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading governance data:', error);
        toast.error('Failed to load governance data');
        setIsLoading(false);
      }
    };
    
    loadGovernanceData();
    
    return () => {
      // Cleanup if needed
    };
  }, [isConnected]);

  // Check if user has voted on a proposal
  const hasVoted = (proposalId: string) => {
    return userVotes.some(vote => vote.proposalId === proposalId);
  };

  // Get user vote for a proposal
  const getUserVote = (proposalId: string) => {
    return userVotes.find(vote => vote.proposalId === proposalId);
  };

  // Calculate vote percentage
  const calculateVotePercentage = (proposal: Proposal) => {
    const total = proposal.forVotes + proposal.againstVotes;
    if (total === 0) return { for: 0, against: 0 };
    
    return {
      for: (proposal.forVotes / total) * 100,
      against: (proposal.againstVotes / total) * 100
    };
  };

  // Open voting modal
  const openVotingModal = (proposal: Proposal) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (votingPower < proposal.minEduRequired) {
      toast.error(`You need at least ${proposal.minEduRequired} EDU to vote`);
      return;
    }
    
    if (hasVoted(proposal.id)) {
      toast.error('You have already voted on this proposal');
      return;
    }
    
    setSelectedProposal(proposal);
    setVoteAmount('');
    setSelectedVoteType(VoteType.FOR);
    setShowVotingModal(true);
  };

  // Handle vote submission
  const handleVoteSubmit = () => {
    if (!selectedProposal) return;
    
    const amount = parseFloat(voteAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid voting amount');
      return;
    }
    
    if (amount > votingPower) {
      toast.error('Voting amount cannot exceed your voting power');
      return;
    }
    
    // In a real app, this would call the blockchain
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Create new vote
          const newVote: UserVote = {
            proposalId: selectedProposal.id,
            vote: selectedVoteType,
            votingPower: amount,
            timestamp: Date.now()
          };
          
          // Update proposals
          setProposals(proposals.map(p => {
            if (p.id === selectedProposal.id) {
              return {
                ...p,
                forVotes: selectedVoteType === VoteType.FOR ? p.forVotes + amount : p.forVotes,
                againstVotes: selectedVoteType === VoteType.AGAINST ? p.againstVotes + amount : p.againstVotes
              };
            }
            return p;
          }));
          
          // Update user votes
          setUserVotes([...userVotes, newVote]);
          
          // Update voting power
          setVotingPower(votingPower - amount);
          
          // Close modal
          setShowVotingModal(false);
          
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Submitting vote...',
        success: 'Vote submitted successfully!',
        error: 'Failed to submit vote. Please try again.',
      }
    );
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Format address
  const formatAddress = (address: string) => {
    if (!address) return '';
    return address.length > 10 ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : address;
  };

  // View proposal details
  const viewProposalDetails = (proposal: Proposal) => {
    setSelectedProposalDetails(proposal);
    setShowProposalDetails(true);
  };

  // Close proposal details
  const closeProposalDetails = () => {
    setSelectedProposalDetails(null);
    setShowProposalDetails(false);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-16 px-4">
        {/* Page Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 gradient-text">Governance Center</h1>
          <p className="text-xl text-gray-400">Participate in community governance to shape the future</p>
        </motion.div>
        
        {/* Governance Stats */}
        {isConnected && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-medium">My Voting Power</h3>
                <CurrencyDollarIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{formatNumber(votingPower)} EDU</p>
              <p className="text-sm text-gray-500 mt-1">Based on your current EDU balance</p>
            </div>
            
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-medium">My Votes</h3>
                <DocumentTextIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2">{userVotes.length}</p>
              <p className="text-sm text-gray-500 mt-1">Number of proposals voted</p>
            </div>
            
            <div className="glass p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-gray-400 font-medium">Active Proposals</h3>
                <ChartBarIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {proposals.filter(p => p.status === ProposalStatus.ACTIVE).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Proposals needing your vote</p>
            </div>
          </motion.div>
        )}
        
        {/* Main Content */}
        <div className="flex flex-col space-y-8">
          {isLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Loading governance data...</p>
            </div>
          ) : !isConnected ? (
            <div className="glass rounded-xl p-8 text-center">
              <h3 className="text-xl font-medium mb-4">Connect Your Wallet</h3>
              <p className="text-gray-400 mb-6">Connect your wallet to participate in governance</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-xl overflow-hidden"
            >
              {/* Tabs and Create Proposal Button */}
              <div className="flex justify-between items-center border-b border-gray-800 px-4">
                <div className="flex">
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'all' 
                        ? 'text-white border-b-2 border-indigo-500' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Proposals
                  </button>
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'active' 
                        ? 'text-white border-b-2 border-indigo-500' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('active')}
                  >
                    Active
                  </button>
                  <button
                    className={`px-6 py-4 text-sm font-medium ${
                      activeTab === 'closed' 
                        ? 'text-white border-b-2 border-indigo-500' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab('closed')}
                  >
                    Closed
                  </button>
                </div>
                
                <button
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm mr-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Proposal
                </button>
              </div>
              
              {/* Proposals List */}
              <div className="divide-y divide-gray-800">
                {filteredProposals.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No proposals found</p>
                  </div>
                ) : (
                  filteredProposals.map((proposal) => {
                    const percentages = calculateVotePercentage(proposal);
                    const userVote = getUserVote(proposal.id);
                    
                    return (
                      <div key={proposal.id} className="p-6 hover:bg-gray-800/30 transition-colors border border-gray-800/50 rounded-lg m-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 
                                className="text-xl font-medium cursor-pointer hover:text-indigo-400"
                                onClick={() => viewProposalDetails(proposal)}
                              >
                                {proposal.title}
                              </h3>
                              {proposal.status === ProposalStatus.ACTIVE && 
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Active</span>}
                              {proposal.status === ProposalStatus.PASSED && 
                                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span>}
                              {proposal.status === ProposalStatus.REJECTED && 
                                <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Rejected</span>}
                              {proposal.status === ProposalStatus.EXECUTED && 
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">Executed</span>}
                              {proposal.status === ProposalStatus.CANCELLED && 
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">Cancelled</span>}
                            </div>
                            <div className="flex items-center text-sm text-gray-400 gap-4">
                              <span className="flex items-center">
                                <UserGroupIcon className="h-4 w-4 mr-1" />
                                Proposed by {formatAddress(proposal.proposer)}
                              </span>
                              {proposal.status === ProposalStatus.ACTIVE && (
                                <span className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {calculateTimeRemaining(proposal.endTime)}
                                </span>
                              )}
                              {proposal.status === ProposalStatus.PASSED && proposal.executionTime && (
                                <span className="flex items-center">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                                  Executed on {new Date(proposal.executionTime).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex items-center gap-3">
                            {userVote && (
                              <div className={`px-3 py-1 rounded-full text-sm ${
                                userVote.vote === VoteType.FOR 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                Voted {userVote.vote === VoteType.FOR ? 'For' : 'Against'}
                              </div>
                            )}
                            
                            {proposal.status === ProposalStatus.ACTIVE && !hasVoted(proposal.id) && (
                              <button
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
                                onClick={() => openVotingModal(proposal)}
                              >
                                Vote
                              </button>
                            )}
                            
                            <button
                              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                              onClick={() => viewProposalDetails(proposal)}
                            >
                              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {proposal.description}
                        </p>
                        
                        {/* Voting Statistics */}
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-400">
                              For: {formatNumber(proposal.forVotes)} EDU ({percentages.for.toFixed(1)}%)
                            </span>
                            <span className="text-red-400">
                              Against: {formatNumber(proposal.againstVotes)} EDU ({percentages.against.toFixed(1)}%)
                            </span>
                          </div>
                          
                          <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-green-500 to-green-400"
                              style={{ width: `${percentages.for}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Quorum: {formatNumber(proposal.quorum)} EDU
                          </span>
                          <span>
                            Minimum Required: {formatNumber(proposal.minEduRequired)} EDU
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Voting Modal */}
      {showVotingModal && selectedProposal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-medium mb-4">Vote: {selectedProposal.title}</h3>
            
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Vote Type</div>
              <div className="flex space-x-3">
                <button 
                  className={`flex-1 py-3 rounded-lg ${
                    selectedVoteType === VoteType.FOR 
                      ? 'bg-green-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedVoteType(VoteType.FOR)}
                >
                  For
                </button>
                <button 
                  className={`flex-1 py-3 rounded-lg ${
                    selectedVoteType === VoteType.AGAINST 
                      ? 'bg-red-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedVoteType(VoteType.AGAINST)}
                >
                  Against
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Voting Amount</div>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  placeholder="Enter EDU amount"
                  value={voteAmount}
                  onChange={(e) => setVoteAmount(e.target.value)}
                />
                <button
                  className="absolute right-2 top-2 px-2 py-1 bg-gray-700 rounded-md text-xs hover:bg-gray-600"
                  onClick={() => setVoteAmount(votingPower.toString())}
                >
                  Max
                </button>
              </div>
              <div className="text-right text-xs text-gray-400 mt-1">
                Available: {formatNumber(votingPower)} EDU
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                onClick={() => setShowVotingModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                onClick={handleVoteSubmit}
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-medium mb-4">Create New Proposal</h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Title</div>
              <input
                type="text"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                placeholder="Enter proposal title"
                value={newProposal.title}
                onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <div className="text-sm text-gray-400 mb-2">Description</div>
              <textarea
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white min-h-[100px]"
                placeholder="Enter proposal description"
                value={newProposal.description}
                onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-400 mb-2">Min. Required EDU</div>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  placeholder="Min. required EDU"
                  value={newProposal.minEduRequired}
                  onChange={(e) => setNewProposal({...newProposal, minEduRequired: parseInt(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-2">Duration (days)</div>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  placeholder="Duration in days"
                  value={newProposal.durationDays}
                  onChange={(e) => setNewProposal({...newProposal, durationDays: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">Stake Amount (EDU)</div>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
                  placeholder="Enter stake amount"
                  value={newProposal.stakeAmount}
                  onChange={(e) => setNewProposal({...newProposal, stakeAmount: e.target.value})}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1 flex justify-between">
                <span>You must stake EDU to create a proposal</span>
                <span>Available: {formatNumber(votingPower)} EDU</span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                onClick={createProposal}
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Proposal Details Modal */}
      {showProposalDetails && selectedProposalDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-medium">{selectedProposalDetails.title}</h2>
                  {selectedProposalDetails.status === ProposalStatus.ACTIVE && 
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Active</span>}
                  {selectedProposalDetails.status === ProposalStatus.PASSED && 
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Passed</span>}
                  {selectedProposalDetails.status === ProposalStatus.REJECTED && 
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Rejected</span>}
                </div>
                <div className="flex items-center text-sm text-gray-400 gap-4">
                  <span className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Proposed by {formatAddress(selectedProposalDetails.proposer)}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Created {new Date(selectedProposalDetails.startTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <button
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                onClick={closeProposalDetails}
              >
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>
            
            <div className="glass-dark p-6 rounded-xl mb-6">
              <h3 className="text-gray-300 text-lg mb-3">Description</h3>
              <p className="text-gray-400 whitespace-pre-line">
                {selectedProposalDetails.description}
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-gray-300 text-lg mb-3">Voting Results</h3>
              
              <div className="glass-dark p-6 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">
                    For: {formatNumber(selectedProposalDetails.forVotes)} EDU ({calculateVotePercentage(selectedProposalDetails).for.toFixed(1)}%)
                  </span>
                  <span className="text-red-400">
                    Against: {formatNumber(selectedProposalDetails.againstVotes)} EDU ({calculateVotePercentage(selectedProposalDetails).against.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="h-4 w-full bg-gray-700 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: `${calculateVotePercentage(selectedProposalDetails).for}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="glass-dark rounded-lg p-4">
                    <div className="text-gray-400 mb-1">Quorum</div>
                    <div className="text-white font-medium">{formatNumber(selectedProposalDetails.quorum)} EDU</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {(selectedProposalDetails.forVotes + selectedProposalDetails.againstVotes) >= selectedProposalDetails.quorum 
                        ? 'Quorum reached' 
                        : 'Quorum not reached'}
                    </div>
                  </div>
                  
                  <div className="glass-dark rounded-lg p-4">
                    <div className="text-gray-400 mb-1">Status</div>
                    <div className="text-white font-medium">
                      {selectedProposalDetails.status === ProposalStatus.ACTIVE && 'Active'}
                      {selectedProposalDetails.status === ProposalStatus.PASSED && 'Passed'}
                      {selectedProposalDetails.status === ProposalStatus.REJECTED && 'Rejected'}
                      {selectedProposalDetails.status === ProposalStatus.EXECUTED && 'Executed'}
                      {selectedProposalDetails.status === ProposalStatus.CANCELLED && 'Cancelled'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedProposalDetails.status === ProposalStatus.ACTIVE 
                        ? `Ends ${new Date(selectedProposalDetails.endTime).toLocaleDateString()}`
                        : `Ended ${new Date(selectedProposalDetails.endTime).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <a
                href={selectedProposalDetails.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center"
              >
                <span>View on blockchain</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
              </a>
              
              {selectedProposalDetails.status === ProposalStatus.ACTIVE && !hasVoted(selectedProposalDetails.id) && (
                <button
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  onClick={() => {
                    closeProposalDetails();
                    openVotingModal(selectedProposalDetails);
                  }}
                >
                  Vote Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 