'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import {
  ArrowsUpDownIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  PlusIcon,
  XMarkIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowsRightLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Line, Bar, Chart } from 'react-chartjs-2';
import { updateEduBalance } from '@/utils/balance-operations';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Token interface
interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price: number;
  change: string;
  volume: string;
  balance: string;
}

// Transaction interface
interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  tokenA: string;
  amountA: string;
  tokenB: string;
  amountB: string;
  price: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
  txHash: string;
}

// Mock token data
const mockTokens: Token[] = [
  { 
    id: '1', 
    symbol: 'EDU', 
    name: 'Education DAO', 
    image: '/images/token-edu.png', 
    price: 1.0, 
    change: '+2.5%', 
    volume: '1,234,567', 
    balance: '1,000' 
  },
  { 
    id: '2', 
    symbol: 'BLK', 
    name: 'Blockchain Basics', 
    image: '/images/token-blk.png', 
    price: 0.5, 
    change: '+5.7%', 
    volume: '567,890', 
    balance: '200' 
  },
  { 
    id: '3', 
    symbol: 'SC', 
    name: 'Smart Contracts', 
    image: '/images/token-sc.png', 
    price: 0.75, 
    change: '-1.2%', 
    volume: '345,678', 
    balance: '150' 
  },
  { 
    id: '4', 
    symbol: 'SF', 
    name: 'Solidity Fundamentals', 
    image: '/images/token-sf.png', 
    price: 0.65, 
    change: '+3.8%', 
    volume: '234,567', 
    balance: '0' 
  },
  { 
    id: '5', 
    symbol: 'DEFI', 
    name: 'DeFi Applications', 
    image: '/images/token-defi.png', 
    price: 0.85, 
    change: '+0.5%', 
    volume: '789,012', 
    balance: '50' 
  },
];

// Mock transaction data
const transactions: Transaction[] = [
  { 
    id: '1', 
    type: 'buy', 
    tokenA: 'EDU', 
    amountA: '100', 
    tokenB: 'BLK', 
    amountB: '200', 
    price: '0.5', 
    time: '2 min ago', 
    status: 'completed', 
    txHash: '0x1234...5678' 
  },
  { 
    id: '2', 
    type: 'sell', 
    tokenA: 'SC', 
    amountA: '50', 
    tokenB: 'EDU', 
    amountB: '37.5', 
    price: '0.75', 
    time: '15 min ago', 
    status: 'completed', 
    txHash: '0x2345...6789' 
  },
  { 
    id: '3', 
    type: 'buy', 
    tokenA: 'EDU', 
    amountA: '200', 
    tokenB: 'SF', 
    amountB: '307.69', 
    price: '0.65', 
    time: '1 hour ago', 
    status: 'completed', 
    txHash: '0x3456...7890' 
  },
  { 
    id: '4', 
    type: 'buy', 
    tokenA: 'EDU', 
    amountA: '85', 
    tokenB: 'DEFI', 
    amountB: '100', 
    price: '0.85', 
    time: '3 hours ago', 
    status: 'completed', 
    txHash: '0x4567...8901' 
  },
  { 
    id: '5', 
    type: 'sell', 
    tokenA: 'BLK', 
    amountA: '75', 
    tokenB: 'EDU', 
    amountB: '37.5', 
    price: '0.5', 
    time: '5 hours ago', 
    status: 'completed', 
    txHash: '0x5678...9012' 
  },
];

// Generate chart data
const generateChartData = (fromSymbol: string, toSymbol: string, tokensList: Token[]) => {
  // Generate random price data based on token symbol hash
  const pairHash = (fromSymbol + toSymbol).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seedRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  
  const random = seedRandom(pairHash);
  
  // Generate labels (last 30 days, daily)
  const labels = Array.from({length: 30}).map((_, i) => {
    const now = new Date();
    now.setDate(now.getDate() - 29 + i);
    return now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });
  
  // Generate price data with trend based on the token's change percentage
  const fromToken = tokensList.find(t => t.symbol === fromSymbol) || tokensList[0];
  const toToken = tokensList.find(t => t.symbol === toSymbol) || tokensList[1];
  
  // Calculate base price based on the exchange rate between tokens
  let basePrice = toToken.price / fromToken.price;
  
  // Determine trend from change percentages
  const fromChange = parseFloat(fromToken.change);
  const toChange = parseFloat(toToken.change);
  const trend = toChange > fromChange ? 1 : -1;
  
  const priceData = labels.map((_, i) => {
    if (i > 0) {
      // Add some randomness but follow the general trend
      const randomFactor = random() * 0.04 - 0.02; // Random factor between -0.02 and 0.02
      const trendFactor = (trend * 0.005) * (i / labels.length); // Stronger trend towards the end
      basePrice = basePrice * (1 + randomFactor + trendFactor);
    }
    return basePrice;
  });
  
  // Generate volume data
  const volumeData = labels.map(() => {
    return random() * 100000 + 50000;
  });
  
  // Generate candlestick data
  const openData: number[] = [];
  const closeData: number[] = [];
  const highData: number[] = [];
  const lowData: number[] = [];
  
  for (let i = 0; i < labels.length; i++) {
    const open = priceData[i];
    const close = i < labels.length - 1 ? priceData[i + 1] : open * (1 + (random() * 0.04 - 0.02));
    const high = Math.max(open, close) * (1 + random() * 0.01);
    const low = Math.min(open, close) * (1 - random() * 0.01);
    
    openData.push(open);
    closeData.push(close);
    highData.push(high);
    lowData.push(low);
  }
  
  return {
    labels,
    datasets: [
      {
        label: `${toSymbol}/${fromSymbol} Price`,
        data: priceData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ],
    volumeDataset: {
      label: 'Volume',
      data: volumeData,
      backgroundColor: volumeData.map((_, i) => {
        // Green if price went up, red if it went down
        return i < openData.length - 1 && closeData[i] >= openData[i] 
          ? 'rgba(74, 222, 128, 0.6)' 
          : 'rgba(248, 113, 113, 0.6)';
      })
    },
    candlestickData: {
      open: openData,
      close: closeData,
      high: highData,
      low: lowData
    }
  };
};

export default function Trade() {
  const { walletAddress, isConnected, eduBalance } = useWeb3();
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [fromToken, setFromToken] = useState<Token>(mockTokens[0]); // Default to EDU
  const [toToken, setToToken] = useState<Token>(mockTokens[1]); // Default to second token
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [showTokenSelectFrom, setShowTokenSelectFrom] = useState<boolean>(false);
  const [showTokenSelectTo, setShowTokenSelectTo] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1M');
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  
  // Chart data
  const chartData = useMemo(() => {
    return generateChartData(fromToken.symbol, toToken.symbol, tokens);
  }, [fromToken.symbol, toToken.symbol, tokens]);
  
  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
        y: {
          position: 'left' as const,
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
        y1: {
          position: 'right' as const,
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
          },
          grid: {
            display: false,
          },
          max: Math.max(...chartData.volumeDataset.data) * 2,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleColor: 'rgba(255, 255, 255, 0.9)',
          bodyColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: 'rgba(139, 92, 246, 0.7)',
          borderWidth: 1,
          callbacks: {
            label: function(context: any) {
              const datasetLabel = context.dataset.label || '';
              const value = context.raw;
              if (datasetLabel.includes('Volume')) {
                return `${datasetLabel}: ${value.toLocaleString()}`;
              }
              return `${datasetLabel}: ${value.toFixed(6)} EDU`;
            }
          }
        },
      },
    };
  }, [chartData]);
  
  // Use effect to calculate to amount when from amount changes
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const fromValue = parseFloat(fromAmount);
      if (!isNaN(fromValue)) {
        const exchangeRate = toToken.price / fromToken.price;
        setToAmount((fromValue * exchangeRate).toFixed(6));
      } else {
        setToAmount('');
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);
  
  // Handle token switch
  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    // toAmount will be recalculated by the useEffect
  };
  
  // Handle token selection for "from" token
  const handleSelectFromToken = (token: Token) => {
    if (token.id === toToken.id) {
      // If selected token is same as "to" token, swap them
      setFromToken(toToken);
      setToToken(token);
    } else {
      setFromToken(token);
    }
    setShowTokenSelectFrom(false);
  };
  
  // Handle token selection for "to" token
  const handleSelectToToken = (token: Token) => {
    if (token.id === fromToken.id) {
      // If selected token is same as "from" token, swap them
      setToToken(fromToken);
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenSelectTo(false);
  };
  
  // Handle token swap submission
  const handleSwap = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error('Please enter a valid amount to swap');
      return;
    }
    
    const fromValue = parseFloat(fromAmount);
    const fromBalance = parseFloat(fromToken.balance.replace(/,/g, ''));
    
    if (fromValue > fromBalance) {
      toast.error(`Insufficient ${fromToken.symbol} balance`);
      return;
    }
    
    // 检查并更新EDU余额（每次交换扣除1 EDU作为交易费用）
    const swapFee = "10"; // 交换代币需要1 EDU作为交易费
    const currentBalance = localStorage.getItem('eduBalance');
    if (!currentBalance || parseFloat(currentBalance) < parseFloat(swapFee)) {
      toast.error(`交换代币需要${swapFee} EDU作为交易费，您的余额不足`);
      return;
    }
    
    // 扣减交易费用
    const didUpdateBalance = updateEduBalance(`-${swapFee}`, '代币交换手续费');
    if (!didUpdateBalance) {
      return; // updateEduBalance函数会显示错误消息
    }
    
    // Simulate loading state (API call in real app)
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 5000);
          resolve(true);
        }, 1500);
      }),
      {
        loading: 'Processing swap...',
        success: `Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`,
        error: 'Failed to process swap',
      }
    );
    
    // Clear inputs after successful swap
    setFromAmount('');
    // toAmount will be cleared by useEffect
  };
  
  // Handle from amount max
  const handleFromAmountMax = () => {
    setFromAmount(fromToken.balance.replace(/,/g, ''));
  };
  
  // Create combined data for K-line chart
  const kLineData = {
    labels: chartData.labels,
    datasets: [
      // Price line
      {
        type: 'line' as const,
        label: `${toToken.symbol}/${fromToken.symbol} Price`,
        data: chartData.datasets[0].data,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
        order: 0
      },
      // Volume bars
      {
        type: 'bar' as const,
        label: 'Volume',
        data: chartData.volumeDataset.data,
        backgroundColor: chartData.volumeDataset.backgroundColor,
        yAxisID: 'y1',
        order: 1
      }
    ]
  };
  
  // 添加 useEffect 从本地存储加载新创建的课程代币
  useEffect(() => {
    try {
      // 获取本地存储中的代币数据
      const createdTradeTokensJson = localStorage.getItem('createdTradeTokens');
      
      // 初始化代币列表
      let allTokens = [...mockTokens];
      
      if (createdTradeTokensJson) {
        const createdTradeTokens = JSON.parse(createdTradeTokensJson);
        
        // 确保每个创建的代币有唯一的 ID
        const existingIds = new Set(allTokens.map(token => token.id));
        
        // 将创建的代币添加到代币列表
        createdTradeTokens.forEach((token: Token) => {
          // 确保不会重复添加相同 ID 的代币
          if (!existingIds.has(token.id)) {
            allTokens.push(token);
            existingIds.add(token.id);
          }
        });
        
        console.log("已加载创建的课程代币:", createdTradeTokens.length);
      }
      
      // 更新代币列表状态
      setTokens(allTokens);
      // 更新选中的代币
      setFromToken(allTokens[0]);
      if (allTokens.length > 1) {
        setToToken(allTokens[1]);
      }
    } catch (error) {
      console.error("加载创建的课程代币失败:", error);
      // 如果出错，至少确保使用模拟数据
      setTokens(mockTokens);
    }
  }, []);
  
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
          <h1 className="text-4xl font-bold mb-4 gradient-text">Exchange</h1>
          <p className="text-xl text-gray-400">Swap and trade education tokens with low fees</p>
        </motion.div>
        
        {/* Main Content Grid */}
        <div className="flex flex-col space-y-8">
          {/* Price Chart and Swap Section - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Price Chart Section - Left Side (2/3 width) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 glass rounded-xl overflow-hidden p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 relative">
                      <Image
                        src={toToken.image}
                        alt={toToken.symbol}
                        fill
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="font-semibold text-lg">{toToken.symbol}/{fromToken.symbol}</span>
                  </div>
                  <div className="ml-4 px-2 py-1 rounded-full bg-gray-800 text-xs">
                    <span className={toToken.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                      {toToken.change}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {(['1D', '1W', '1M', '1Y'] as const).map((timeframe) => (
                    <button
                      key={timeframe}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        selectedTimeframe === timeframe 
                          ? 'bg-indigo-600/30 text-indigo-400' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedTimeframe(timeframe)}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-96">
                <Chart type="bar" data={kLineData} options={chartOptions} />
              </div>
              
              <div className="mt-4 flex justify-between text-sm text-gray-400">
                <div>Volume: {toToken.volume} {toToken.symbol}</div>
                <div>Last updated: <span suppressHydrationWarning>{new Date().toLocaleString()}</span></div>
              </div>
            </motion.div>
            
            {/* Swap Panel - Right Side (1/3 width) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="glass rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-2xl font-semibold">Swap Tokens</h2>
                  <p className="text-sm text-gray-400 mt-2">
                    Trade between any EDU course tokens
                  </p>
                </div>
                
                <div className="p-6">
                  {/* From Token Input */}
                  <div className="glass-dark rounded-xl mb-4">
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-400">From</label>
                        <div className="text-sm">
                          <span className="text-gray-400">Balance: </span>
                          <span>{fromToken.balance}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg px-3 py-2"
                          onClick={() => setShowTokenSelectFrom(true)}
                        >
                          <div className="w-6 h-6 relative">
                            <Image
                              src={fromToken.image}
                              alt={fromToken.symbol}
                              fill
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          </div>
                          <span>{fromToken.symbol}</span>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        <input
                          type="number"
                          value={fromAmount}
                          onChange={(e) => setFromAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-transparent text-right focus:outline-none text-lg"
                        />
                      </div>
                      
                      <div className="flex justify-end mt-2">
                        <button
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                          onClick={handleFromAmountMax}
                        >
                          MAX
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Token Switch Button */}
                  <div className="flex justify-center -my-2 relative z-10">
                    <button
                      className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
                      onClick={handleSwitchTokens}
                    >
                      <ArrowsRightLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* To Token Input */}
                  <div className="glass-dark rounded-xl mb-6 mt-4">
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <label className="text-sm text-gray-400">To</label>
                        <div className="text-sm">
                          <span className="text-gray-400">Balance: </span>
                          <span>{toToken.balance}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg px-3 py-2"
                          onClick={() => setShowTokenSelectTo(true)}
                        >
                          <div className="w-6 h-6 relative">
                            <Image
                              src={toToken.image}
                              alt={toToken.symbol}
                              fill
                              className="rounded-full object-cover"
                              unoptimized
                            />
                          </div>
                          <span>{toToken.symbol}</span>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        <input
                          type="number"
                          value={toAmount}
                          readOnly
                          placeholder="0.0"
                          className="w-full bg-transparent text-right focus:outline-none text-lg"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Exchange Rate */}
                  <div className="flex justify-between text-sm text-gray-400 mb-6">
                    <span>Exchange Rate</span>
                    <span>1 {fromToken.symbol} = {(toToken.price / fromToken.price).toFixed(6)} {toToken.symbol}</span>
                  </div>
                  
                  {/* Success Message */}
                  {showSuccessMessage && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                      <div className="flex items-center text-green-400">
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Swap completed successfully!</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Swap Button */}
                  <button
                    className={`w-full py-3 rounded-xl font-medium ${
                      isConnected 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
                        : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={handleSwap}
                    disabled={!isConnected}
                  >
                    {!isConnected 
                      ? 'Connect Wallet to Swap' 
                      : !fromAmount 
                        ? 'Enter an amount' 
                        : 'Swap'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Transactions Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Recent Transactions</h2>
              <button className="text-gray-400 hover:text-white transition-colors">
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-800">
                      <th className="text-left pb-4 pl-4">Type</th>
                      <th className="text-left pb-4">Price</th>
                      <th className="text-left pb-4">From</th>
                      <th className="text-left pb-4">To</th>
                      <th className="text-left pb-4">Time</th>
                      <th className="text-left pb-4">Status</th>
                      <th className="text-right pb-4 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-800 text-sm hover:bg-gray-800/30">
                        <td className="py-4 pl-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tx.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.type === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td className="py-4">{tx.price} {tx.tokenA}</td>
                        <td className="py-4">
                          <div className="flex items-center">
                            <span className="mr-1">{tx.amountA}</span>
                            <span>{tx.tokenA}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center">
                            <span className="mr-1">{tx.amountB}</span>
                            <span>{tx.tokenB}</span>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400">{tx.time}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                            tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right">
                          <button className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-end" onClick={() => toast(`Transaction Hash: ${tx.txHash}`)}>
                            <span className="mr-1">View</span>
                            <ChevronRightIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
          
          {/* Token List Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass rounded-xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-semibold">Available Tokens</h2>
              <p className="text-sm text-gray-400 mt-2">
                All tradable education tokens on the platform
              </p>
            </div>
            
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-800">
                      <th className="text-left pb-4 pl-4">Token</th>
                      <th className="text-right pb-4">Price</th>
                      <th className="text-right pb-4">24h Change</th>
                      <th className="text-right pb-4">Volume</th>
                      <th className="text-right pb-4">Your Balance</th>
                      <th className="text-right pb-4 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token) => (
                      <tr key={token.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="py-4 pl-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 relative mr-3">
                              <Image
                                src={token.image}
                                alt={token.symbol}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <div className="font-medium">{token.name}</div>
                              <div className="text-gray-400 text-sm">{token.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right">{token.price} EDU</td>
                        <td className="py-4 text-right">
                          <span className={token.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                            {token.change}
                          </span>
                        </td>
                        <td className="py-4 text-right">{token.volume}</td>
                        <td className="py-4 text-right">{token.balance}</td>
                        <td className="py-4 pr-4 text-right">
                          <button
                            className="px-3 py-1 bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 rounded-lg text-sm transition-colors"
                            onClick={() => {
                              setFromToken(tokens[0]); // Set from token to EDU
                              setToToken(token); // Set to token to the selected token
                              // Scroll to swap section
                              document.querySelector('.glass')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Token Select Modals */}
      {showTokenSelectFrom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Select a token</h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowTokenSelectFrom(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {tokens.map((token) => (
                <button
                  key={token.id}
                  className="w-full flex items-center p-3 hover:bg-gray-800/50 rounded-lg transition-colors mb-2"
                  onClick={() => handleSelectFromToken(token)}
                >
                  <div className="w-8 h-8 relative mr-3">
                    <Image
                      src={token.image}
                      alt={token.symbol}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{token.name}</div>
                    <div className="text-gray-400 text-sm">{token.symbol}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div>{token.balance}</div>
                    <div className="text-gray-400 text-sm">{token.price} EDU</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
      
      {showTokenSelectTo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl w-full max-w-md"
          >
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Select a token</h3>
              <button
                className="text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowTokenSelectTo(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {tokens.map((token) => (
                <button
                  key={token.id}
                  className="w-full flex items-center p-3 hover:bg-gray-800/50 rounded-lg transition-colors mb-2"
                  onClick={() => handleSelectToToken(token)}
                >
                  <div className="w-8 h-8 relative mr-3">
                    <Image
                      src={token.image}
                      alt={token.symbol}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{token.name}</div>
                    <div className="text-gray-400 text-sm">{token.symbol}</div>
                  </div>
                  <div className="ml-auto text-right">
                    <div>{token.balance}</div>
                    <div className="text-gray-400 text-sm">{token.price} EDU</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 