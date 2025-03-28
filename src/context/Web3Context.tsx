'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

/**
 * 为Window对象扩展ethereum属性声明
 */
declare global {
  interface Window {
    ethereum: any;
  }
}

// 合约ABIs和地址
import ContractAddresses from '../contracts/contract-addresses.json';
import EDUTokenABI from '../contracts/EDUToken.json';
import CourseFactoryABI from '../contracts/CourseFactory.json';
import LearningManagerABI from '../contracts/LearningManager.json';

// Web3上下文类型定义
interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connecting: boolean;
  connected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contracts: {
    eduToken: ethers.Contract | null;
    courseFactory: ethers.Contract | null;
    learningManager: ethers.Contract | null;
  };
  contractAddresses: {
    eduToken: string;
    courseFactory: string;
    learningManager: string;
  };
  networkName: string;
  isCorrectNetwork: boolean;
  stakeCourse: (courseId: string, amount: string) => Promise<ethers.providers.TransactionResponse>;
  buyEduTokens: (amount: string) => Promise<ethers.providers.TransactionResponse>;
  eduBalance: string;
}

// 默认上下文值
const defaultWeb3Context: Web3ContextType = {
  account: null,
  chainId: null,
  provider: null,
  signer: null,
  connecting: false,
  connected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  contracts: {
    eduToken: null,
    courseFactory: null,
    learningManager: null,
  },
  contractAddresses: {
    eduToken: ContractAddresses.eduToken,
    courseFactory: ContractAddresses.courseFactory,
    learningManager: ContractAddresses.learningManager,
  },
  networkName: '',
  isCorrectNetwork: false,
  stakeCourse: async () => { throw new Error('Not implemented'); },
  buyEduTokens: async () => { throw new Error('Not implemented'); },
  eduBalance: '0',
};

// 创建上下文
const Web3Context = createContext<Web3ContextType>(defaultWeb3Context);

// Web3提供者组件
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [contracts, setContracts] = useState(defaultWeb3Context.contracts);
  const [eduBalance, setEduBalance] = useState('0');
  
  // 正确的网络ID - 使用明确的数字类型
  const correctChainId: number = 1337; // 本地开发网络ID
  
  // 检查是否为正确网络
  const isCorrectNetwork = chainId === correctChainId;
  
  // 初始化Web3
  useEffect(() => {
    // 检查是否存在Web3注入
    if (typeof window !== 'undefined' && window.ethereum) {
      // 创建只读provider
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      setProvider(provider);
      
      // 设置事件监听器
      setupEventListeners();
    } else {
      console.log('请安装MetaMask钱包！');
    }
    
    return () => {
      // 清除事件监听器
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);
  
  // 仅在账户更改时更新合约
  useEffect(() => {
    if (provider && signer && account) {
      initializeContracts(signer);
      fetchEduBalance();
    }
  }, [provider, signer, account]);
  
  // 设置事件监听器
  const setupEventListeners = () => {
    if (window.ethereum) {
      // 监听账户变更
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      // 监听链ID变更
      window.ethereum.on('chainChanged', handleChainChanged);
      // 监听断开连接
      window.ethereum.on('disconnect', handleDisconnect);
    }
  };
  
  // 处理账户变更
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // 用户断开连接
      disconnectWallet();
    } else if (accounts[0] !== account) {
      // 用户切换账户
      setAccount(accounts[0]);
    }
  };
  
  // 处理链ID变更
  const handleChainChanged = (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    // 如果切换了网络，刷新页面以确保所有状态一致
    window.location.reload();
  };
  
  // 处理断开连接
  const handleDisconnect = () => {
    disconnectWallet();
  };
  
  // 获取网络名称
  const getNetworkName = (chainId: number | null): string => {
    if (chainId === null) return 'Unknown';
    
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 137:
        return 'Polygon Mainnet';
      case 80001:
        return 'Mumbai Testnet';
      case 56:
        return 'BNB Smart Chain';
      case 97:
        return 'BNB Testnet';
      case 1337:
        return 'Local Development Network';
      default:
        return `Unknown (${chainId})`;
    }
  };
  
  // 初始化合约
  const initializeContracts = (signerOrProvider: ethers.Signer | ethers.providers.Provider) => {
    try {
      const eduTokenContract = new ethers.Contract(
        ContractAddresses.eduToken,
        EDUTokenABI.abi,
        signerOrProvider
      );
      
      const courseFactoryContract = new ethers.Contract(
        ContractAddresses.courseFactory,
        CourseFactoryABI.abi,
        signerOrProvider
      );
      
      const learningManagerContract = new ethers.Contract(
        ContractAddresses.learningManager,
        LearningManagerABI.abi,
        signerOrProvider
      );
      
      setContracts({
        eduToken: eduTokenContract,
        courseFactory: courseFactoryContract,
        learningManager: learningManagerContract,
      });
      
    } catch (error) {
      console.error('初始化合约失败:', error);
      toast.error('初始化合约失败。请重试或联系支持。');
    }
  };
  
  // 获取EDU代币余额
  const fetchEduBalance = async () => {
    if (contracts.eduToken && account) {
      try {
        const balance = await contracts.eduToken.balanceOf(account);
        setEduBalance(ethers.utils.formatEther(balance));
      } catch (error) {
        console.error('获取EDU余额失败:', error);
      }
    }
  };
  
  // 连接钱包 - 只在用户点击连接按钮时调用
  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('请安装MetaMask钱包');
      return;
    }
    
    try {
      setConnecting(true);
      
      // 检查是否已安装MetaMask
      if (!window.ethereum) {
        throw new Error('请安装MetaMask钱包');
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      
      // 显式请求用户连接MetaMask - 这会触发MetaMask弹窗
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('未找到账户');
      }
      
      const account = accounts[0];
      const signer = provider.getSigner();
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      
      // 更新状态
      setProvider(provider);
      setSigner(signer);
      setAccount(account);
      setChainId(chainId);
      setConnected(true);
      
      // 初始化合约
      initializeContracts(signer);
      
      toast.success('钱包连接成功!');
      
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      
      // 显示更友好的错误信息
      if (error.code === 4001) {
        toast.error('您拒绝了连接请求');
      } else {
        toast.error(`连接失败: ${error.message}`);
      }
      
    } finally {
      setConnecting(false);
    }
  };
  
  // 断开钱包连接
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setConnected(false);
    setContracts(defaultWeb3Context.contracts);
    setEduBalance('0');
    
    toast.success('钱包已断开连接');
  };
  
  // 质押课程
  const stakeCourse = async (courseId: string, amount: string) => {
    if (!contracts.learningManager || !signer) {
      toast.error('合约未初始化或未连接钱包');
      throw new Error('合约未初始化或未连接钱包');
    }
    
    try {
      // 将ETH金额转换为Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // 调用learningManager合约的enrollCourse方法
      const tx = await contracts.learningManager.enrollCourse(courseId, {
        value: amountInWei,
      });
      
      toast.success('交易已提交，请等待确认...');
      
      return tx;
      
    } catch (error: any) {
      console.error('质押课程失败:', error);
      toast.error(`质押失败: ${error.message}`);
      throw error;
    }
  };
  
  // 购买EDU代币
  const buyEduTokens = async (amount: string) => {
    if (!provider || !signer || !account) {
      toast.error('未连接钱包');
      throw new Error('未连接钱包');
    }
    
    try {
      // 将ETH金额转换为Wei
      const amountInWei = ethers.utils.parseEther(amount);
      
      // 模拟购买EDU代币 - 在实际生产环境中，这应该调用代币销售合约
      // 这里我们仅做模拟，发送ETH到预定义的地址，并假设EDU代币会被添加到用户账户
      const tx = await signer.sendTransaction({
        to: ContractAddresses.eduToken, // 在真实场景中，这应该是代币销售合约地址
        value: amountInWei,
      });
      
      // 因为我们没有真正的代币销售合约，所以这里模拟EDU余额增加
      // 在实际生产环境中，余额应该由合约事件触发更新
      const newBalance = parseFloat(eduBalance) + parseFloat(amount) * 1000; // 假设1 ETH = 1000 EDU
      setEduBalance(newBalance.toString());
      
      return tx;
      
    } catch (error: any) {
      console.error('购买EDU代币失败:', error);
      toast.error(`购买失败: ${error.message}`);
      throw error;
    }
  };
  
  // 提供上下文值
  const contextValue: Web3ContextType = {
    account,
    chainId,
    provider,
    signer,
    connecting,
    connected,
    connectWallet,
    disconnectWallet,
    contracts,
    contractAddresses: {
      eduToken: ContractAddresses.eduToken,
      courseFactory: ContractAddresses.courseFactory,
      learningManager: ContractAddresses.learningManager,
    },
    networkName: getNetworkName(chainId),
    isCorrectNetwork,
    stakeCourse,
    buyEduTokens,
    eduBalance,
  };
  
  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// 自定义Hook以使用Web3上下文
export const useWeb3 = () => useContext(Web3Context);

export default Web3Context; 