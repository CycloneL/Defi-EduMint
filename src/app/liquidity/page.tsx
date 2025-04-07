'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Course Token interface
interface CourseToken {
  id: number;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  totalSupply: number;
  poolSize?: number;
  myLiquidity?: number;
  apr?: number;
  popularity?: 'high' | 'medium' | 'low';
  image: string;
}

// Liquidity Pool interface
interface LiquidityPool {
  id: number;
  token: CourseToken;
  tokenAmount: number;
  eduAmount: number;
  totalLiquidity: number;
  apr: number;
  volume24h: number;
  myShare: number;
  createdAt: string;
}

// User Liquidity interface
interface UserLiquidity {
  id: number;
  token: CourseToken;
  tokenAmount: number;
  eduAmount: number;
  lpTokens: number;
  value: number;
  share: number;
  addedDate: string;
}

// Mock data for course tokens
const mockCourseTokens: CourseToken[] = [
  {
    id: 1,
    name: 'Education DAO',
    symbol: 'EDU',
    price: 1.0,
    change24h: 2.5,
    volume24h: 1234567,
    marketCap: 10000000,
    totalSupply: 10000000,
    poolSize: 500000,
    myLiquidity: 2500,
    apr: 24.5,
    popularity: 'high',
    image: '/images/token-edu.png'
  },
  {
    id: 2,
    name: 'Blockchain Basics',
    symbol: 'BLK',
    price: 0.5,
    change24h: 5.7,
    volume24h: 567890,
    marketCap: 5000000,
    totalSupply: 10000000,
    poolSize: 250000,
    myLiquidity: 1500,
    apr: 32.1,
    popularity: 'high',
    image: '/images/token-blk.png'
  },
  {
    id: 3,
    name: 'Smart Contracts',
    symbol: 'SC',
    price: 0.75,
    change24h: -1.2,
    volume24h: 345678,
    marketCap: 7500000,
    totalSupply: 10000000,
    poolSize: 180000,
    myLiquidity: 0,
    apr: 28.7,
    popularity: 'medium',
    image: '/images/token-sc.png'
  },
  {
    id: 4,
    name: 'Solidity Fundamentals',
    symbol: 'SF',
    price: 0.65,
    change24h: 3.8,
    volume24h: 234567,
    marketCap: 6500000,
    totalSupply: 10000000,
    poolSize: 120000,
    myLiquidity: 0,
    apr: 35.2,
    popularity: 'medium',
    image: '/images/token-sf.png'
  },
  {
    id: 5,
    name: 'DeFi Applications',
    symbol: 'DEFI',
    price: 0.85,
    change24h: 0.5,
    volume24h: 789012,
    marketCap: 8500000,
    totalSupply: 10000000,
    poolSize: 320000,
    myLiquidity: 500,
    apr: 26.8,
    popularity: 'high',
    image: '/images/token-defi.png'
  },
];

// Mock data for user liquidity positions
const mockUserLiquidity: UserLiquidity[] = [
  {
    id: 1,
    token: mockCourseTokens[0], // EDU
    tokenAmount: 2500,
    eduAmount: 2500,
    lpTokens: 2500,
    value: 5000,
    share: 0.5,
    addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    token: mockCourseTokens[1], // BLK
    tokenAmount: 3000,
    eduAmount: 1500,
    lpTokens: 2121,
    value: 3000,
    share: 0.6,
    addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    token: mockCourseTokens[4], // DEFI
    tokenAmount: 588,
    eduAmount: 500,
    lpTokens: 544,
    value: 1000,
    share: 0.15,
    addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock data for liquidity pools
const mockLiquidityPools: LiquidityPool[] = mockCourseTokens.map(token => ({
  id: token.id,
  token: token,
  tokenAmount: token.poolSize || 0,
  eduAmount: (token.poolSize || 0) * token.price,
  totalLiquidity: (token.poolSize || 0) * token.price * 2,
  apr: token.apr || 0,
  volume24h: token.volume24h,
  myShare: (token.myLiquidity || 0) / (token.poolSize || 1) * 100,
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
}));

export default function LiquidityPage() {
  const { isConnected, walletAddress, eduBalance } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState<CourseToken[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [userLiquidity, setUserLiquidity] = useState<UserLiquidity[]>([]);
  const [selectedToken, setSelectedToken] = useState<CourseToken | null>(null);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [showRemoveLiquidity, setShowRemoveLiquidity] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [eduAmount, setEduAmount] = useState('');
  const [selectedLiquidity, setSelectedLiquidity] = useState<UserLiquidity | null>(null);
  const [removePercentage, setRemovePercentage] = useState(50);
  const [activeTab, setActiveTab] = useState<'pools' | 'my-liquidity'>('pools');

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      // 尝试从本地存储加载创建的课程代币
      try {
        // 获取本地存储中的代币数据
        const createdLiquidityTokensJson = localStorage.getItem('createdLiquidityTokens');
        
        // 如果有创建的课程代币数据，解析并合并
        let allTokens = [...mockCourseTokens];
        let allPools = [...mockLiquidityPools];
        
        if (createdLiquidityTokensJson) {
          const createdLiquidityTokens = JSON.parse(createdLiquidityTokensJson);
          
          // 确保每个创建的代币有唯一的 ID
          const existingIds = new Set(allTokens.map(token => token.id));
          
          // 将创建的代币添加到代币列表
          createdLiquidityTokens.forEach((token: CourseToken) => {
            // 确保不会重复添加相同 ID 的代币
            if (!existingIds.has(token.id)) {
              allTokens.push(token);
              
              // 为每个新代币创建对应的流动性池
              const newPool: LiquidityPool = {
                id: token.id,
                token: token,
                tokenAmount: token.poolSize || 1000,
                eduAmount: (token.poolSize || 1000) * token.price,
                totalLiquidity: (token.poolSize || 1000) * token.price * 2,
                apr: token.apr || 15,
                volume24h: token.volume24h || 0,
                myShare: (token.myLiquidity || 0) / (token.poolSize || 1) * 100,
                createdAt: new Date().toISOString()
              };
              
              allPools.push(newPool);
              existingIds.add(token.id);
            }
          });
          
          console.log("已加载创建的课程代币:", createdLiquidityTokens.length);
        }
        
        setTokens(allTokens);
        setLiquidityPools(allPools);
        setUserLiquidity(mockUserLiquidity);
      } catch (error) {
        console.error("加载创建的课程代币失败:", error);
        // 如果出错，至少加载模拟数据
        setTokens(mockCourseTokens);
        setLiquidityPools(mockLiquidityPools);
        setUserLiquidity(mockUserLiquidity);
      }
      
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle token selection
  const handleTokenSelect = (token: CourseToken) => {
    setSelectedToken(token);
    setShowAddLiquidity(true);
    
    // Reset form
    setTokenAmount('');
    setEduAmount('');
  };

  // Handle Add Liquidity form submission
  const handleAddLiquidity = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedToken) {
      toast.error('Please select a token');
      return;
    }
    
    if (!tokenAmount || !eduAmount || parseFloat(tokenAmount) <= 0 || parseFloat(eduAmount) <= 0) {
      toast.error('Please enter valid amounts');
      return;
    }
    
    // In a real app, this would call a smart contract
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          // Update mock data
          const newUserLiquidity: UserLiquidity = {
            id: Math.max(...userLiquidity.map(l => l.id)) + 1,
            token: selectedToken,
            tokenAmount: parseFloat(tokenAmount),
            eduAmount: parseFloat(eduAmount),
            lpTokens: Math.sqrt(parseFloat(tokenAmount) * parseFloat(eduAmount)),
            value: parseFloat(eduAmount) * 2,
            share: (parseFloat(eduAmount) / (selectedToken.poolSize || 1)) * 100,
            addedDate: new Date().toISOString()
          };
          
          setUserLiquidity([...userLiquidity, newUserLiquidity]);
          
          // Update liquidity pool
          const updatedPools = liquidityPools.map(pool => {
            if (pool.token.id === selectedToken.id) {
              return {
                ...pool,
                tokenAmount: pool.tokenAmount + parseFloat(tokenAmount),
                eduAmount: pool.eduAmount + parseFloat(eduAmount),
                totalLiquidity: pool.totalLiquidity + parseFloat(eduAmount) * 2,
                myShare: ((pool.myShare * pool.totalLiquidity) + parseFloat(eduAmount) * 2) / (pool.totalLiquidity + parseFloat(eduAmount) * 2) * 100
              };
            }
            return pool;
          });
          
          setLiquidityPools(updatedPools);
          
          // Reset form and close modal
          setTokenAmount('');
          setEduAmount('');
          setShowAddLiquidity(false);
          setSelectedToken(null);
          
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Adding liquidity...',
        success: 'Liquidity added successfully!',
        error: 'Failed to add liquidity',
      }
    );
  };

  // Handle Remove Liquidity
  const handleRemoveLiquidity = (liquidity: UserLiquidity) => {
    setSelectedLiquidity(liquidity);
    setShowRemoveLiquidity(true);
    setRemovePercentage(50); // Default to 50%
  };

  // Confirm Remove Liquidity
  const confirmRemoveLiquidity = () => {
    if (!selectedLiquidity) return;
    
    // In a real app, this would call a smart contract
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          if (removePercentage === 100) {
            // Remove completely
            setUserLiquidity(userLiquidity.filter(l => l.id !== selectedLiquidity.id));
          } else {
            // Remove partially
            const updatedUserLiquidity = userLiquidity.map(l => {
              if (l.id === selectedLiquidity.id) {
                const remainingPercentage = (100 - removePercentage) / 100;
                return {
                  ...l,
                  tokenAmount: l.tokenAmount * remainingPercentage,
                  eduAmount: l.eduAmount * remainingPercentage,
                  lpTokens: l.lpTokens * remainingPercentage,
                  value: l.value * remainingPercentage,
                  share: l.share * remainingPercentage
                };
              }
              return l;
            });
            
            setUserLiquidity(updatedUserLiquidity);
          }
          
          // Update liquidity pool
          const removedTokenAmount = selectedLiquidity.tokenAmount * (removePercentage / 100);
          const removedEduAmount = selectedLiquidity.eduAmount * (removePercentage / 100);
          
          const updatedPools = liquidityPools.map(pool => {
            if (pool.token.id === selectedLiquidity.token.id) {
              return {
                ...pool,
                tokenAmount: pool.tokenAmount - removedTokenAmount,
                eduAmount: pool.eduAmount - removedEduAmount,
                totalLiquidity: pool.totalLiquidity - (removedEduAmount * 2),
                myShare: Math.max(0, ((pool.myShare * pool.totalLiquidity) - (removedEduAmount * 2)) / (pool.totalLiquidity - (removedEduAmount * 2)) * 100)
              };
            }
            return pool;
          });
          
          setLiquidityPools(updatedPools);
          
          // Close modal
          setShowRemoveLiquidity(false);
          setSelectedLiquidity(null);
          
          resolve(true);
        }, 2000);
      }),
      {
        loading: 'Removing liquidity...',
        success: 'Liquidity removed successfully!',
        error: 'Failed to remove liquidity',
      }
    );
  };

  // Calculate estimated LP tokens for Add Liquidity
  const calculateLpTokens = () => {
    if (!selectedToken || !tokenAmount || !eduAmount) return '0';
    
    const tokenAmountValue = parseFloat(tokenAmount);
    const eduAmountValue = parseFloat(eduAmount);
    
    if (isNaN(tokenAmountValue) || isNaN(eduAmountValue) || tokenAmountValue <= 0 || eduAmountValue <= 0) {
      return '0';
    }
    
    // Calculate LP tokens using sqrt(x*y) formula (simplified)
    return Math.sqrt(tokenAmountValue * eduAmountValue).toFixed(6);
  };

  // Calculate pool share for Add Liquidity
  const calculatePoolShare = () => {
    if (!selectedToken || !eduAmount) return '0';
    
    const eduAmountValue = parseFloat(eduAmount);
    const selectedPool = liquidityPools.find(p => p.token.id === selectedToken.id);
    
    if (!selectedPool || isNaN(eduAmountValue) || eduAmountValue <= 0) {
      return '0';
    }
    
    // Calculate new share
    const newTotalLiquidity = selectedPool.totalLiquidity + (eduAmountValue * 2);
    const newShare = (eduAmountValue * 2) / newTotalLiquidity * 100;
    
    return newShare.toFixed(2);
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
          <h1 className="text-4xl font-bold mb-4 gradient-text">Liquidity Providing</h1>
          <p className="text-xl text-gray-400">Provide liquidity to earn fees and rewards</p>
        </motion.div>
        
        {/* Main Content */}
        <div className="flex flex-col space-y-8">
          {isLoading ? (
            <div className="glass rounded-xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-gray-400">Loading liquidity pools...</p>
            </div>
          ) : !isConnected ? (
            <div className="glass rounded-xl p-8 text-center">
              <h3 className="text-xl font-medium mb-4">Connect your wallet</h3>
              <p className="text-gray-400 mb-6">Connect your wallet to view and manage your liquidity positions</p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex space-x-4 border-b border-gray-800">
                <button
                  className={`px-4 py-2 ${activeTab === 'pools' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('pools')}
                >
                  Available Pools
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'my-liquidity' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTab('my-liquidity')}
                >
                  My Liquidity
                </button>
              </div>
              
              {/* My Liquidity Section */}
              {activeTab === 'my-liquidity' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">My Liquidity Positions</h2>
                  </div>
                  
                  {userLiquidity.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <h3 className="text-xl font-medium mb-4">No liquidity positions found</h3>
                      <p className="text-gray-400 mb-6">Add liquidity to start earning fees and rewards</p>
                      <button
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                        onClick={() => setActiveTab('pools')}
                      >
                        View Available Pools
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userLiquidity.map(position => (
                        <motion.div
                          key={position.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="glass rounded-xl overflow-hidden"
                        >
                          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="w-8 h-8 relative mr-3">
                                <Image
                                  src={position.token.image}
                                  alt={position.token.symbol}
                                  fill
                                  className="rounded-full object-cover"
                                  unoptimized
                                />
                              </div>
                              <div>
                                <h3 className="font-medium">{position.token.symbol}-EDU Pool</h3>
                                <div className="text-xs text-gray-400">Added <span suppressHydrationWarning>{new Date(position.addedDate).toLocaleDateString()}</span></div>
                              </div>
                            </div>
                            <div className="flex">
                              <button
                                className="p-1 hover:bg-gray-700 rounded-full"
                                onClick={() => handleRemoveLiquidity(position)}
                              >
                                <MinusIcon className="w-5 h-5 text-red-400" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Pool value</span>
                                <span className="font-medium">${position.value.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Your share</span>
                                <span className="font-medium">{position.share.toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">{position.token.symbol} amount</span>
                                <span className="font-medium">{position.tokenAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">EDU amount</span>
                                <span className="font-medium">{position.eduAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">LP tokens</span>
                                <span className="font-medium">{position.lpTokens.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-800">
                              <button
                                className="w-full py-2 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors"
                                onClick={() => handleRemoveLiquidity(position)}
                              >
                                Remove Liquidity
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* Available Pools Section */}
              {activeTab === 'pools' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Available Liquidity Pools</h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-400 text-sm border-b border-gray-800">
                          <th className="text-left pb-4 pl-4">Pool</th>
                          <th className="text-right pb-4">Total Liquidity</th>
                          <th className="text-right pb-4">24h Volume</th>
                          <th className="text-right pb-4">APR</th>
                          <th className="text-right pb-4">My Share</th>
                          <th className="text-right pb-4 pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liquidityPools.map(pool => (
                          <tr key={pool.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                            <td className="py-4 pl-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 relative mr-3">
                                  <Image
                                    src={pool.token.image}
                                    alt={pool.token.symbol}
                                    fill
                                    className="rounded-full object-cover"
                                    unoptimized
                                  />
                                </div>
                                <div>
                                  <div className="font-medium">{pool.token.symbol}-EDU</div>
                                  <div className="text-gray-400 text-sm">{pool.token.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-right">${pool.totalLiquidity.toLocaleString()}</td>
                            <td className="py-4 text-right">${pool.volume24h.toLocaleString()}</td>
                            <td className="py-4 text-right text-green-400">{pool.apr.toFixed(1)}%</td>
                            <td className="py-4 text-right">{pool.myShare.toFixed(2)}%</td>
                            <td className="py-4 pr-4 text-right">
                              <button
                                className="px-3 py-1 bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 rounded-lg text-sm transition-colors"
                                onClick={() => handleTokenSelect(pool.token)}
                              >
                                Add Liquidity
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Add Liquidity Modal */}
      {showAddLiquidity && selectedToken && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Add Liquidity</h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowAddLiquidity(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Token Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Token Amount</label>
                  <div className="glass-dark rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 relative mr-2">
                          <Image
                            src={selectedToken.image}
                            alt={selectedToken.symbol}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                        <span>{selectedToken.symbol}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Balance: </span>
                        <span>1,000</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <input
                        type="number"
                        className="w-full bg-transparent focus:outline-none text-right text-lg"
                        placeholder="0.0"
                        value={tokenAmount}
                        onChange={(e) => {
                          setTokenAmount(e.target.value);
                          // Calculate EDU amount based on token's price
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setEduAmount((value * selectedToken.price).toFixed(6));
                          } else {
                            setEduAmount('');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                </div>
                
                {/* EDU Input */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">EDU Amount</label>
                  <div className="glass-dark rounded-xl p-4">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-6 h-6 relative mr-2">
                          <Image
                            src="/images/token-edu.png"
                            alt="EDU"
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                        <span>EDU</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">Balance: </span>
                        <span>{eduBalance || '0'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2">
                      <input
                        type="number"
                        className="w-full bg-transparent focus:outline-none text-right text-lg"
                        placeholder="0.0"
                        value={eduAmount}
                        onChange={(e) => {
                          setEduAmount(e.target.value);
                          // Calculate token amount based on token's price
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            setTokenAmount((value / selectedToken.price).toFixed(6));
                          } else {
                            setTokenAmount('');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="glass-dark rounded-xl p-4">
                  <h4 className="font-medium mb-3">You will receive</h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-6 h-6 relative mr-2">
                        <Image
                          src={selectedToken.image}
                          alt={`${selectedToken.symbol}-EDU LP`}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                      </div>
                      <span>{selectedToken.symbol}-EDU LP</span>
                    </div>
                    <div className="font-medium">{calculateLpTokens()}</div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Exchange rate</span>
                    <span>1 {selectedToken.symbol} = {selectedToken.price} EDU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Share of pool</span>
                    <span>{calculatePoolShare()}%</span>
                  </div>
                </div>
                
                <button
                  className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors"
                  onClick={handleAddLiquidity}
                >
                  Add Liquidity
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Remove Liquidity Modal */}
      {showRemoveLiquidity && selectedLiquidity && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Remove Liquidity</h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowRemoveLiquidity(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Pool Info */}
                <div className="flex items-center glass-dark rounded-xl p-4">
                  <div className="w-10 h-10 relative mr-4">
                    <Image
                      src={selectedLiquidity.token.image}
                      alt={selectedLiquidity.token.symbol}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedLiquidity.token.symbol}-EDU Pool</h4>
                    <div className="text-sm text-gray-400">Your share: {selectedLiquidity.share.toFixed(2)}%</div>
                  </div>
                </div>
                
                {/* Percentage Slider */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Amount to remove: {removePercentage}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={removePercentage}
                    onChange={(e) => setRemovePercentage(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="glass-dark rounded-xl p-4">
                  <h4 className="font-medium mb-3">You will receive</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-6 relative mr-2">
                          <Image
                            src={selectedLiquidity.token.image}
                            alt={selectedLiquidity.token.symbol}
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                        <span>{selectedLiquidity.token.symbol}</span>
                      </div>
                      <div className="font-medium">
                        {(selectedLiquidity.tokenAmount * (removePercentage / 100)).toFixed(6)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-6 h-6 relative mr-2">
                          <Image
                            src="/images/token-edu.png"
                            alt="EDU"
                            fill
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        </div>
                        <span>EDU</span>
                      </div>
                      <div className="font-medium">
                        {(selectedLiquidity.eduAmount * (removePercentage / 100)).toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 transition-colors"
                  onClick={confirmRemoveLiquidity}
                >
                  Remove Liquidity
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}