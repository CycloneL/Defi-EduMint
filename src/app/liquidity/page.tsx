'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import { 
  ArrowPathIcon, 
  ArrowsRightLeftIcon, 
  ChevronDownIcon,
  InformationCircleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

// 定义课程代币接口
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
}

// 定义用户流动性接口
interface UserLiquidity {
  id: number;
  token: CourseToken;
  tokenAmount: number;
  ethAmount: number;
  lpTokens: number;
  value: number;
  share: number;
  addedDate: string;
}

// 模拟课程代币数据
const mockCourseTokens: CourseToken[] = [
  { 
    id: 1, 
    name: 'Solidity基础', 
    symbol: 'SOL101', 
    price: 0.00324, 
    change24h: 15.4, 
    volume24h: 12540, 
    marketCap: 54200, 
    totalSupply: 1000000,
    poolSize: 21500,
    apr: 32.5,
    popularity: 'high'
  },
  { 
    id: 2, 
    name: 'Web3开发入门', 
    symbol: 'WEB301', 
    price: 0.00178, 
    change24h: -5.2, 
    volume24h: 8750, 
    marketCap: 35600, 
    totalSupply: 2000000,
    poolSize: 15200,
    apr: 28.3,
    popularity: 'medium'
  },
  { 
    id: 3, 
    name: 'DeFi原理与应用', 
    symbol: 'DEFI201', 
    price: 0.00456, 
    change24h: 7.8, 
    volume24h: 18900, 
    marketCap: 68400, 
    totalSupply: 1500000,
    poolSize: 32400,
    apr: 25.7,
    popularity: 'high'
  },
  { 
    id: 4, 
    name: 'NFT艺术创作', 
    symbol: 'NFT101', 
    price: 0.00089, 
    change24h: 2.3, 
    volume24h: 6300, 
    marketCap: 17800, 
    totalSupply: 2000000,
    poolSize: 7800,
    apr: 48.2,
    popularity: 'low'
  },
  { 
    id: 5, 
    name: '区块链安全', 
    symbol: 'SEC301', 
    price: 0.00512, 
    change24h: -1.9, 
    volume24h: 10450, 
    marketCap: 51200, 
    totalSupply: 1000000,
    poolSize: 18600,
    apr: 30.1,
    popularity: 'medium'
  },
];

// 模拟用户流动性数据
const mockUserLiquidity: UserLiquidity[] = [
  {
    id: 1,
    token: mockCourseTokens[0],
    tokenAmount: 1250,
    ethAmount: 0.00405,
    lpTokens: 2.42,
    value: 582,
    share: 2.7,
    addedDate: '2023-04-15'
  },
  {
    id: 2,
    token: mockCourseTokens[2],
    tokenAmount: 850,
    ethAmount: 0.00388,
    lpTokens: 1.84,
    value: 420,
    share: 1.3,
    addedDate: '2023-05-01'
  }
];

export default function LiquidityPage() {
  const [activeTab, setActiveTab] = useState('add');
  const [selectedToken, setSelectedToken] = useState<CourseToken | null>(null);
  const [isTokenSelectOpen, setIsTokenSelectOpen] = useState(false);
  const [tokenAmount, setTokenAmount] = useState('');
  const [ethAmount, setEthAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeLiquidity, setActiveLiquidity] = useState<UserLiquidity | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removePercent, setRemovePercent] = useState(50);
  
  // 计算等效金额
  useEffect(() => {
    if (!selectedToken) return;
    
    if (tokenAmount && tokenAmount !== '0') {
      const amount = parseFloat(tokenAmount);
      const equivalent = amount * selectedToken.price;
      setEthAmount(equivalent.toFixed(6));
    } else if (ethAmount && ethAmount !== '0') {
      const amount = parseFloat(ethAmount);
      const equivalent = amount / selectedToken.price;
      setTokenAmount(equivalent.toFixed(2));
    }
  }, [tokenAmount, ethAmount, selectedToken]);
  
  // 处理代币选择
  const handleTokenSelect = (token: CourseToken) => {
    setSelectedToken(token);
    setIsTokenSelectOpen(false);
    setTokenAmount('');
    setEthAmount('');
  };
  
  // 添加流动性
  const handleAddLiquidity = () => {
    if (!selectedToken || !tokenAmount || !ethAmount) return;
    
    setShowConfirmModal(true);
  };
  
  // 确认添加流动性
  const confirmAddLiquidity = () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    
    // 模拟交易处理
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
      
      // 重置表单
      setTimeout(() => {
        setShowSuccessModal(false);
        setTokenAmount('');
        setEthAmount('');
      }, 3000);
    }, 2000);
  };
  
  // 处理删除流动性
  const handleRemoveLiquidity = (liquidity: UserLiquidity) => {
    setActiveLiquidity(liquidity);
    setShowRemoveModal(true);
  };
  
  // 确认删除流动性
  const confirmRemoveLiquidity = () => {
    setShowRemoveModal(false);
    setIsLoading(true);
    
    // 模拟交易处理
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessModal(true);
      
      // 重置状态
      setTimeout(() => {
        setShowSuccessModal(false);
        setActiveLiquidity(null);
        setRemovePercent(50);
      }, 3000);
    }, 2000);
  };
  
  // 计算添加流动性后获得的LP代币估计值
  const calculateLpTokens = () => {
    if (!selectedToken || !tokenAmount || !ethAmount) return 0;
    
    const tokenValue = parseFloat(tokenAmount);
    const ethValue = parseFloat(ethAmount);
    
    // 简化计算
    return Math.sqrt(tokenValue * ethValue / 1000);
  };
  
  // 计算池子份额百分比
  const calculatePoolShare = () => {
    if (!selectedToken || !tokenAmount) return 0;
    
    const tokenValue = parseFloat(tokenAmount);
    const poolSize = selectedToken.poolSize || 1;
    
    return (tokenValue / (poolSize + tokenValue)) * 100;
  };
  
  // 计算APR奖励倍数（冷门课程提供3倍奖励）
  const getRewardMultiplier = () => {
    if (!selectedToken) return 1;
    
    return selectedToken.popularity === 'low' ? 3 : 1;
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-12 px-4">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
          流动性提供
        </h1>
        
        <div className="glass rounded-xl overflow-hidden mb-8">
          {/* 标签切换 */}
          <div className="flex text-sm font-medium">
            <button
              className={`flex-1 py-4 text-center transition-colors ${
                activeTab === 'add' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('add')}
            >
              添加流动性
            </button>
            <button
              className={`flex-1 py-4 text-center transition-colors ${
                activeTab === 'my' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('my')}
            >
              我的流动性
            </button>
            <button
              className={`flex-1 py-4 text-center transition-colors ${
                activeTab === 'all' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('all')}
            >
              所有池子
            </button>
          </div>
          
          {/* 添加流动性 */}
          {activeTab === 'add' && (
            <div className="p-6">
              <p className="text-gray-300 mb-6">
                为课程代币/ETH交易对提供流动性，赚取交易费和额外EDU奖励。为冷门课程提供流动性将获得<span className="text-yellow-400 font-bold">3倍奖励</span>！
              </p>
              
              {/* 代币选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">选择课程代币</label>
                
                {!selectedToken ? (
                  <button
                    className="w-full flex items-center justify-between glass p-4 rounded-lg hover:bg-gray-700/30"
                    onClick={() => setIsTokenSelectOpen(true)}
                  >
                    <span className="text-gray-400">选择代币</span>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  </button>
                ) : (
                  <button
                    className="w-full flex items-center justify-between glass p-4 rounded-lg hover:bg-gray-700/30"
                    onClick={() => setIsTokenSelectOpen(true)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                        {selectedToken.symbol.substring(0, 1)}
                      </div>
                      <div>
                        <div className="font-medium">{selectedToken.name}</div>
                        <div className="text-sm text-gray-400">{selectedToken.symbol}</div>
                      </div>
                    </div>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
              
              {selectedToken && (
                <>
                  {/* 代币输入 */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-400">代币数量</label>
                      <div className="text-sm text-gray-400">余额: 500 {selectedToken.symbol}</div>
                    </div>
                    
                    <div className="flex items-center bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                      <input
                        type="number"
                        value={tokenAmount}
                        onChange={(e) => {
                          setTokenAmount(e.target.value);
                          setEthAmount(''); // 重置ETH输入以允许重新计算
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-lg"
                        placeholder="0.0"
                        min="0"
                      />
                      
                      <div className="ml-2 flex items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mr-1">
                          {selectedToken.symbol.substring(0, 1)}
                        </div>
                        <span>{selectedToken.symbol}</span>
                      </div>
                      
                      <button
                        className="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs"
                        onClick={() => setTokenAmount('500')}
                      >
                        最大
                      </button>
                    </div>
                  </div>
                  
                  {/* ETH输入 */}
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium text-gray-400">ETH数量</label>
                      <div className="text-sm text-gray-400">余额: 1.5 ETH</div>
                    </div>
                    
                    <div className="flex items-center bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                      <input
                        type="number"
                        value={ethAmount}
                        onChange={(e) => {
                          setEthAmount(e.target.value);
                          setTokenAmount(''); // 重置代币输入以允许重新计算
                        }}
                        className="w-full bg-transparent border-none focus:outline-none text-lg"
                        placeholder="0.0"
                        min="0"
                      />
                      
                      <div className="ml-2">
                        <span>ETH</span>
                      </div>
                      
                      <button
                        className="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs"
                        onClick={() => setEthAmount('1.5')}
                      >
                        最大
                      </button>
                    </div>
                  </div>
                  
                  {/* 流动性信息 */}
                  {(tokenAmount && ethAmount && tokenAmount !== '0' && ethAmount !== '0') && (
                    <div className="glass p-4 rounded-lg mb-6">
                      <h3 className="font-medium mb-3">添加流动性后您将获得：</h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">LP代币数量</span>
                          <span>{calculateLpTokens().toFixed(4)} LP-{selectedToken.symbol}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">占池子比例</span>
                          <span>{calculatePoolShare().toFixed(2)}%</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">预计年化收益率(APR)</span>
                          <div className="flex items-center">
                            <span>{(selectedToken.apr || 30).toFixed(1)}%</span>
                            {getRewardMultiplier() > 1 && (
                              <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                                {getRewardMultiplier()}倍奖励
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 添加流动性按钮 */}
                  <button
                    className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!tokenAmount || !ethAmount || tokenAmount === '0' || ethAmount === '0' || isLoading}
                    onClick={handleAddLiquidity}
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        添加流动性
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
          
          {/* 我的流动性 */}
          {activeTab === 'my' && (
            <div className="p-6">
              {mockUserLiquidity.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">您尚未提供任何流动性</p>
                  <button
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm"
                    onClick={() => setActiveTab('add')}
                  >
                    添加流动性
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {mockUserLiquidity.map((liquidity) => (
                    <div key={liquidity.id} className="glass rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                            {liquidity.token.symbol.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium">{liquidity.token.name}</div>
                            <div className="text-sm text-gray-400">{liquidity.token.symbol}/ETH</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${liquidity.value}</div>
                          <div className="text-sm text-gray-400">添加于 {liquidity.addedDate}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-400">LP代币</div>
                          <div>{liquidity.lpTokens.toFixed(4)} LP</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">代币数量</div>
                          <div>{liquidity.tokenAmount.toFixed(2)} {liquidity.token.symbol}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">ETH数量</div>
                          <div>{liquidity.ethAmount.toFixed(6)} ETH</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">池子占比</div>
                          <div>{liquidity.share.toFixed(2)}%</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          className="px-3 py-1.5 border border-gray-700 rounded-lg text-sm hover:bg-gray-800"
                          onClick={() => {
                            setSelectedToken(liquidity.token);
                            setActiveTab('add');
                          }}
                        >
                          添加
                        </button>
                        <button
                          className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-sm hover:bg-red-600/30"
                          onClick={() => handleRemoveLiquidity(liquidity)}
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 所有池子 */}
          {activeTab === 'all' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                      <th className="p-3">交易对</th>
                      <th className="p-3">流动性池</th>
                      <th className="p-3">APR</th>
                      <th className="p-3">我的份额</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCourseTokens.map((token) => {
                      const userLiquidity = mockUserLiquidity.find(l => l.token.id === token.id);
                      const hasLiquidity = !!userLiquidity;
                      
                      return (
                        <tr key={token.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="p-3">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                                {token.symbol.substring(0, 1)}
                              </div>
                              <div>
                                <div className="font-medium">{token.name}</div>
                                <div className="text-sm text-gray-400">{token.symbol}/ETH</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div>${token.poolSize?.toLocaleString()}</div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              <span>{token.apr}%</span>
                              {token.popularity === 'low' && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                                  3倍奖励
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {hasLiquidity ? (
                              <div>{userLiquidity.share.toFixed(2)}%</div>
                            ) : (
                              <div className="text-gray-500">-</div>
                            )}
                          </td>
                          <td className="p-3">
                            <button
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                              onClick={() => {
                                setSelectedToken(token);
                                setActiveTab('add');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {hasLiquidity ? '添加' : '提供'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 添加流动性确认模态框 */}
      {showConfirmModal && selectedToken && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full glass rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">确认添加流动性</h3>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">代币数量</span>
                <span>{tokenAmount} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-gray-400">ETH数量</span>
                <span>{ethAmount} ETH</span>
              </div>
              
              <div className="glass p-3 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">价格比率</span>
                  <span className="text-sm">1 {selectedToken.symbol} = {selectedToken.price.toFixed(6)} ETH</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">占池子比例</span>
                  <span className="text-sm">{calculatePoolShare().toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">预计获得LP代币</span>
                  <span className="text-sm">{calculateLpTokens().toFixed(4)} LP-{selectedToken.symbol}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setShowConfirmModal(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={confirmAddLiquidity}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 移除流动性模态框 */}
      {showRemoveModal && activeLiquidity && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full glass rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">移除流动性</h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                    {activeLiquidity.token.symbol.substring(0, 1)}
                  </div>
                  <div>
                    <div className="font-medium">{activeLiquidity.token.name}</div>
                    <div className="text-sm text-gray-400">{activeLiquidity.token.symbol}/ETH</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">移除百分比</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={removePercent}
                  onChange={(e) => setRemovePercent(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>0%</span>
                  <span>{removePercent}%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div className="glass p-3 rounded-lg mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">LP代币</span>
                  <span className="text-sm">
                    {(activeLiquidity.lpTokens * removePercent / 100).toFixed(4)} LP-{activeLiquidity.token.symbol}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">将收到代币</span>
                  <span className="text-sm">
                    {(activeLiquidity.tokenAmount * removePercent / 100).toFixed(2)} {activeLiquidity.token.symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">将收到ETH</span>
                  <span className="text-sm">
                    {(activeLiquidity.ethAmount * removePercent / 100).toFixed(6)} ETH
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setShowRemoveModal(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center"
                onClick={confirmRemoveLiquidity}
              >
                <MinusIcon className="w-4 h-4 mr-1" />
                移除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 交易成功模态框 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full glass rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold mb-2">交易成功</h3>
            <p className="text-gray-400 mb-4">您的交易已成功处理</p>
            
            <div className="text-sm text-gray-400 mb-4">
              <div className="flex justify-between mb-1">
                <span>交易哈希:</span>
                <code className="text-indigo-400">0x7a8d...f2e1d</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}