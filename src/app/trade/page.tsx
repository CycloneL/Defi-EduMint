'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import {
  ArrowsUpDownIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Chart, registerables } from 'chart.js';

// 注册所有Chart.js组件
Chart.register(...registerables);

// 定义代币接口
interface Token {
  id?: string;
  symbol: string;
  name: string;
  balance: string;
  price: string;
  change: string;
  image?: string;
  course?: any;
}

// 模拟代币数据
const mockTokens: Token[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: '1.45', price: '3200.00', change: '+2.4', image: '/images/eth.png' },
  { symbol: 'EDU', name: 'EDU Token', balance: '1256.34', price: '3.25', change: '+5.7', image: '/images/edu.png' },
  { symbol: 'SOL', name: 'Solidity进阶 Token', balance: '58.21', price: '2.80', change: '+1.3', image: '/images/courses/solidity.png' },
  { symbol: 'BTC', name: 'Web3基础 Token', balance: '12.55', price: '1.20', change: '-0.8', image: '/images/courses/web3.png' },
  { symbol: 'DEF', name: 'DeFi原理 Token', balance: '87.35', price: '4.50', change: '+3.2', image: '/images/courses/defi.png' }
];

// 从localStorage获取课程列表生成交易对
const useCourseTokens = () => {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);

  useEffect(() => {
    try {
      const courses = JSON.parse(localStorage.getItem('courses') || '[]');
      
      // 为每个课程创建交易代币
      const courseTokens = courses.map((course: any): Token => {
        // 基于课程创建代币符号
        const symbol = course.title.split(' ')[0].substring(0, 3).toUpperCase();
        
        return {
          id: course.id,
          symbol: symbol,
          name: `${course.title} Token`,
          balance: '0',
          price: course.price?.replace(' ETH', '') || '1.00', // 从课程价格获取
          change: '+0.0',
          image: course.image,
          course: course
        };
      });
      
      // 合并默认代币和课程代币
      setTokens(prev => {
        // 过滤掉重复的
        const existingSymbols = new Set(prev.map(t => t.symbol));
        const newCourseTokens = courseTokens.filter((t: Token) => !existingSymbols.has(t.symbol));
        return [...prev, ...newCourseTokens];
      });
    } catch (error) {
      console.error('获取课程代币失败', error);
    }
  }, []);

  return tokens;
};

// 模拟图表数据生成
const generateChartData = (symbol: string) => {
  const today = new Date();
  const data: number[] = [];
  const labels: string[] = [];
  
  // 生成过去30天的日期标签
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
    
    // 根据代币符号生成不同的价格曲线
    let baseValue = 0;
    let volatility = 0;
    
    switch(symbol) {
      case 'ETH':
        baseValue = 3000 + Math.random() * 500;
        volatility = 100;
        break;
      case 'EDU':
        baseValue = 2.5 + Math.random() * 1.5;
        volatility = 0.2;
        break;
      default:
        baseValue = 1 + Math.random() * 5;
        volatility = 0.3;
    }
    
    // 生成当日价格
    const previousValue = data[data.length - 1] || baseValue;
    const change = (Math.random() - 0.5) * volatility;
    data.push(previousValue + change);
  }
  
  return { labels, data };
};

export default function TradePage() {
  const { connected, account, contracts, signer } = useWeb3();
  const tokens = useCourseTokens();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  
  // 流动性池相关状态
  const [showLiquidityModal, setShowLiquidityModal] = useState(false);
  const [lpToken1, setLpToken1] = useState<Token | null>(null);
  const [lpToken2, setLpToken2] = useState<Token | null>(null);
  const [lpAmount1, setLpAmount1] = useState('');
  const [lpAmount2, setLpAmount2] = useState('');
  const [lpLoading, setLpLoading] = useState(false);
  const [lpSuccess, setLpSuccess] = useState(false);
  const [showLpToken1Selector, setShowLpToken1Selector] = useState(false);
  const [showLpToken2Selector, setShowLpToken2Selector] = useState(false);
  
  // 更新交易对
  useEffect(() => {
    if (tokens.length >= 2 && !fromToken) {
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
      setSelectedToken(tokens[0]); // 初始选中代币用于图表展示
    }
  }, [tokens, fromToken]);
  
  // 初始化并更新图表
  useEffect(() => {
    if (chartRef.current && selectedToken) {
      // 销毁现有图表实例
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      // 生成图表数据
      const { labels, data } = generateChartData(selectedToken.symbol);
      
      // 创建图表
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: `${selectedToken.symbol} 价格`,
              data,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.3,
              fill: true,
              pointRadius: 0,
              borderWidth: 2
            }]
          },
          options: {
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
              },
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 6,
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              },
              y: {
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                },
                ticks: {
                  color: 'rgba(255, 255, 255, 0.5)'
                }
              }
            },
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    }
  }, [selectedToken]);
  
  // 计算交易预估
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const fromPrice = parseFloat(fromToken.price);
      const toPrice = parseFloat(toToken.price);
      
      if (fromPrice && toPrice) {
        const estimatedAmount = (parseFloat(fromAmount) * fromPrice / toPrice).toFixed(6);
        setToAmount(estimatedAmount);
      }
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);
  
  // 交换代币
  const swapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };
  
  // 执行交易
  const executeTrade = async () => {
    if (!connected || !account || !fromAmount || parseFloat(fromAmount) <= 0 || !fromToken || !toToken) {
      alert('请先连接钱包并输入有效金额');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 模拟交易确认
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 在真实环境中，这里应该调用智能合约进行交易
      if (contracts.eduToken) {
        // 示例: 调用代币交换合约
        /*
        const amountIn = ethers.utils.parseEther(fromAmount);
        const tx = await contracts.dexContract.swapExactTokensForTokens(
          amountIn,
          0, // minAmountOut 
          [fromToken.address, toToken.address],
          account,
          Math.floor(Date.now() / 1000) + 60 * 20, // 20分钟后过期
        );
        await tx.wait();
        */
        
        // 由于我们没有真实合约，这里使用触发钱包签名的模拟交易
        const signer = await contracts.eduToken.signer;
        
        // 通过显示交易详情增强用户体验
        console.log("交易对:", `${fromToken.symbol} → ${toToken.symbol}`);
        console.log("交易金额:", `${fromAmount} ${fromToken.symbol} → ${toAmount} ${toToken.symbol}`);
        console.log("估计价值:", `${(parseFloat(fromAmount) * parseFloat(fromToken.price)).toFixed(2)} USD`);
        
        const tx = await signer.sendTransaction({
          to: account,
          value: ethers.utils.parseEther("0"), // 零值交易
          data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(`Swap ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`)) // 添加含义的数据
        });
        
        console.log("交易已提交:", tx.hash);
        await tx.wait();
        
        // 更新代币余额 (在真实应用中,这会通过合约事件检测完成)
        const updatedTokens = tokens.map(token => {
          if (token.symbol === fromToken.symbol) {
            const newBalance = (parseFloat(token.balance) - parseFloat(fromAmount)).toFixed(2);
            return { ...token, balance: newBalance };
          }
          if (token.symbol === toToken.symbol) {
            const newBalance = (parseFloat(token.balance) + parseFloat(toAmount)).toFixed(2);
            return { ...token, balance: newBalance };
          }
          return token;
        });
        
        // 将交易记录保存到本地存储
        try {
          const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
          transactions.push({
            id: Date.now(),
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
            fromAmount,
            toAmount,
            date: new Date().toISOString(),
            hash: tx.hash
          });
          localStorage.setItem('transactions', JSON.stringify(transactions));
        } catch (err) {
          console.error('保存交易记录失败', err);
        }
        
        setTxSuccess(true);
        setTimeout(() => setTxSuccess(false), 3000);
        
        // 重置表单
        setFromAmount('');
        setToAmount('');
      } else {
        throw new Error('合约未初始化');
      }
    } catch (error: any) {
      console.error('交易失败:', error);
      alert(`交易失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 添加流动性池
  const addLiquidity = async () => {
    if (!connected || !account || !signer || !lpToken1 || !lpToken2 || !lpAmount1 || !lpAmount2) {
      alert('请先连接钱包并输入有效金额');
      return;
    }
    
    setLpLoading(true);
    
    try {
      // 模拟创建流动性池和添加流动性
      console.log(`创建流动性池: ${lpToken1.symbol}-${lpToken2.symbol}`);
      console.log(`添加流动性: ${lpAmount1} ${lpToken1.symbol} + ${lpAmount2} ${lpToken2.symbol}`);
      
      // 触发钱包签名交易
      const tx = await signer.sendTransaction({
        to: account,
        value: ethers.utils.parseEther("0"), // 零值交易
        data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(
          `Add Liquidity: ${lpAmount1} ${lpToken1.symbol} + ${lpAmount2} ${lpToken2.symbol}`
        ))
      });
      
      console.log("交易已提交:", tx.hash);
      await tx.wait();
      
      // 更新流动性池列表 (在本地存储中)
      try {
        const pools = JSON.parse(localStorage.getItem('liquidityPools') || '[]');
        
        // 检查是否已存在相同的池子
        const poolExists = pools.some((pool: any) => 
          (pool.token1.symbol === lpToken1.symbol && pool.token2.symbol === lpToken2.symbol) ||
          (pool.token1.symbol === lpToken2.symbol && pool.token2.symbol === lpToken1.symbol)
        );
        
        if (!poolExists) {
          pools.push({
            id: Date.now().toString(),
            token1: lpToken1,
            token2: lpToken2,
            amount1: lpAmount1,
            amount2: lpAmount2,
            lpTokens: (parseFloat(lpAmount1) * parseFloat(lpAmount2)).toFixed(2),
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('liquidityPools', JSON.stringify(pools));
        } else {
          // 更新已存在的池子
          const updatedPools = pools.map((pool: any) => {
            if ((pool.token1.symbol === lpToken1.symbol && pool.token2.symbol === lpToken2.symbol) ||
                (pool.token1.symbol === lpToken2.symbol && pool.token2.symbol === lpToken1.symbol)) {
              return {
                ...pool,
                amount1: (parseFloat(pool.amount1) + parseFloat(lpAmount1)).toFixed(6),
                amount2: (parseFloat(pool.amount2) + parseFloat(lpAmount2)).toFixed(6),
                lpTokens: (parseFloat(pool.lpTokens) + parseFloat(lpAmount1) * parseFloat(lpAmount2)).toFixed(2)
              };
            }
            return pool;
          });
          localStorage.setItem('liquidityPools', JSON.stringify(updatedPools));
        }
      } catch (err) {
        console.error('保存流动性池信息失败', err);
      }
      
      setLpSuccess(true);
      setTimeout(() => {
        setLpSuccess(false);
        setShowLiquidityModal(false); // 关闭模态框
        setLpToken1(null);
        setLpToken2(null);
        setLpAmount1('');
        setLpAmount2('');
      }, 3000);
      
    } catch (error: any) {
      console.error('添加流动性失败:', error);
      alert(`交易失败: ${error.message || '未知错误'}`);
    } finally {
      setLpLoading(false);
    }
  };
  
  // 计算流动性池第二个代币的数量
  useEffect(() => {
    if (lpToken1 && lpToken2 && lpAmount1) {
      // 简单的价格比例计算
      const price1 = parseFloat(lpToken1.price);
      const price2 = parseFloat(lpToken2.price);
      
      if (price1 && price2) {
        const estAmount = (parseFloat(lpAmount1) * price1 / price2).toFixed(6);
        setLpAmount2(estAmount);
      }
    }
  }, [lpAmount1, lpToken1, lpToken2]);
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-12 px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">去中心化交易</h1>
          <p className="text-gray-400">交易课程代币，参与教育市场投资</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 交易面板 */}
          <div className="lg:col-span-2">
            <div className="glass rounded-xl p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">交易代币</h2>
                <div className="flex items-center space-x-4">
                  <button 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm"
                    onClick={() => setShowLiquidityModal(true)}
                  >
                    + 创建流动性池
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button className="bg-gray-800 hover:bg-gray-700 rounded-lg p-2">
                      <ArrowPathIcon className="h-5 w-5 text-gray-400" />
                    </button>
                    <div className="bg-gray-800 rounded-lg px-3 py-1 text-sm">
                      <span className="text-gray-400 mr-2">滑点容差:</span>
                      <select 
                        className="bg-transparent"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                      >
                        <option value="0.1" className="bg-gray-800">0.1%</option>
                        <option value="0.5" className="bg-gray-800">0.5%</option>
                        <option value="1.0" className="bg-gray-800">1.0%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 从代币 */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">从</span>
                  {connected && fromToken && (
                    <span className="text-sm text-gray-400">
                      余额: {fromToken.balance} {fromToken.symbol}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    placeholder="0.0"
                    className="trade-input"
                  />
                  
                  <div className="relative">
                    <button 
                      className="token-selector"
                      onClick={() => setShowFromTokens(!showFromTokens)}
                    >
                      {fromToken && (
                        <>
                          <div className="token-icon">
                            {fromToken.image ? (
                              <img
                                src={fromToken.image}
                                className="w-6 h-6 rounded-full"
                                alt={fromToken.symbol}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = fromToken.symbol.substring(0, 2);
                                }}
                              />
                            ) : (
                              <span>{fromToken.symbol.substring(0, 2)}</span>
                            )}
                          </div>
                          <span className="mr-1">{fromToken.symbol}</span>
                        </>
                      )}
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    
                    {showFromTokens && (
                      <div className="token-dropdown">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="搜索代币"
                            className="w-full bg-gray-700 px-3 py-2 rounded-lg text-sm mb-2"
                          />
                          
                          <div className="max-h-60 overflow-y-auto">
                            {tokens.map((token) => (
                              <div
                                key={token.symbol}
                                className="token-list-item"
                                onClick={() => {
                                  setFromToken(token);
                                  setShowFromTokens(false);
                                }}
                              >
                                <div className="token-icon">
                                  {token.image ? (
                                    <img
                                      src={token.image}
                                      className="w-6 h-6 rounded-full"
                                      alt={token.symbol}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).onerror = null;
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.substring(0, 2);
                                      }}
                                    />
                                  ) : (
                                    <span>{token.symbol.substring(0, 2)}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="token-symbol">{token.symbol}</div>
                                  <div className="text-xs text-gray-400">{token.name}</div>
                                </div>
                                {token.balance && (
                                  <div className="text-sm">{token.balance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 交换按钮 */}
              <div className="flex justify-center -my-3 relative z-10">
                <button 
                  className="swap-button"
                  onClick={swapTokens}
                >
                  <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              
              {/* 目标代币 */}
              <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">到</span>
                  {connected && toToken && (
                    <span className="text-sm text-gray-400">
                      余额: {toToken.balance} {toToken.symbol}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <input
                    type="number"
                    value={toAmount}
                    onChange={(e) => setToAmount(e.target.value)}
                    placeholder="0.0"
                    className="trade-input"
                    readOnly
                  />
                  
                  <div className="relative">
                    <button 
                      className="token-selector"
                      onClick={() => setShowToTokens(!showToTokens)}
                    >
                      {toToken && (
                        <>
                          <div className="token-icon">
                            {toToken.image ? (
                              <img
                                src={toToken.image}
                                className="w-6 h-6 rounded-full"
                                alt={toToken.symbol}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = toToken.symbol.substring(0, 2);
                                }}
                              />
                            ) : (
                              <span>{toToken.symbol.substring(0, 2)}</span>
                            )}
                          </div>
                          <span className="mr-1">{toToken.symbol}</span>
                        </>
                      )}
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    
                    {showToTokens && (
                      <div className="token-dropdown">
                        <div className="p-2">
                          <input
                            type="text"
                            placeholder="搜索代币"
                            className="w-full bg-gray-700 px-3 py-2 rounded-lg text-sm mb-2"
                          />
                          
                          <div className="max-h-60 overflow-y-auto">
                            {tokens.map((token) => (
                              <div
                                key={token.symbol}
                                className="token-list-item"
                                onClick={() => {
                                  setToToken(token);
                                  setShowToTokens(false);
                                }}
                              >
                                <div className="token-icon">
                                  {token.image ? (
                                    <img
                                      src={token.image}
                                      className="w-6 h-6 rounded-full"
                                      alt={token.symbol}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).onerror = null;
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.substring(0, 2);
                                      }}
                                    />
                                  ) : (
                                    <span>{token.symbol.substring(0, 2)}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="token-symbol">{token.symbol}</div>
                                  <div className="text-xs text-gray-400">{token.name}</div>
                                </div>
                                {token.balance && (
                                  <div className="text-sm">{token.balance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 交易信息 */}
              {fromAmount && toAmount && (
                <div className="trade-info-box">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">交易汇率</span>
                    <span>1 {fromToken?.symbol} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">最小接收</span>
                    <span>{(parseFloat(toAmount) * (1 - parseFloat(slippage) / 100)).toFixed(6)} {toToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">价格影响</span>
                    <span className="text-green-400">&lt; 0.01%</span>
                  </div>
                </div>
              )}
              
              {txSuccess && (
                <div className="trade-success">
                  交易成功完成！
                </div>
              )}
              
              {/* 交易按钮 */}
              <button
                className={`w-full py-3 rounded-lg font-medium ${
                  !connected
                    ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    : !fromAmount || parseFloat(fromAmount) <= 0
                    ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                }`}
                onClick={executeTrade}
                disabled={!connected || !fromAmount || parseFloat(fromAmount) <= 0 || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    交易处理中...
                  </span>
                ) : !connected ? (
                  '请先连接钱包'
                ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
                  '请输入金额'
                ) : (
                  '交易'
                )}
              </button>
            </div>
            
            {/* 代币价格图表 */}
            <div className="glass rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">价格走势</h2>
                <div className="flex">
                  {['1D', '1W', '1M', '1Y', 'ALL'].map((period) => (
                    <button
                      key={period}
                      className={`px-3 py-1 text-sm rounded-lg mr-1 ${
                        period === '1M' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex mb-4">
                {tokens.slice(0, 5).map((token) => (
                  <button
                    key={token.symbol}
                    className={`mr-2 px-3 py-1 text-sm rounded-lg ${
                      selectedToken?.symbol === token.symbol
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedToken(token)}
                  >
                    {token.symbol}
                  </button>
                ))}
              </div>
              
              <div className="h-64">
                <canvas ref={chartRef}></canvas>
              </div>
              
              {selectedToken && (
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <div className="text-lg font-bold">
                      ${selectedToken.price}
                    </div>
                    <div className={`text-sm ${
                      parseFloat(selectedToken.change) >= 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}>
                      {parseFloat(selectedToken.change) >= 0 ? '+' : ''}{selectedToken.change}% (24h)
                    </div>
                  </div>
                  <div className="flex">
                    <button className="bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg p-2 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                      </svg>
                    </button>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2">
                      交易
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* 添加流动性池模态框 */}
            {showLiquidityModal && (
              <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
                <div className="glass rounded-xl p-6 w-full max-w-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">创建流动性池</h2>
                    <button 
                      className="text-gray-400 hover:text-white"
                      onClick={() => setShowLiquidityModal(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-gray-400 mb-6">
                    为两个代币创建流动性池，使它们可以在去中心化交易所中交易。您需要提供等值的两种代币来创建初始流动性。
                  </p>
                  
                  {/* 第一个代币 */}
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">第一个代币</span>
                      {lpToken1 && (
                        <span className="text-sm text-gray-400">
                          余额: {lpToken1.balance} {lpToken1.symbol}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={lpAmount1}
                        onChange={(e) => setLpAmount1(e.target.value)}
                        placeholder="0.0"
                        className="trade-input"
                      />
                      
                      <div className="relative">
                        <button 
                          className="token-selector"
                          onClick={() => setShowLpToken1Selector(!showLpToken1Selector)}
                        >
                          {lpToken1 ? (
                            <>
                              <div className="token-icon">
                                {lpToken1.image ? (
                                  <img
                                    src={lpToken1.image}
                                    className="w-6 h-6 rounded-full"
                                    alt={lpToken1.symbol}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = lpToken1.symbol.substring(0, 2);
                                    }}
                                  />
                                ) : (
                                  <span>{lpToken1.symbol.substring(0, 2)}</span>
                                )}
                              </div>
                              <span className="mr-1">{lpToken1.symbol}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">选择代币</span>
                          )}
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        
                        {showLpToken1Selector && (
                          <div className="token-dropdown">
                            <div className="p-2">
                              <input
                                type="text"
                                placeholder="搜索代币"
                                className="w-full bg-gray-700 px-3 py-2 rounded-lg text-sm mb-2"
                              />
                              
                              <div className="max-h-60 overflow-y-auto">
                                {tokens.map((token) => (
                                  <div
                                    key={token.symbol}
                                    className="token-list-item"
                                    onClick={() => {
                                      setLpToken1(token);
                                      setShowLpToken1Selector(false);
                                    }}
                                  >
                                    <div className="token-icon">
                                      {token.image ? (
                                        <img
                                          src={token.image}
                                          className="w-6 h-6 rounded-full"
                                          alt={token.symbol}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).onerror = null;
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.substring(0, 2);
                                          }}
                                        />
                                      ) : (
                                        <span>{token.symbol.substring(0, 2)}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="token-symbol">{token.symbol}</div>
                                      <div className="text-xs text-gray-400">{token.name}</div>
                                    </div>
                                    {token.balance && (
                                      <div className="text-sm">{token.balance}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 加号 */}
                  <div className="flex justify-center -my-2 relative z-10">
                    <div className="bg-gray-800 rounded-full p-2">
                      <PlusIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* 第二个代币 */}
                  <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-400">第二个代币</span>
                      {lpToken2 && (
                        <span className="text-sm text-gray-400">
                          余额: {lpToken2.balance} {lpToken2.symbol}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={lpAmount2}
                        onChange={(e) => setLpAmount2(e.target.value)}
                        placeholder="0.0"
                        className="trade-input"
                      />
                      
                      <div className="relative">
                        <button 
                          className="token-selector"
                          onClick={() => setShowLpToken2Selector(!showLpToken2Selector)}
                        >
                          {lpToken2 ? (
                            <>
                              <div className="token-icon">
                                {lpToken2.image ? (
                                  <img
                                    src={lpToken2.image}
                                    className="w-6 h-6 rounded-full"
                                    alt={lpToken2.symbol}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).onerror = null;
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = lpToken2.symbol.substring(0, 2);
                                    }}
                                  />
                                ) : (
                                  <span>{lpToken2.symbol.substring(0, 2)}</span>
                                )}
                              </div>
                              <span className="mr-1">{lpToken2.symbol}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">选择代币</span>
                          )}
                          <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        
                        {showLpToken2Selector && (
                          <div className="token-dropdown">
                            <div className="p-2">
                              <input
                                type="text"
                                placeholder="搜索代币"
                                className="w-full bg-gray-700 px-3 py-2 rounded-lg text-sm mb-2"
                              />
                              
                              <div className="max-h-60 overflow-y-auto">
                                {tokens.map((token) => (
                                  <div
                                    key={token.symbol}
                                    className="token-list-item"
                                    onClick={() => {
                                      setLpToken2(token);
                                      setShowLpToken2Selector(false);
                                    }}
                                  >
                                    <div className="token-icon">
                                      {token.image ? (
                                        <img
                                          src={token.image}
                                          className="w-6 h-6 rounded-full"
                                          alt={token.symbol}
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).onerror = null;
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.substring(0, 2);
                                          }}
                                        />
                                      ) : (
                                        <span>{token.symbol.substring(0, 2)}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="token-symbol">{token.symbol}</div>
                                      <div className="text-xs text-gray-400">{token.name}</div>
                                    </div>
                                    {token.balance && (
                                      <div className="text-sm">{token.balance}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {lpSuccess && (
                    <div className="mb-4 bg-green-600/20 border border-green-500 text-green-400 rounded-lg p-3 text-center">
                      流动性添加成功！现在可以交易这对代币了。
                    </div>
                  )}
                  
                  <button
                    className={`w-full py-3 rounded-lg font-medium ${
                      !connected || !lpToken1 || !lpToken2 || !lpAmount1 || !lpAmount2 || lpLoading
                        ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    }`}
                    onClick={addLiquidity}
                    disabled={!connected || !lpToken1 || !lpToken2 || !lpAmount1 || !lpAmount2 || lpLoading}
                  >
                    {lpLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        处理中...
                      </span>
                    ) : !connected ? (
                      '请先连接钱包'
                    ) : !lpToken1 || !lpToken2 ? (
                      '请选择代币'
                    ) : !lpAmount1 || !lpAmount2 ? (
                      '请输入金额'
                    ) : (
                      '添加流动性'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 代币列表 */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">课程代币</h2>
            
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.symbol} className="token-card">
                  <div className="token-image">
                    {token.image ? (
                      <img
                        src={token.image}
                        className="w-10 h-10 rounded-full"
                        alt={token.symbol}
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = token.symbol.substring(0, 2);
                        }}
                      />
                    ) : (
                      <span>{token.symbol.substring(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="token-symbol">{token.symbol}</span>
                      <span className="token-name">{token.name}</span>
                    </div>
                    <div className="token-price">${token.price}</div>
                  </div>
                  <div className="text-right">
                    <div className={parseFloat(token.change) >= 0 ? 'token-change-positive' : 'token-change-negative'}>
                      {parseFloat(token.change) >= 0 ? '+' : ''}{token.change}%
                    </div>
                    <div className="text-sm text-gray-400">24h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 