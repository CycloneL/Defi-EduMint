'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  PlayIcon,
  PauseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Mining stats interface
interface MiningStats {
  totalMined: number;
  rate: number;
  lastClaim: string;
  level: number;
  dailyLimit: number;
  dailyMined: number;
  remainingTime: number;
  streak: number;
  multiplier: number;
}

// Mining history interface
interface MiningHistory {
  id: string;
  amount: number;
  timestamp: string;
  duration: number;
  txHash: string;
}

// Level data interface
interface LevelData {
  level: number;
  requirement: number;
  rate: number;
  dailyLimit: number;
  color: string;
}

// Levels data
const levels: LevelData[] = [
  { level: 1, requirement: 0, rate: 0.01, dailyLimit: 100, color: 'from-blue-500 to-purple-500' },
  { level: 2, requirement: 1000, rate: 0.02, dailyLimit: 250, color: 'from-purple-500 to-indigo-500' },
  { level: 3, requirement: 5000, rate: 0.04, dailyLimit: 500, color: 'from-indigo-500 to-blue-500' },
  { level: 4, requirement: 15000, rate: 0.08, dailyLimit: 1000, color: 'from-cyan-500 to-blue-500' },
  { level: 5, requirement: 50000, rate: 0.16, dailyLimit: 2000, color: 'from-green-500 to-teal-500' },
];

// Mock mining history
const mockHistory: MiningHistory[] = [
  { id: '1', amount: 120, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 24, txHash: '0x1234...5678' },
  { id: '2', amount: 95, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), duration: 18, txHash: '0x2345...6789' },
  { id: '3', amount: 150, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), duration: 36, txHash: '0x3456...7890' },
  { id: '4', amount: 78, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), duration: 12, txHash: '0x4567...8901' },
];

export default function MiningPage() {
  const { isConnected, walletAddress, eduBalance } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [miningStats, setMiningStats] = useState<MiningStats>({
    totalMined: 0,
    rate: 0.02, // EDU per minute (降低为原来的20%)
    lastClaim: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    level: 2,
    dailyLimit: 250,
    dailyMined: 0,
    remainingTime: 24 * 60 * 60, // 24 hours in seconds
    streak: 3,
    multiplier: 1.15
  });
  const [miningHistory, setMiningHistory] = useState<MiningHistory[]>([]);
  const [currentMiningAmount, setCurrentMiningAmount] = useState<number>(0);
  const [miningTime, setMiningTime] = useState<number>(0);
  const miningInterval = useRef<NodeJS.Timeout | null>(null);
  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  // Load mining data
  useEffect(() => {
    const loadMiningData = async () => {
      try {
        // In a real app, this would fetch from the blockchain
        // For now, use mock data
        setTimeout(() => {
          setMiningStats({
            totalMined: 443,
            rate: 0.02, // EDU per minute (降低为原来的20%)
            lastClaim: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            level: 2,
            dailyLimit: 250,
            dailyMined: 78,
            remainingTime: 12 * 60 * 60, // 12 hours in seconds
            streak: 3,
            multiplier: 1.15
          });
          setMiningHistory(mockHistory);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading mining data:', error);
        toast.error('Failed to load your mining data');
        setIsLoading(false);
      }
    };
    
    if (isConnected) {
      loadMiningData();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      // Clean up intervals
      if (miningInterval.current) {
        clearInterval(miningInterval.current);
      }
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [isConnected]);

  // Start/stop mining
  const toggleMining = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (isMining) {
      // Stop mining
      if (miningInterval.current) {
        clearInterval(miningInterval.current);
        miningInterval.current = null;
      }
      
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
        updateInterval.current = null;
      }
      
      // Claim rewards
      if (currentMiningAmount > 0) {
        claimMiningRewards();
      } else {
        setIsMining(false);
      }
    } else {
      // Start mining
      setCurrentMiningAmount(0);
      setMiningTime(0);
      
      // Update mining amount every second
      miningInterval.current = setInterval(() => {
        setCurrentMiningAmount(prev => {
          const effectiveRate = miningStats.rate * miningStats.multiplier;
          return prev + (effectiveRate / 60); // Convert per minute to per second
        });
        setMiningTime(prev => prev + 1);
      }, 1000);
      
      // Update UI every minute
      updateInterval.current = setInterval(() => {
        toast.success(`Mining in progress: +${(miningStats.rate * miningStats.multiplier).toFixed(2)} EDU/min`);
      }, 60000);
      
      setIsMining(true);
      toast.success('Mining started!');
    }
  };

  // Claim mining rewards
  const claimMiningRewards = async () => {
    // In a real app, this would call a smart contract
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Update stats
          const newTotalMined = miningStats.totalMined + currentMiningAmount;
          const newDailyMined = miningStats.dailyMined + currentMiningAmount;
          
          // Add to history
          const newHistoryItem: MiningHistory = {
            id: Date.now().toString(),
            amount: currentMiningAmount,
            timestamp: new Date().toISOString(),
            duration: miningTime,
            txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`
          };
          
          setMiningHistory([newHistoryItem, ...miningHistory]);
          
          // Update stats
          setMiningStats({
            ...miningStats,
            totalMined: newTotalMined,
            dailyMined: newDailyMined,
            lastClaim: new Date().toISOString()
          });
          
          // Reset current mining
          setCurrentMiningAmount(0);
          setMiningTime(0);
          setIsMining(false);
          
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Claiming mining rewards...',
        success: `Successfully claimed mining rewards!`,
        error: 'Failed to claim mining rewards',
      }
    );
  };

  // Format mining time
  const formatMiningTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get level details
  const getCurrentLevelDetails = () => {
    return levels.find(l => l.level === miningStats.level) || levels[0];
  };

  // Get next level details
  const getNextLevelDetails = () => {
    const nextLevelIndex = levels.findIndex(l => l.level === miningStats.level) + 1;
    return nextLevelIndex < levels.length ? levels[nextLevelIndex] : null;
  };

  // Calculate progress to next level
  const calculateLevelProgress = () => {
    const currentLevel = getCurrentLevelDetails();
    const nextLevel = getNextLevelDetails();
    
    if (!nextLevel) return 100; // Max level
    
    const currentRequirement = currentLevel.requirement;
    const nextRequirement = nextLevel.requirement;
    const total = nextRequirement - currentRequirement;
    const progress = miningStats.totalMined - currentRequirement;
    
    return Math.min(100, Math.max(0, (progress / total) * 100));
  };

  // Calculate daily limit progress
  const calculateDailyProgress = () => {
    return Math.min(100, (miningStats.dailyMined / miningStats.dailyLimit) * 100);
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
          <h1 className="text-4xl font-bold mb-4 gradient-text">EDU Mining</h1>
          <p className="text-xl text-gray-400">Mine EDU tokens by active participation</p>
        </motion.div>
        
        {/* Main Content */}
        <div className="flex flex-col space-y-8">
          {isLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Loading mining data...</p>
            </div>
          ) : !isConnected ? (
            <div className="glass rounded-xl p-8 text-center">
              <h3 className="text-xl font-medium mb-4">Connect your wallet</h3>
              <p className="text-gray-400 mb-6">Connect your wallet to start mining EDU tokens</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Mining Stats - Left Side */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-semibold">Mining Dashboard</h2>
                  </div>
                  
                  <div className="p-6">
                    {/* Mining Level */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <div className="text-sm text-gray-400">Mining Level</div>
                        <div className="text-sm">Level {miningStats.level}</div>
                      </div>
                      
                      {getNextLevelDetails() && (
                        <>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-1">
                            <div 
                              className={`h-full bg-gradient-to-r ${getCurrentLevelDetails().color}`}
                              style={{ width: `${calculateLevelProgress()}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>{miningStats.totalMined.toLocaleString()} EDU</span>
                            <span>{getNextLevelDetails()?.requirement.toLocaleString()} EDU needed for Level {getNextLevelDetails()?.level}</span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Mining Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="glass-dark p-4 rounded-lg">
                        <div className="flex items-center text-gray-400 mb-1">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Mining Rate</span>
                        </div>
                        <div className="text-lg font-medium">{(miningStats.rate * miningStats.multiplier).toFixed(2)} EDU/min</div>
                        <div className="text-xs text-indigo-400 mt-1">
                          {miningStats.multiplier > 1 ? `${((miningStats.multiplier - 1) * 100).toFixed(0)}% streak bonus` : 'No bonus'}
                        </div>
                      </div>
                      
                      <div className="glass-dark p-4 rounded-lg">
                        <div className="flex items-center text-gray-400 mb-1">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          <span className="text-xs">Total Mined</span>
                        </div>
                        <div className="text-lg font-medium">{miningStats.totalMined.toLocaleString()} EDU</div>
                        <div className="text-xs text-gray-400 mt-1">Lifetime earnings</div>
                      </div>
                    </div>
                    
                    {/* Daily Limit */}
                    <div className="glass-dark p-4 rounded-lg mb-6">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center text-gray-400">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">Daily Limit</span>
                        </div>
                        <div className="text-sm">{miningStats.dailyMined.toFixed(0)} / {miningStats.dailyLimit} EDU</div>
                      </div>
                      
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-1">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${calculateDailyProgress()}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        <span>Resets in: <span suppressHydrationWarning>{formatMiningTime(miningStats.remainingTime)}</span></span>
                      </div>
                    </div>
                    
                    {/* Streak */}
                    <div className="glass-dark p-4 rounded-lg mb-6">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center text-gray-400">
                          <ArrowUpIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">Mining Streak</span>
                        </div>
                        <div className="text-sm">{miningStats.streak} days</div>
                      </div>
                      
                      <div className="flex space-x-2 mb-2">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <div 
                            key={index} 
                            className={`flex-1 h-2 rounded-full ${
                              index < miningStats.streak 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500' 
                                : 'bg-gray-700'
                            }`}
                          ></div>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        <span>Current multiplier: {miningStats.multiplier.toFixed(2)}x</span>
                      </div>
                    </div>
                    
                    {/* Mining Control */}
                    <div>
                      <button
                        className={`w-full py-4 rounded-xl font-medium flex items-center justify-center space-x-2 ${
                          isMining 
                            ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' 
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        }`}
                        onClick={toggleMining}
                      >
                        {isMining ? (
                          <>
                            <PauseIcon className="h-5 w-5" />
                            <span>Stop Mining & Claim</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-5 w-5" />
                            <span>Start Mining</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Right Side - Current Mining & History */}
              <div className="lg:col-span-2">
                {/* Current Mining Session */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="glass rounded-xl overflow-hidden mb-8"
                >
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-semibold">Current Mining Session</h2>
                  </div>
                  
                  <div className="p-6">
                    {isMining ? (
                      <div className="text-center py-8">
                        <div className="mb-6">
                          <div className="inline-block rounded-full p-3 bg-indigo-500/20 mb-4">
                            <div className="animate-pulse rounded-full h-24 w-24 border-4 border-indigo-500 flex items-center justify-center">
                              <Image
                                src="/images/token-edu.png"
                                alt="EDU"
                                width={64}
                                height={64}
                                className="rounded-full"
                                unoptimized
                              />
                            </div>
                          </div>
                          
                          <div className="text-3xl font-bold mb-1">+{currentMiningAmount.toFixed(6)} EDU</div>
                          <div className="text-lg text-gray-400">Mining in progress...</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                          <div className="glass-dark p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Rate</div>
                            <div className="font-medium">{(miningStats.rate * miningStats.multiplier).toFixed(2)} EDU/min</div>
                          </div>
                          
                          <div className="glass-dark p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Time</div>
                            <div className="font-medium" suppressHydrationWarning>{formatMiningTime(miningTime)}</div>
                          </div>
                          
                          <div className="glass-dark p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Daily Left</div>
                            <div className="font-medium">{(miningStats.dailyLimit - miningStats.dailyMined).toFixed(0)} EDU</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="rounded-full p-3 bg-gray-800 inline-block mb-4">
                          <PlayIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No Active Mining Session</h3>
                        <p className="text-gray-400 mb-6">Start mining to earn EDU tokens</p>
                        <button
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white inline-block"
                          onClick={toggleMining}
                        >
                          Start Mining
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                {/* Mining History */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">Mining History</h2>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <ArrowPathIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {miningHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="rounded-full p-3 bg-gray-800 inline-block mb-4">
                          <ClockIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No Mining History</h3>
                        <p className="text-gray-400">Start mining to see your history here</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-gray-400 text-sm border-b border-gray-800">
                              <th className="text-left pb-4 pl-4">Date</th>
                              <th className="text-right pb-4">Amount</th>
                              <th className="text-right pb-4">Duration</th>
                              <th className="text-right pb-4 pr-4">Transaction</th>
                            </tr>
                          </thead>
                          <tbody>
                            {miningHistory.map((history) => (
                              <tr key={history.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                                <td className="py-4 pl-4">
                                  <span suppressHydrationWarning>{formatDate(history.timestamp)}</span>
                                </td>
                                <td className="py-4 text-right text-green-400">
                                  +{history.amount.toFixed(6)} EDU
                                </td>
                                <td className="py-4 text-right">
                                  {Math.floor(history.duration / 60)}m {history.duration % 60}s
                                </td>
                                <td className="py-4 pr-4 text-right">
                                  <a 
                                    href="#" 
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toast.success(`Transaction Hash: ${history.txHash}`);
                                    }}
                                  >
                                    {history.txHash}
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 