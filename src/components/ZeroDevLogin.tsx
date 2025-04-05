'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useZeroDev } from '@/context/ZeroDevProvider';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
import { 
  KeyIcon, 
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { forceReconnectWallet, clearWalletConnection } from '@/utils/wallet-sync';

export default function ZeroDevLogin() {
  const { isConnected: zeroDev_isConnected, isLoading, address: zeroDev_address, userName, connectWithPasskey, connectWithOCID, disconnect } = useZeroDev();
  const { isConnected: web3_isConnected, walletAddress } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [combinedState, setCombinedState] = useState({
    isConnected: false,
    displayName: '',
    address: '',
    loading: false
  });
  
  // Combined connection state
  const isZeroDevConnected = zeroDev_isConnected && zeroDev_address;
  const isWeb3Connected = web3_isConnected && walletAddress;
  const isFullyConnected = isZeroDevConnected && isWeb3Connected;

  // Check login status, priority: ZeroDev > Web3Context > Global state
  useEffect(() => {
    // Update combined state
    const updateCombinedState = () => {
      // ZeroDev state
      if (isZeroDevConnected) {
        setCombinedState({
          isConnected: true,
          displayName: userName || formatAddress(zeroDev_address),
          address: zeroDev_address,
          loading: isLoading
        });
        return;
      }
      
      // Web3Context state
      if (isWeb3Connected) {
        setCombinedState({
          isConnected: true,
          displayName: formatAddress(walletAddress),
          address: walletAddress,
          loading: false
        });
        return;
      }
      
      // Global state
      if (typeof window !== 'undefined' && (window as any).walletConnected && (window as any).walletAddress) {
        const globalAddress = (window as any).walletAddress;
        setCombinedState({
          isConnected: true,
          displayName: formatAddress(globalAddress),
          address: globalAddress,
          loading: false
        });
        
        // If ZeroDev or Web3Context not connected but global state shows connected, try to sync
        if (!isZeroDevConnected && !isWeb3Connected) {
          forceReconnectWallet();
        }
        
        return;
      }
      
      // Not connected state
      setCombinedState({
        isConnected: false,
        displayName: '',
        address: '',
        loading: isLoading
      });
    };
    
    updateCombinedState();
  }, [isZeroDevConnected, isLoading, zeroDev_address, userName, isWeb3Connected, walletAddress]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Handle connect button click
  const handleConnectClick = () => {
    if (combinedState.isConnected) {
      // Show connected dropdown options
      setShowDropdown(!showDropdown);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      // Clear ZeroDev state
      await disconnect();
      // Clear all wallet connection states
      clearWalletConnection();
      setShowDropdown(false);
      toast.success("Successfully disconnected");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect");
    }
  };

  // Handle connect with passkey
  const handlePasskeyConnect = async () => {
    try {
      await connectWithPasskey();
      setShowDropdown(false);
    } catch (error) {
      console.error("Passkey connection failed:", error);
    }
  };

  // Handle connect with OCID
  const handleOCIDConnect = async () => {
    try {
      await connectWithOCID();
      // Note: This will redirect to OCID auth page, so we don't need to close dropdown
    } catch (error) {
      console.error("OCID connection failed:", error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connect Button */}
      <button
        onClick={handleConnectClick}
        disabled={combinedState.loading}
        className={`px-4 py-2 rounded-lg flex items-center justify-center transition-all ${
          combinedState.isConnected
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        } ${combinedState.loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        {combinedState.loading ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Connecting...</span>
          </div>
        ) : combinedState.isConnected ? (
          <span>{combinedState.displayName}</span>
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      {/* Connection Dropdown */}
      {showDropdown && !combinedState.isConnected && (
        <div className="absolute right-0 mt-2 w-72 bg-gray-900 rounded-xl shadow-lg z-[1000] overflow-hidden">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 text-center">Connect Your Wallet</h3>
            
            <div className="space-y-3">
              <button
                onClick={handlePasskeyConnect}
                className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center"
              >
                <div className="bg-purple-600/20 p-2 rounded-full mr-3">
                  <KeyIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Connect with Passkey</div>
                  <div className="text-xs text-gray-400">Secure and easy login with biometrics</div>
                </div>
              </button>
              
              <button
                onClick={handleOCIDConnect}
                className="w-full bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors flex items-center"
              >
                <div className="bg-blue-600/20 p-2 rounded-full mr-3">
                  <EnvelopeIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Connect with OCID</div>
                  <div className="text-xs text-gray-400">Login using your Open Campus ID</div>
                </div>
              </button>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-500">
              By connecting, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </div>
      )}
      
      {/* Connected Dropdown (Only show if connected) */}
      {showDropdown && combinedState.isConnected && (
        <div className="absolute right-0 mt-2 w-60 bg-gray-900 rounded-xl shadow-lg z-[1000] overflow-hidden">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-2 text-center">Connected</h3>
            <div className="mb-4 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-300 break-all text-center">
                {combinedState.address}
              </p>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={handleDisconnect}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-500 p-2 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 