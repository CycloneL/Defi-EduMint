'use client';

import { useEffect, useRef, useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useZeroDev } from '@/context/ZeroDevProvider';
import toast from 'react-hot-toast';
import { 
  syncWalletAfterOCIDAuth, 
  getLastConnectedAccount,
  markWalletWithTransactionCapabilities 
} from '@/utils/wallet-sync';

/**
 * WalletSyncManager Component
 * 
 * This component is responsible for synchronizing the connection state between 
 * ZeroDev wallet and the global Web3Context, ensuring that all parts of the application 
 * are aware of whether the user has connected their wallet.
 */

// Define wallet connection event interface
interface WalletConnectedEvent extends CustomEvent {
  detail: {
    address: string;
    forceUpdate?: boolean;
    provider?: string;
    syncAll?: boolean;
    [key: string]: any;
  };
}

const WalletSyncManager: React.FC = () => {
  const { connectWallet, disconnectWallet, isConnected: web3Connected, walletAddress } = useWeb3();
  const { isConnected, address, connectWithOCID } = useZeroDev();
  
  // Use ref to track previous state to avoid unnecessary updates
  const prevStateRef = useRef({ isConnected, address, web3Connected });
  
  // Add a flag to prevent triggering new updates while syncing
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Add a debounce flag to prevent multiple syncs in short time
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add reconnection attempts counter
  const reconnectAttemptsRef = useRef(0);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [zeroDev_isConnected, setZeroDev_isConnected] = useState(false);
  const [zeroDev_address, setZeroDev_address] = useState<string | null>(null);
  const [web3_isConnected, setWeb3_isConnected] = useState(false);
  const [web3_walletAddress, setWeb3_walletAddress] = useState<string | null>(null);
  
  // Track whether we're currently processing an event to prevent loops
  const [isProcessingEvent, setIsProcessingEvent] = useState(false);
  
  // Debounce function to prevent too many refresh cycles
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced refresh function to update state only when needed
  const debounceRefresh = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      // Update local state from contexts
      setZeroDev_isConnected(isConnected);
      setZeroDev_address(address);
      setWeb3_isConnected(web3Connected);
      setWeb3_walletAddress(walletAddress);
    }, 200);
  };

  // Format address for display
  const formatAddress = (address: string | null): string => {
    if (!address) return 'Not Connected';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Reconnect OCID wallet for transaction support
  const reconnectOCIDWallet = async () => {
    if (isReconnecting || reconnectAttemptsRef.current > 3) return;
    
    try {
      setIsReconnecting(true);
      
      // Get session data from localStorage
      const sessionData = localStorage.getItem('sessionData');
      if (!sessionData) return;
      
      const session = JSON.parse(sessionData);
      if (session.type !== 'ocid') return;
      
      // 检查钱包是否已经具有交易能力
      if (session.transactionCapabilities) {
        console.log("Wallet already has transaction capabilities, skipping reconnection");
        return;
      }
      
      console.log("Attempting to re-initialize OCID wallet for transaction support...");
      reconnectAttemptsRef.current++;
      
      // 在这里我们不再调用 connectWithOCID，而是只尝试连接 Web3Context
      await connectWallet();
      
      console.log("OCID wallet re-initialization complete via Web3Context");
    } catch (error) {
      console.error("Failed to re-initialize OCID wallet:", error);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Synchronize wallet connection state when component mounts
  useEffect(() => {
    // Skip if state hasn't changed or is currently syncing
    if (isSyncing || 
        (prevStateRef.current.isConnected === isConnected && 
         prevStateRef.current.address === address && 
         prevStateRef.current.web3Connected === web3Connected)) {
      return;
    }
    
    // Update previous state record
    prevStateRef.current = { isConnected, address, web3Connected };
    
    // Use debounce processing, delay sync logic
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        
        console.log('Synchronizing wallet state...', { 
          zeroDev: { isConnected, address: address ? formatAddress(address) : null }, 
          web3Context: { web3Connected }
        });
  
        // Wallet is connected but Web3Context is not
        if (isConnected && address && !web3Connected) {
          console.log('Detected ZeroDev wallet is connected, syncing to Web3Context...');
          try {
            await connectWallet();
          } catch (error) {
            console.error('Failed to sync wallet state:', error);
          }
        } 
        // Web3Context is connected but wallet is disconnected
        else if (!isConnected && web3Connected) {
          // Check if there is global state indicating it should still be connected
          if ((window as any).walletConnected && (window as any).walletAddress) {
            console.log('Web3Context is connected but ZeroDev shows disconnected. Detected global wallet state is still connected, maintaining Web3Context connection state...');
            
            // Check if we need to reconnect OCID wallet for transaction support
            const sessionData = localStorage.getItem('sessionData');
            if (sessionData) {
              const session = JSON.parse(sessionData);
              if (session.type === 'ocid' && reconnectAttemptsRef.current < 3) {
                // Schedule a reconnection attempt
                setTimeout(() => {
                  reconnectOCIDWallet();
                }, 1000);
              }
            }
          } else {
            console.log('Detected ZeroDev wallet is disconnected, syncing to Web3Context...');
            disconnectWallet();
          }
        }
      } finally {
        setIsSyncing(false);
      }
    }, 200); // Add 200ms debounce
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isConnected, address, web3Connected, connectWallet, disconnectWallet, isSyncing, connectWithOCID]);

  // Listen for global wallet connection events - one-time setup to avoid duplicate listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let isProcessingEvent = false;

    const handleWalletConnected = async (event: WalletConnectedEvent) => {
      const detail = event.detail || {};
      
      // 防止重复处理同一事件
      if (isProcessingEvent) return;
      
      try {
        setIsProcessingEvent(true);
        console.log("Detected global wallet connection event:", detail);
        
        // 检查是否有 syncAll 标志，这表示需要同步 ZeroDev 和 Web3Context
        if (detail.syncAll) {
          console.log("Synchronizing all wallet states to ensure ZeroDev and Web3Context are consistent...");
          
          // 此处仅记录当前状态，不依赖它来决定行为
          console.log("Synchronizing wallet state...", {
            zeroDev: { connected: isConnected, address },
            web3Context: { connected: web3Connected, address: walletAddress }
          });
          
          // 强制同步 ZeroDev 状态 - 总是让 ZeroDev 优先
          if (!isConnected && detail.address) {
            const event = new CustomEvent('walletConnected', {
              detail: {
                address: detail.address,
                syncAll: true
              }
            });
            window.dispatchEvent(event);
          }
          
          // 强制同步 Web3Context 状态
          if (!web3Connected && detail.address) {
            // 使用短延迟确保事件按顺序处理
            setTimeout(async () => {
              console.log("Trying to connect Web3Context with address:", detail.address);
              await connectWallet();
            }, 100);
          }
          
          // 同步全局状态
          if (typeof window !== 'undefined') {
            (window as any).walletConnected = true;
            (window as any).walletAddress = detail.address;
          }
          
          // 更新组件状态
          debounceRefresh();
          return;
        }
        
        // 检查是否是 OCID 提供的连接
        if (detail.provider === 'ocid') {
          console.log("Forcing wallet connection state update (ocid), regardless of current state...");
          
          // 使用 OCID 连接重新连接钱包以获取交易能力
          if (detail.reconnectForTransactions && !web3Connected) {
            // 短延迟以确保事件处理顺序
            setTimeout(async () => {
              try {
                await connectWallet();
              } catch (error) {
                console.error("Failed to reconnect wallet for transaction capabilities:", error);
              }
            }, 100);
          }
        }
      } finally {
        // 更新状态是否有变化
        debounceRefresh();
        setTimeout(() => {
          setIsProcessingEvent(false);
        }, 300);
      }
    };

    const handleWalletDisconnected = () => {
      if (isProcessingEvent) return;
      
      try {
        isProcessingEvent = true;
        console.log('Detected global wallet disconnection event');
        
        if (web3Connected) {
          disconnectWallet();
        }
      } finally {
        setTimeout(() => {
          isProcessingEvent = false;
        }, 300);
      }
    };
    
    // Add walletReady event handler
    const handleWalletReady = (event: any) => {
      if (isProcessingEvent) return;
      
      try {
        isProcessingEvent = true;
        console.log('Detected wallet ready event:', event.detail);
        
        // Only connect Web3Context, do not try OCID reconnect
        if (!web3Connected) {
          connectWallet();
        }
      } finally {
        setTimeout(() => {
          isProcessingEvent = false;
        }, 300);
      }
    };

    // Add event listeners
    window.addEventListener('walletConnected', (handleWalletConnected as unknown) as EventListener);
    window.addEventListener('walletDisconnected', handleWalletDisconnected);
    window.addEventListener('walletReady', (handleWalletReady as unknown) as EventListener);

    // Check initial global state - only once on component mount
    const checkGlobalState = async () => {
      if ((window as any).walletConnected && (window as any).walletAddress) {
        console.log('Detected global wallet state:', { 
          address: formatAddress((window as any).walletAddress),
          connected: (window as any).walletConnected
        });
        
        // Force trigger a wallet connected event to ensure all components update
        const walletConnectedEvent = new CustomEvent('walletConnected', { 
          detail: { 
            address: (window as any).walletAddress,
            syncAll: true,
            forceUpdate: true
          }
        });
        window.dispatchEvent(walletConnectedEvent);
        
        // Check if session data is marked as having transaction capabilities
        const sessionData = localStorage.getItem('sessionData');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.type === 'ocid' && !session.transactionCapabilities && reconnectAttemptsRef.current < 3) {
            // Use Web3Context connect method, do not call connectWithOCID
            if (!web3Connected) {
              await connectWallet();
            }
          }
        }
      }
    };
    
    checkGlobalState();

    return () => {
      window.removeEventListener('walletConnected', (handleWalletConnected as unknown) as EventListener);
      window.removeEventListener('walletDisconnected', handleWalletDisconnected);
      window.removeEventListener('walletReady', (handleWalletReady as unknown) as EventListener);
    };
  }, [web3Connected, connectWallet, disconnectWallet]);

  // Add event listeners once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Add state polling to periodically check and reconcile state
    const stateCheckInterval = setInterval(() => {
      // Get global wallet state
      const globalConnected = !!(window as any).walletConnected;
      const globalAddress = (window as any).walletAddress;
      
      // Compare with local context states
      const zeroDev = {
        connected: isConnected,
        address: address
      };
      
      const web3Context = {
        connected: web3Connected,
        address: walletAddress
      };
      
      // If any mismatch detected between global state and contexts, reconcile
      if (globalConnected && globalAddress) {
        if (!zeroDev.connected || !web3Context.connected) {
          // Force sync with small delay to let other operations complete
          console.log("State inconsistency detected, reconciling...");
          setTimeout(() => {
            syncWalletStates();
          }, 100);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(stateCheckInterval);
    };
  }, [isConnected, web3Connected, address, walletAddress]);

  // Synchronize wallet states function
  const syncWalletStates = () => {
    if (typeof window === 'undefined') return;
    
    // Force trigger a wallet connected event to ensure all components update
    const walletConnectedEvent = new CustomEvent('walletConnected', { 
      detail: { 
        address: (window as any).walletAddress,
        syncAll: true,
        forceUpdate: true
      }
    });
    
    window.dispatchEvent(walletConnectedEvent);
  };

  // This component doesn't render anything, only handles state synchronization
  return null;
};

export default WalletSyncManager; 