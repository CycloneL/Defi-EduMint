'use client';

import React, { useEffect, useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import proxySigner from '@/utils/proxy-signer';

/**
 * ProxyStatus component
 * 
 * Displays the current status of the proxy signer and wallet connection
 */
export default function ProxyStatus() {
  const { walletAddress, isConnected, proxyEnabled, isProxySigner } = useWeb3();
  const [proxyAddress, setProxyAddress] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const checkProxyStatus = async () => {
      try {
        // Check if proxy signer is ready
        const ready = proxySigner.isReady();
        setIsInitialized(ready);
        
        if (ready) {
          const address = await proxySigner.getAddress();
          setProxyAddress(address);
        }
      } catch (error) {
        console.error('Failed to check proxy signer status:', error);
      }
    };
    
    checkProxyStatus();
    
    // Check status every 10 seconds
    const interval = setInterval(checkProxyStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-gray-900/60 border border-purple-500/30 rounded-lg p-4 max-w-md mx-auto mt-4">
      <h3 className="text-lg font-medium mb-2 text-purple-300">Transaction Status</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Proxy Transactions:</span>
          <span className={proxyEnabled ? 'text-green-400' : 'text-yellow-400'}>
            {proxyEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Proxy Signer:</span>
          <span className={isInitialized ? 'text-green-400' : 'text-red-400'}>
            {isInitialized ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        
        {proxyAddress && (
          <div className="flex justify-between">
            <span className="text-gray-400">Proxy Account:</span>
            <span className="text-blue-400">{formatAddress(proxyAddress)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-400">User Wallet:</span>
          <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
            {isConnected ? formatAddress(walletAddress) : 'Not Connected'}
          </span>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          <p>
            {proxyEnabled 
              ? 'Transactions will be executed by the proxy on your behalf (gas-free)' 
              : 'Transactions will require your wallet signature and gas fees'}
          </p>
        </div>
      </div>
    </div>
  );
} 