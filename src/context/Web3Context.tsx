'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, JsonRpcProvider, JsonRpcSigner, Contract, ContractRunner, parseEther, formatEther, ContractTransaction, TransactionResponse, isError } from 'ethers';
import { toast } from 'react-hot-toast';
import { EDUToken, CourseFactory, LearningManager } from '../types/contracts';
import { hasTransactionCapabilities, fullCleanupWalletState } from '@/utils/wallet-sync';
import proxySigner from '@/utils/proxy-signer';

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

// 定义返回类型为联合类型，同时接受ContractTransaction和TransactionResponse
type TxResponse = ContractTransaction | TransactionResponse;

// 定义合约接口以避免never类型错误
interface Contracts {
  eduToken: Contract | null;
  courseFactory: Contract | null;
  learningManager: Contract | null;
}

// 定义Web3上下文类型
interface Web3ContextType {
  provider: BrowserProvider | JsonRpcProvider | null;
  signer: JsonRpcSigner | null;
  walletAddress: string | null;
  chainId: number | null;
  isConnected: boolean;
  connecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contracts: Contracts;
  contractAddresses: {
    eduToken: string;
    courseFactory: string;
    learningManager: string;
  };
  networkName: string;
  isCorrectNetwork: boolean;
  stakeCourse: (courseId: string, amount: string) => Promise<TxResponse>;
  buyEduTokens: (amount: string) => Promise<TxResponse>;
  eduBalance: string;
  proxyEnabled: boolean;
  isProxySigner: boolean;
}

// 创建初始合约对象
const initialContracts: Contracts = {
  eduToken: null,
  courseFactory: null,
  learningManager: null,
};

// 创建上下文
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  walletAddress: null,
  chainId: null,
  isConnected: false,
  connecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  contracts: initialContracts,
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
  proxyEnabled: true,
  isProxySigner: false
});

// 区块链网络配置
const SUPPORTED_CHAINS = {
  1337: {
    name: 'Localhost',
    currency: 'ETH',
    explorerUrl: '',
  },
  656476: {
    name: 'EDU TestNet',
    currency: 'EDU',
    explorerUrl: 'https://opencampus-codex.blockscout.com/',
  },
};

// 格式化地址显示 (添加在适当的位置，如其他辅助函数旁边)
const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Web3提供者组件
export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [contracts, setContracts] = useState<Contracts>(initialContracts);
  const [eduBalance, setEduBalance] = useState('0');
  const [proxyEnabled, setProxyEnabled] = useState<boolean>(true);
  const [isProxySigner, setIsProxySigner] = useState<boolean>(false);
  const wasConnectedRef = React.useRef<boolean>(false);
  
  // 支持多个网络 - Localhost和EDU TestNet
  const correctChainIds: number[] = [1337, 656476];
  
  // 检查是否为正确网络
  const isCorrectNetwork = chainId !== null && correctChainIds.includes(chainId);
  
  // 获取当前网络名称
  const getNetworkName = (): string => {
    if (chainId === null) return 'Not Connected';
    return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name || `Unknown Network (${chainId})`;
  };
  
  const networkName = getNetworkName();

  // Initialize proxy signer
  useEffect(() => {
    const initializeProxySigner = async () => {
      try {
        // Check if proxy signer is ready
        if (proxySigner.isReady()) {
          const proxyAddress = await proxySigner.getAddress();
          console.log(`Proxy signer initialized with address: ${proxyAddress}`);
          
          // Use EDU TestNet provider
          const eduRpcProvider = new JsonRpcProvider('https://rpc.edu-testnet.bsquared.network');
          
          // Get proxy signer instance
          const proxySigner2 = proxySigner.getSigner();
          
          if (proxySigner2) {
            // Initialize contracts
            await initializeContracts(proxySigner2);
            
            setIsProxySigner(true);
            setProxyEnabled(true);
            console.log('Proxy signer and contracts initialized successfully');
          } else {
            console.warn('Failed to get proxy signer, using read-only provider');
            
            // Use read-only provider to initialize contracts
            await initializeContracts(eduRpcProvider);
            
            setIsProxySigner(false);
            setProxyEnabled(false);
          }
        } else {
          console.warn('Proxy signer not ready, proxy transactions will be unavailable');
          setProxyEnabled(false);
        }
      } catch (error) {
        console.error('Failed to initialize proxy signer:', error);
        toast.error('Failed to initialize proxy signer. Some features may not work.');
        setProxyEnabled(false);
      }
    };
    
    initializeProxySigner();
  }, []);

  // 初始化合约
  const initializeContracts = async (providerOrSigner: ContractRunner) => {
    try {
      console.log('Initializing contracts with addresses:', ContractAddresses);
      
      // 创建合约实例
      const eduToken = new Contract(
        ContractAddresses.eduToken,
        EDUTokenABI.abi,
        providerOrSigner
      );
      
      const courseFactory = new Contract(
        ContractAddresses.courseFactory,
        CourseFactoryABI.abi,
        providerOrSigner
      );
      
      const learningManager = new Contract(
        ContractAddresses.learningManager,
        LearningManagerABI.abi,
        providerOrSigner
      );
      
      // 更新状态
      setContracts({
        eduToken,
        courseFactory,
        learningManager
      });
      
      console.log('Contracts initialized successfully');
      return { eduToken, courseFactory, learningManager };
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize contracts');
      return initialContracts;
    }
  };

  // Auto-connect wallet when global state changes
  useEffect(() => {
    // Only execute on client
    if (typeof window === 'undefined') return;
    
    // Define auto connect function
    const autoConnectWallet = async () => {
      try {
        // Check if global wallet state is set
        const isGlobalWalletConnected = !!(window as any).walletConnected;
        const walletAddress = (window as any).walletAddress;
        
        console.log("Web3Context: Checking global wallet state:", { 
          isGlobalWalletConnected, 
          walletAddress,
          currentlyConnected: isConnected 
        });
        
        // If global wallet is connected but current state is not, try to auto-connect
        if (isGlobalWalletConnected && walletAddress && !isConnected) {
          console.log("Web3Context: Detected global wallet is connected, attempting auto-connect...");
          
          // Directly update state to match global state
          setWalletAddress(walletAddress);
          setIsConnected(true);
          setChainId(656476); // EDU TestNet
          
          // 创建 EDU TestNet 提供者
          const eduRpcProvider = new JsonRpcProvider('https://rpc.open-campus-codex.gelato.digital');
          setProvider(eduRpcProvider);
          
          // 尝试获取 signer
          if ((window as any).ethersProvider) {
            try {
              const signerInstance = await (window as any).ethersProvider.getSigner();
              setSigner(signerInstance);
              console.log("Successfully obtained signer from global ethersProvider");
            } catch (signerError) {
              console.warn("Could not get signer from global ethersProvider:", signerError);
            }
          }
          
          // 初始化合约 (使用提供者而不是连接钱包，因为我们只想读取状态)
          await initializeContracts(eduRpcProvider);
          
          // 获取 EDU 余额
          getEduBalance();
          
          console.log("Web3Context: Auto-connect completed successfully");
          
          // 刷新页面状态
          setTimeout(() => {
            // 触发组件刷新的自定义事件
            const refreshEvent = new CustomEvent('walletStateRefreshed');
            window.dispatchEvent(refreshEvent);
          }, 500);
        }
      } catch (error) {
        console.error("Web3Context: Auto-connect failed:", error);
      }
    };
    
    // Execute auto connect
    autoConnectWallet();
    
    // Setup walletStateChange listener
    const walletStateChangeListener = () => {
      autoConnectWallet();
    };
    
    // Setup periodic check for wallet state
    const checkInterval = setInterval(walletStateChangeListener, 5000);
    
    // Add event listener for wallet connected events
    const handleWalletConnected = (event: any) => {
      console.log("Web3Context: Received wallet connected event", event.detail);
      if (event.detail && event.detail.address) {
        setWalletAddress(event.detail.address);
        setIsConnected(true);
        setChainId(656476); // EDU TestNet
        getEduBalance();
      }
    };
    
    window.addEventListener('walletConnected', handleWalletConnected);
    
    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected);
      clearInterval(checkInterval);
    };
  }, [isConnected]); // Remove connectWallet dependency to avoid loops

  // 连接钱包
  const connectWallet = async () => {
    // 如果已经连接并且有账户，则不需要重新连接
    if (isConnected && walletAddress) {
      console.log("Already connected, using existing wallet:", formatAddress(walletAddress));
      return;
    }
    
    // 检查是否已经通过ZeroDev连接
    if (typeof window !== 'undefined' && (window as any).walletConnected && (window as any).walletAddress) {
      try {
        setConnecting(true);
        
        // 获取ZeroDev提供的钱包地址
        const zeroDevAddress = (window as any).walletAddress;
        
        console.log("Found existing ZeroDev wallet connection:", formatAddress(zeroDevAddress));
        
        // 检查当前状态，避免重复设置
        if (walletAddress === zeroDevAddress && isConnected) {
          console.log("Already connected to the same ZeroDev wallet, skipping reconnection");
          setConnecting(false);
          return;
        }
        
        // 使用ethers的JsonRpcProvider连接到EDU测试网
        const eduRpcProvider = new JsonRpcProvider('https://rpc.open-campus-codex.gelato.digital');
        
        // 尝试获取可能的 signer - 通过检查 window 上是否有 ethersProvider
        let signerInstance = null;
        if ((window as any).ethersProvider) {
          try {
            signerInstance = await (window as any).ethersProvider.getSigner();
            console.log("Successfully obtained signer from global ethersProvider");
          } catch (signerError) {
            console.warn("Could not get signer from global ethersProvider:", signerError);
          }
        }
        
        // 更新状态
        setProvider(eduRpcProvider);
        if (signerInstance) {
          setSigner(signerInstance);
        }
        setWalletAddress(zeroDevAddress);
        setChainId(656476); // EDU TestNet
        setIsConnected(true);
        
        // 更新全局钱包状态，确保其他组件能够获取到
        if (typeof window !== 'undefined') {
          (window as any).walletConnected = true;
          (window as any).walletAddress = zeroDevAddress;
        }
        
        // 初始化合约
        await initializeContracts(signerInstance || eduRpcProvider);
        
        // 获取 EDU 余额
        getEduBalance();
        
        // 只在之前没有连接的状态下显示成功提示
        if (!wasConnectedRef.current) {
          toast.success(`Connected to ZeroDev wallet on EDU TestNet`);
          wasConnectedRef.current = true;
        }
        
        return;
      } catch (error: any) {
        console.error('Failed to connect ZeroDev wallet:', error);
        toast.error(`Connection failed: ${error.message || 'Unknown error'}`);
      } finally {
        setConnecting(false);
      }
    }

    // 常规MetaMask连接流程
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('Please install MetaMask or other Ethereum wallet');
      return;
    }

    try {
      setConnecting(true);
      
      // 使用ethers v6的BrowserProvider
      const browserProvider = new BrowserProvider(window.ethereum);
      
      // 请求用户连接
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const chainIdValue = Number(network.chainId);
      
      // 获取签名者
      const signerInstance = await browserProvider.getSigner();
      
      // 更新状态
      setProvider(browserProvider);
      setSigner(signerInstance);
      setWalletAddress(accounts[0]);
      setChainId(chainIdValue);
      setIsConnected(true);
      
      // 初始化合约
      await initializeContracts(signerInstance);
      
      // 检查是否支持当前网络
      const networkInfo = SUPPORTED_CHAINS[chainIdValue as keyof typeof SUPPORTED_CHAINS];
      if (networkInfo) {
        toast.success(`Connected to ${networkInfo.name}`);
      } else {
        toast.error('Connected to unsupported network');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(`Connection failed: ${error.message || 'Unknown error'}`);
    } finally {
      setConnecting(false);
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress(null);
    setProvider(null);
    setSigner(null);
    setContracts(initialContracts);
    toast.success('Disconnected from wallet');
  };

  // Stake course tokens
  const stakeCourse = async (courseId: string, amount: string): Promise<TxResponse> => {
    // Ensure user has connected wallet
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }
    
    // Check if contract is initialized
    if (!contracts.courseFactory) {
      toast.error('Contract not initialized');
      throw new Error('Contract not initialized');
    }
    
    try {
      toast.loading('Staking tokens...', { id: 'stakeTx' });
      
      // Check if proxy transactions are enabled
      if (proxyEnabled && proxySigner.isReady()) {
        try {
          console.log(`Using proxy signer to stake ${amount} tokens for course ${courseId}`);
          
          // Prepare transaction data
          const courseFactoryInterface = contracts.courseFactory.interface;
          const data = courseFactoryInterface.encodeFunctionData('stakeCourse', [courseId, parseEther(amount)]);
          
          // Use proxy signer to execute the transaction
          const tx = await proxySigner.sendTransaction({
            to: ContractAddresses.courseFactory,
            data: data
          });
          
          console.log(`Proxy transaction sent: ${tx.hash}`);
          toast.success('Successfully staked tokens!', { id: 'stakeTx' });
          return tx;
        } catch (error: any) {
          console.error('Proxy transaction failed:', error);
          toast.error(`Failed to stake: ${error.message}`, { id: 'stakeTx' });
          throw error;
        }
      } else {
        // Regular transaction method
        const tx = await contracts.courseFactory.stakeCourse(courseId, parseEther(amount));
        toast.success('Successfully staked tokens!', { id: 'stakeTx' });
        return tx;
      }
    } catch (error: any) {
      console.error('Error staking tokens:', error);
      toast.error(`Failed to stake: ${error.message}`, { id: 'stakeTx' });
      throw error;
    }
  };

  // Purchase EDU tokens
  const buyEduTokens = async (amount: string): Promise<TxResponse> => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      throw new Error('Wallet not connected');
    }
    
    try {
      toast.loading('Purchasing EDU tokens...', { id: 'buyTx' });
      
      // Convert USDT amount to EDU amount (1 USDT = 2 EDU)
      const eduAmount = parseFloat(amount) * 2;
      
      // Get admin address (for receiving funds)
      const adminAddress = "0x9b56e2B9B595B9902B8B54fCFF5b41AD726B3831";
      
      // Assume 1:1 ratio (1 USDT = 1 wei)
      const amountWei = parseEther(amount);
      
      // Check if proxy transactions are enabled
      if (proxyEnabled && proxySigner.isReady()) {
        try {
          console.log(`Using proxy signer to purchase ${eduAmount} EDU tokens`);
          
          // Prepare transaction data - call eduToken contract's mint method
          const eduTokenInterface = contracts.eduToken!.interface;
          const data = eduTokenInterface.encodeFunctionData('mint', [walletAddress, parseEther(eduAmount.toString())]);
          
          // Use proxy signer to execute the transaction
          const tx = await proxySigner.sendTransaction({
            to: ContractAddresses.eduToken,
            data: data
          });
          
          console.log(`Proxy transaction sent: ${tx.hash}`);
          toast.success('EDU tokens purchased successfully!', { id: 'buyTx' });
          
          // Get updated balance
          getEduBalance();
          return tx;
        } catch (error: any) {
          console.error('Proxy transaction failed:', error);
          toast.error(`Proxy transaction failed: ${error.message}`, { id: 'buyTx' });
          throw error;
        }
      } else {
        // Regular transaction - send ETH to admin address
        if (!signer) {
          toast.error('Cannot get signer', { id: 'buyTx' });
          throw new Error('Signer not initialized');
        }
        
        const tx = await signer.sendTransaction({
          to: adminAddress,
          value: amountWei
        });
        
        await tx.wait();
        toast.success('EDU tokens purchased successfully!', { id: 'buyTx' });
        
        // Get updated balance
        getEduBalance();
        
        return tx;
      }
    } catch (error: any) {
      console.error('Error purchasing EDU tokens:', error);
      toast.error(`Purchase failed: ${error.message}`, { id: 'buyTx' });
      throw error;
    }
  };

  // 获取EDU代币余额
  const getEduBalance = async () => {
    if (!isConnected || !walletAddress) return;

    try {
      // 防御性检查
      if (!contracts.eduToken) {
        console.warn('EDU Token contract not initialized');
        return;
      }
      
      // 使用非空断言操作符(!.)和类型断言来告诉TypeScript这个对象一定存在
      // 在此行之前已经检查过contracts.eduToken不为null
      const eduToken = contracts.eduToken as unknown as EDUToken;
      const balance = await eduToken!.balanceOf(walletAddress);
      if (balance) {
        setEduBalance(formatEther(balance));
      }
    } catch (error) {
      console.error('Failed to get EDU balance:', error);
    }
  };

  // 更新余额
  useEffect(() => {
    if (isConnected && contracts.eduToken && walletAddress) {
      getEduBalance();
      
      // 设置定时器每30秒更新一次余额
      const intervalId = setInterval(getEduBalance, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [isConnected, contracts.eduToken, walletAddress]);

  // 提供上下文值
  const contextValue: Web3ContextType = {
    provider,
    signer,
    walletAddress,
    chainId,
    isConnected,
    connecting,
    connectWallet,
    disconnectWallet,
    contracts,
    contractAddresses: {
      eduToken: ContractAddresses.eduToken,
      courseFactory: ContractAddresses.courseFactory,
      learningManager: ContractAddresses.learningManager,
    },
    networkName,
    isCorrectNetwork,
    stakeCourse,
    buyEduTokens,
    eduBalance,
    proxyEnabled,
    isProxySigner
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// 自定义Hook，用于在组件中使用Web3上下文
export const useWeb3 = () => useContext(Web3Context);

export default Web3Context; 