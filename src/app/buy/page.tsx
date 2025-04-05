'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import BuyTokenSection from '@/components/BuyTokenSection';
import {
  ChevronRightIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckIcon,
  XMarkIcon
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
  TimeScale,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Chart, Bar } from 'react-chartjs-2';

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
  TimeScale
);

// Token interface
interface CourseToken {
  id: string;
  symbol: string;
  name: string;
  price: string;
  change: string;
  description: string;
  image: string;
  supply: string;
  holders: number;
  createdAt: string;
  courseId: string;
  category: string;
  instructor: string;
  level: string;
  duration: string;
  students: number;
  popularity: 'high' | 'medium' | 'low';
}

// Order interface
interface Order {
  id: string;
  tokenSymbol: string;
  amount: string;
  price: string;
  total: string;
  filled: string;
  status: 'open' | 'filled' | 'canceled';
  timestamp: number;
}

// Mock course tokens data
const mockCourseTokens: CourseToken[] = [
  {
    id: 'blk',
    symbol: 'BLK',
    name: 'Blockchain Fundamentals',
    price: '0.25',
    change: '+5.7%',
    description: 'A comprehensive introduction to blockchain technology and its applications.',
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supply: '1,000,000',
    holders: 534,
    createdAt: '2023-06-15',
    courseId: '1',
    category: 'Blockchain',
    instructor: 'Alex Johnson',
    level: 'Beginner',
    duration: '10 hours',
    students: 1245,
    popularity: 'high'
  },
  {
    id: 'scd',
    symbol: 'SCD',
    name: 'Smart Contract Development',
    price: '0.15',
    change: '-1.2%',
    description: 'Learn to develop secure and efficient smart contracts on multiple blockchain platforms.',
    image: 'https://images.unsplash.com/photo-1659606236737-de86dc9d9e67?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supply: '800,000',
    holders: 328,
    createdAt: '2023-07-22',
    courseId: '2',
    category: 'Development',
    instructor: 'Sarah Chen',
    level: 'Intermediate',
    duration: '15 hours',
    students: 875,
    popularity: 'medium'
  },
  {
    id: 'defi',
    symbol: 'DEFI',
    name: 'DeFi Principles',
    price: '0.3',
    change: '+8.3%',
    description: 'Explore the fundamentals of decentralized finance and its impact on the financial industry.',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supply: '1,200,000',
    holders: 678,
    createdAt: '2023-05-10',
    courseId: '3',
    category: 'Finance',
    instructor: 'Michael Rodriguez',
    level: 'Advanced',
    duration: '12 hours',
    students: 1567,
    popularity: 'high'
  },
  {
    id: 'py',
    symbol: 'PY',
    name: 'Python for Web3',
    price: '0.18',
    change: '+3.6%',
    description: 'Master Python programming for blockchain development and Web3 applications.',
    image: 'https://images.unsplash.com/photo-1526379879527-8559ecfcb0c8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supply: '950,000',
    holders: 412,
    createdAt: '2023-08-05',
    courseId: '4',
    category: 'Development',
    instructor: 'Emily Williams',
    level: 'Intermediate',
    duration: '14 hours',
    students: 932,
    popularity: 'medium'
  },
  {
    id: 'zkp',
    symbol: 'ZKP',
    name: 'Zero-Knowledge Proofs',
    price: '0.45',
    change: '+12.3%',
    description: 'Deep dive into zero-knowledge proofs and their applications in privacy and security.',
    image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    supply: '600,000',
    holders: 215,
    createdAt: '2023-09-18',
    courseId: '5',
    category: 'Security',
    instructor: 'David Kim',
    level: 'Advanced',
    duration: '16 hours',
    students: 645,
    popularity: 'high'
  }
];

// Mock open orders
const mockOrders: Order[] = [
  {
    id: '1',
    tokenSymbol: 'DEFI',
    amount: '100',
    price: '0.3',
    total: '30',
    filled: '0',
    status: 'open',
    timestamp: Date.now() - 1000 * 60 * 30 // 30 minutes ago
  },
  {
    id: '2',
    tokenSymbol: 'BLK',
    amount: '50',
    price: '0.25',
    total: '12.5',
    filled: '50',
    status: 'filled',
    timestamp: Date.now() - 1000 * 60 * 60 * 2 // 2 hours ago
  },
  {
    id: '3',
    tokenSymbol: 'SCD',
    amount: '75',
    price: '0.15',
    total: '11.25',
    filled: '25',
    status: 'canceled',
    timestamp: Date.now() - 1000 * 60 * 60 * 5 // 5 hours ago
  }
];

// Generate mock chart data for token
const generateTokenChartData = (symbol: string) => {
  // Generate random price data based on token symbol hash
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seedRandom = (seed: number) => {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  };
  
  const random = seedRandom(hash);
  
  // Generate labels (last 30 days, daily)
  const labels = Array.from({length: 30}).map((_, i) => {
    const now = new Date();
    now.setDate(now.getDate() - 29 + i);
    return now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  });
  
  // Generate price data with trend based on the token's change percentage
  const change = parseFloat(symbol === 'EDU' ? '+2.5%' : '+5.7%');
  const trend = change > 0 ? 1 : -1;
  
  let basePrice = 0.1 + random() * 0.5; // Base price between 0.1 and 0.6
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
        label: `${symbol} Price`,
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

// Token price chart component
const TokenPriceChart = ({ token }: { token: CourseToken }) => {
  const { data: kLineData, options } = React.useMemo(() => {
    const chartData = generateTokenChartData(token.symbol);
    
    // Create combined data for K-line effect
    const kLineData = {
      labels: chartData.labels,
      datasets: [
        // Price line
        {
          type: 'line' as const,
          label: `${token.symbol} Price`,
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
    
    const options = {
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
              return `${datasetLabel}: ${value.toFixed(4)} EDU`;
            }
          }
        },
      },
    };
    
    return {
      data: kLineData,
      options
    };
  }, [token.symbol]);

  return (
    <div className="glass-dark rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Price Chart</h4>
      </div>
      
      <div className="h-64">
        <Chart type="bar" data={kLineData} options={options} />
      </div>
      
      <div className="mt-4 flex justify-between text-xs text-gray-400">
        <div>Volume (24h): {(Math.random() * 100000).toLocaleString()} EDU</div>
        <div>Updated: <span suppressHydrationWarning>{new Date().toLocaleString()}</span></div>
      </div>
    </div>
  );
};

export default function BuyPage() {
  const { walletAddress, isConnected } = useWeb3();
  const [tokens, setTokens] = useState<CourseToken[]>(mockCourseTokens);
  const [selectedToken, setSelectedToken] = useState<CourseToken | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [buyTotal, setBuyTotal] = useState<string>('0');
  const [buyLoading, setBuyLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popularity');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Filter tokens by search query and category
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || token.category.toLowerCase() === categoryFilter.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  // Sort tokens
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (sortBy === 'popularity') {
      const popularityRank = { 'high': 3, 'medium': 2, 'low': 1 };
      return popularityRank[b.popularity] - popularityRank[a.popularity];
    }
    
    if (sortBy === 'price_asc') {
      return parseFloat(a.price) - parseFloat(b.price);
    }
    
    if (sortBy === 'price_desc') {
      return parseFloat(b.price) - parseFloat(a.price);
    }
    
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    
    return 0;
  });

  // Select a token
  const handleSelectToken = (token: CourseToken) => {
    setSelectedToken(token);
    setBuyPrice(token.price);
  };

  // Close token details
  const handleCloseDetails = () => {
    setSelectedToken(null);
    setBuyAmount('');
    setBuyPrice('');
    setBuyTotal('0');
  };

  // Calculate total
  useEffect(() => {
    if (buyAmount && buyPrice) {
      const amount = parseFloat(buyAmount);
      const price = parseFloat(buyPrice);
      
      if (!isNaN(amount) && !isNaN(price)) {
        setBuyTotal((amount * price).toFixed(6));
      } else {
        setBuyTotal('0');
      }
    } else {
      setBuyTotal('0');
    }
  }, [buyAmount, buyPrice]);

  // Buy token
  const handleBuyToken = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    if (!selectedToken) {
      toast.error('Please select a token');
      return;
    }
    
    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!buyPrice || parseFloat(buyPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    try {
      setBuyLoading(true);
      
      // In a real application, this would call a smart contract
      // For demo purposes, simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new order
      const newOrder: Order = {
        id: `${orders.length + 1}`,
        tokenSymbol: selectedToken.symbol,
        amount: buyAmount,
        price: buyPrice,
        total: buyTotal,
        filled: '0',
        status: 'open',
        timestamp: Date.now()
      };
      
      setOrders([newOrder, ...orders]);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      toast.success(`Order placed for ${buyAmount} ${selectedToken.symbol}`);
      
      // Reset form
      setBuyAmount('');
      
    } catch (error: any) {
      console.error('Order failed:', error);
      toast.error(`Order failed: ${error.message || 'Unknown error'}`);
    } finally {
      setBuyLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (typeof window === 'undefined') {
      return ''; // 服务端返回空字符串
    }
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Token categories
  const categories = ['all', 'blockchain', 'development', 'finance', 'security'];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Buy Tokens</h1>
          <p className="text-xl text-gray-400">Purchase EDU and course tokens for learning and trading</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* EDU Token section - left */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass rounded-xl overflow-hidden sticky top-24"
            >
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-2xl font-semibold">Buy EDU Token</h2>
                <p className="text-sm text-gray-400 mt-2">
                  EDU is the governance token of the platform
                </p>
              </div>
              
              <div className="p-6">
                <BuyTokenSection />
              </div>
            </motion.div>
          </div>
          
          {/* Course tokens section - right */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="glass rounded-xl overflow-hidden h-full"
            >
              {!selectedToken ? (
                /* Token list view */
                <>
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-semibold">Course Tokens</h2>
                    
                    <div className="mt-4 flex flex-col md:flex-row gap-4">
                      {/* Search */}
                      <div className="flex-1">
                        <input
                          type="text"
                          className="w-full glass-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                          placeholder="Search tokens..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      {/* Category filter */}
                      <div className="w-full md:w-48">
                        <select
                          className="w-full glass-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                          {categories.map((category, index) => (
                            <option key={index} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Sort */}
                      <div className="w-full md:w-48">
                        <select
                          className="w-full glass-dark rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="popularity">Popularity</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                          <option value="name">Name</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {sortedTokens.length > 0 ? (
                        sortedTokens.map(token => (
                          <div
                            key={token.id}
                            className="glass-dark rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                            onClick={() => handleSelectToken(token)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                                  <Image 
                                    src={token.image} 
                                    alt={token.symbol}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                                
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-lg">{token.symbol}</span>
                                    <span className="text-gray-400">{token.name}</span>
                                  </div>
                                  <div className="text-sm text-gray-400 mt-1 line-clamp-1">
                                    {token.description}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-bold">{token.price} EDU</div>
                                <div className={`text-sm ${
                                  parseFloat(token.change) > 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {token.change}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 flex flex-wrap gap-3">
                              <div className="bg-gray-800 rounded-full px-3 py-1 text-xs flex items-center">
                                <BookOpenIcon className="h-3 w-3 mr-1" />
                                {token.category}
                              </div>
                              <div className="bg-gray-800 rounded-full px-3 py-1 text-xs flex items-center">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {token.duration}
                              </div>
                              <div className="bg-gray-800 rounded-full px-3 py-1 text-xs flex items-center">
                                <UserGroupIcon className="h-3 w-3 mr-1" />
                                {token.students.toLocaleString()} students
                              </div>
                              {token.popularity === 'high' && (
                                <div className="bg-indigo-800/30 text-indigo-400 rounded-full px-3 py-1 text-xs flex items-center">
                                  <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                  Popular
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
                              <div>Supply: {token.supply}</div>
                              <div className="flex items-center">
                                <ChevronRightIcon className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <XMarkIcon className="h-8 w-8 opacity-50" />
                          </div>
                          <p>No tokens found matching your filters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Token detail view */
                <>
                  <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-2xl font-semibold flex items-center">
                      <button
                        className="mr-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
                        onClick={handleCloseDetails}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {selectedToken.symbol} Token
                    </h2>
                    
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      parseFloat(selectedToken.change) > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedToken.change}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Token info - left & middle columns */}
                      <div className="md:col-span-2">
                        <div className="glass-dark rounded-lg p-4 mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden relative">
                              <Image 
                                src={selectedToken.image} 
                                alt={selectedToken.symbol}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            
                            <div>
                              <h3 className="text-xl font-bold">{selectedToken.name}</h3>
                              <div className="text-sm text-gray-400 mt-1">{selectedToken.symbol} • {selectedToken.category}</div>
                            </div>
                          </div>
                          
                          <p className="mt-4 text-gray-300">
                            {selectedToken.description}
                          </p>
                          
                          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Current Price</div>
                              <div className="font-bold">{selectedToken.price} EDU</div>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Total Supply</div>
                              <div className="font-bold">{selectedToken.supply}</div>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Holders</div>
                              <div className="font-bold">{selectedToken.holders}</div>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="text-xs text-gray-400 mb-1">Created</div>
                              <div className="font-bold">{selectedToken.createdAt}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Add token price chart */}
                        <TokenPriceChart token={selectedToken} />
                        
                        <div className="glass-dark rounded-lg p-4">
                          <h4 className="font-medium mb-4">Course Information</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Instructor</div>
                              <div className="font-medium">{selectedToken.instructor}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Level</div>
                              <div className="font-medium">{selectedToken.level}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Duration</div>
                              <div className="font-medium">{selectedToken.duration}</div>
                            </div>
                            
                            <div>
                              <div className="text-sm text-gray-400 mb-1">Students</div>
                              <div className="font-medium">{selectedToken.students.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-sm text-gray-400">Popularity</div>
                              <div className={`px-2 py-1 rounded-full text-xs ${
                                selectedToken.popularity === 'high' ? 'bg-green-500/20 text-green-400' : 
                                selectedToken.popularity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {selectedToken.popularity.charAt(0).toUpperCase() + selectedToken.popularity.slice(1)}
                              </div>
                            </div>
                            
                            <div className="w-full bg-gray-800 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                                style={{ 
                                  width: selectedToken.popularity === 'high' ? '90%' : 
                                         selectedToken.popularity === 'medium' ? '60%' : '30%' 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Buy form - right column */}
                      <div className="md:col-span-1">
                        <div className="glass-dark rounded-lg p-4 sticky top-24">
                          <h4 className="font-medium mb-4">Buy {selectedToken.symbol}</h4>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Amount</label>
                              <input
                                type="number"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.0"
                                value={buyAmount}
                                onChange={(e) => setBuyAmount(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm text-gray-400 mb-2">Price (EDU per token)</label>
                              <input
                                type="number"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="0.0"
                                value={buyPrice}
                                onChange={(e) => setBuyPrice(e.target.value)}
                              />
                              <div className="flex justify-between mt-1 text-xs text-gray-400">
                                <span>Market: {selectedToken.price} EDU</span>
                                <button 
                                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                  onClick={() => setBuyPrice(selectedToken.price)}
                                >
                                  Use market price
                                </button>
                              </div>
                            </div>
                            
                            <div className="bg-gray-800/50 rounded-lg p-3">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Total</span>
                                <span className="font-medium">{buyTotal} EDU</span>
                              </div>
                            </div>
                            
                            {showSuccess && (
                              <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 flex items-start">
                                <CheckIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">Order Placed Successfully</p>
                                  <p className="text-sm">Your order has been added to the order book</p>
                                </div>
                              </div>
                            )}
                            
                            <button
                              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                                isConnected
                                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                                  : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                              }`}
                              onClick={handleBuyToken}
                              disabled={!isConnected || buyLoading}
                            >
                              {buyLoading ? (
                                <span className="flex items-center justify-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </span>
                              ) : !isConnected ? (
                                'Connect Wallet to Buy'
                              ) : (
                                `Buy ${selectedToken.symbol}`
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Orders section */}
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Your Orders</h3>
                      
                      {orders.length > 0 ? (
                        <div className="glass-dark rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Token</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Amount</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Price</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Total</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Filled</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Status</th>
                                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orders.map(order => (
                                  <tr key={order.id} className="border-b border-gray-800">
                                    <td className="py-3 px-4 font-medium">{order.tokenSymbol}</td>
                                    <td className="py-3 px-4">{order.amount}</td>
                                    <td className="py-3 px-4">{order.price} EDU</td>
                                    <td className="py-3 px-4">{order.total} EDU</td>
                                    <td className="py-3 px-4">{order.filled}</td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        order.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : 
                                        order.status === 'filled' ? 'bg-green-500/20 text-green-400' : 
                                        'bg-red-500/20 text-red-400'
                                      }`}>
                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-400">{formatTime(order.timestamp)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="glass-dark rounded-lg p-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <ShoppingCartIcon className="h-8 w-8 text-gray-400 opacity-50" />
                          </div>
                          <p className="text-gray-400">You have no active orders</p>
                          <p className="text-sm text-gray-500 mt-2">Place an order to buy tokens</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
} 