'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { 
  ChevronDownIcon, 
  ArrowRightIcon, 
  CheckIcon, 
  XMarkIcon,
  PaperAirplaneIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { isAddress } from 'ethers';

// Token interface
interface Token {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  price: string;
  change: string;
  image?: string;
  contractAddress?: string;
}

// Mock tokens data
const mockTokens: Token[] = [
  {
    id: 'edu',
    symbol: 'EDU',
    name: 'Education Token',
    balance: '120.45',
    price: '1.0',
    change: '+2.5%',
    image: 'https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png',
    contractAddress: '0x1234567890123456789012345678901234567890'
  },
  {
    id: 'blk',
    symbol: 'BLK',
    name: 'Blockchain Fundamentals',
    balance: '50.23',
    price: '0.25',
    change: '+5.7%',
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    contractAddress: '0x2345678901234567890123456789012345678901'
  },
  {
    id: 'scd',
    symbol: 'SCD',
    name: 'Smart Contract Development',
    balance: '35.67',
    price: '0.15',
    change: '-1.2%',
    image: 'https://images.unsplash.com/photo-1659606236737-de86dc9d9e67?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    contractAddress: '0x3456789012345678901234567890123456789012'
  },
  {
    id: 'defi',
    symbol: 'DEFI',
    name: 'DeFi Principles',
    balance: '12.89',
    price: '0.3',
    change: '+8.3%',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    contractAddress: '0x4567890123456789012345678901234567890123'
  },
  {
    id: 'py',
    symbol: 'PY',
    name: 'Python for Web3',
    balance: '78.42',
    price: '0.18',
    change: '+3.6%',
    image: 'https://images.unsplash.com/photo-1526379879527-8559ecfcb0c8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    contractAddress: '0x5678901234567890123456789012345678901234'
  }
];

// Recent address interface
interface RecentAddress {
  address: string;
  name: string;
  timestamp: number;
}

// Mock recent addresses
const mockRecentAddresses: RecentAddress[] = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    name: 'Alice',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2 // 2 days ago
  },
  {
    address: '0x1234567890123456789012345678901234567890',
    name: 'Bob',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 // 5 days ago
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Charlie',
    timestamp: Date.now() - 1000 * 60 * 60 * 24 * 7 // 7 days ago
  }
];

// Custom hook for token data
const useCourseTokens = () => {
  const [tokens, setTokens] = useState<Token[]>(mockTokens);
  const [loading, setLoading] = useState<boolean>(false);
  
  // In a real application, this would fetch from the blockchain or API
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTokens(mockTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
  }, []);
  
  return { tokens, loading };
};

export default function SendPage() {
  const { walletAddress, isConnected, provider, signer } = useWeb3();
  const { tokens, loading } = useCourseTokens();
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showTokenList, setShowTokenList] = useState<boolean>(false);
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [txLoading, setTxLoading] = useState<boolean>(false);
  const [showRecent, setShowRecent] = useState<boolean>(false);
  const [recentAddresses, setRecentAddresses] = useState<RecentAddress[]>(mockRecentAddresses);
  const [txStage, setTxStage] = useState<'input' | 'confirm' | 'success' | 'error'>('input');
  const [txHash, setTxHash] = useState<string>('');
  const [addressCopied, setAddressCopied] = useState<boolean>(false);
  const [hashCopied, setHashCopied] = useState<boolean>(false);

  // Validate Ethereum address
  const isValidAddress = (address: string): boolean => {
    try {
      return isAddress(address);
    } catch (error) {
      return false;
    }
  };

  // Format address display
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // If less than a day
    if (diff < 1000 * 60 * 60 * 24) {
      return 'Today';
    }
    
    // If less than a week
    if (diff < 1000 * 60 * 60 * 24 * 7) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format date
    return new Date(timestamp).toLocaleDateString();
  };

  // Select a token
  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    setShowTokenList(false);
  };

  // Select a recent address
  const handleSelectRecent = (recent: RecentAddress) => {
    setRecipientAddress(recent.address);
    setRecipientName(recent.name);
    setShowRecent(false);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate inputs
    if (!selectedToken) {
      toast.error('Please select a token');
      return;
    }
    
    if (!isValidAddress(recipientAddress)) {
      toast.error('Please enter a valid recipient address');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    const parsedBalance = parseFloat(selectedToken.balance);
    
    if (parsedAmount > parsedBalance) {
      toast.error(`Insufficient ${selectedToken.symbol} balance`);
      return;
    }
    
    // Move to confirmation step
    setTxStage('confirm');
  };

  // Send transaction
  const sendTransaction = async () => {
    if (!isConnected || !selectedToken) {
      return;
    }
    
    try {
      setTxLoading(true);
      
      // In a real application, this would call the token contract's transfer method
      // For demo purposes, simulate a network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a transaction hash
      const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setTxHash(hash);
      
      // Add to recent addresses
      if (!recentAddresses.some(recent => recent.address === recipientAddress)) {
        const newRecent: RecentAddress = {
          address: recipientAddress,
          name: recipientName || formatAddress(recipientAddress),
          timestamp: Date.now()
        };
        
        setRecentAddresses([newRecent, ...recentAddresses]);
      }
      
      // Show success message
      setTxStage('success');
      
    } catch (error: any) {
      console.error('Transaction failed:', error);
      toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      setTxStage('error');
    } finally {
      setTxLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTxStage('input');
    setSelectedToken(null);
    setRecipientAddress('');
    setRecipientName('');
    setAmount('');
    setMemo('');
    setTxHash('');
  };

  // Copy address or hash to clipboard
  const copyToClipboard = (text: string, type: 'address' | 'hash') => {
    navigator.clipboard.writeText(text).then(
      () => {
        if (type === 'address') {
          setAddressCopied(true);
          setTimeout(() => setAddressCopied(false), 2000);
        } else {
          setHashCopied(true);
          setTimeout(() => setHashCopied(false), 2000);
        }
        toast.success('Copied to clipboard');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        toast.error('Failed to copy to clipboard');
      }
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Send Tokens</h1>
          <p className="text-xl text-gray-400">Send EDU and course tokens to other wallets</p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-xl overflow-hidden"
          >
            {/* Input form */}
            {txStage === 'input' && (
              <div className="p-8">
                <div className="space-y-6">
                  {/* Token selection */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Token</label>
                    <div className="relative">
                      <button
                        className="w-full glass-dark rounded-lg p-4 flex justify-between items-center hover:bg-gray-800/50 transition-colors"
                        onClick={() => setShowTokenList(!showTokenList)}
                      >
                        {selectedToken ? (
                          <div className="flex items-center space-x-3">
                            {selectedToken.image && (
                              <div className="w-8 h-8 rounded-full overflow-hidden relative">
                                <Image 
                                  src={selectedToken.image} 
                                  alt={selectedToken.symbol}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{selectedToken.symbol}</div>
                              <div className="text-sm text-gray-400">{selectedToken.name}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Select a token</span>
                        )}
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </button>
                      
                      {/* Token dropdown */}
                      {showTokenList && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-lg glass-dark overflow-hidden max-h-60 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            {tokens.map(token => (
                              <div
                                key={token.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer"
                                onClick={() => handleSelectToken(token)}
                              >
                                <div className="flex items-center space-x-3">
                                  {token.image && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden relative">
                                      <Image 
                                        src={token.image} 
                                        alt={token.symbol}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{token.symbol}</div>
                                    <div className="text-sm text-gray-400">{token.name}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">{token.balance}</div>
                                  <div className={`text-sm ${
                                    parseFloat(token.change) > 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {token.change}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {selectedToken && (
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-gray-400">Available Balance</span>
                        <span className="font-medium">{selectedToken.balance} {selectedToken.symbol}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Recipient address */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full glass-dark rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                        placeholder="0x..."
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                      />
                      
                      {/* Recent addresses button */}
                      <button
                        className="absolute right-3 top-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded px-2 py-1 text-sm transition-colors"
                        onClick={() => setShowRecent(!showRecent)}
                      >
                        Recent
                      </button>
                      
                      {/* Recent addresses dropdown */}
                      {showRecent && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-2 rounded-lg glass-dark overflow-hidden">
                          <div className="p-2">
                            {recentAddresses.length > 0 ? (
                              recentAddresses.map((recent, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer"
                                  onClick={() => handleSelectRecent(recent)}
                                >
                                  <div>
                                    <div className="font-medium">{recent.name}</div>
                                    <div className="text-sm text-gray-400">{formatAddress(recent.address)}</div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {formatTime(recent.timestamp)}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="p-3 text-center text-gray-400">
                                No recent addresses
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Address validation indicator */}
                    {recipientAddress && (
                      <div className="mt-2 text-sm">
                        {isValidAddress(recipientAddress) ? (
                          <span className="text-green-400 flex items-center">
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Valid address
                          </span>
                        ) : (
                          <span className="text-red-400 flex items-center">
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Invalid address
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Recipient name (optional) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Recipient Name (optional)</label>
                    <input
                      type="text"
                      className="w-full glass-dark rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                      placeholder="Enter a name for this address"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                    />
                  </div>
                  
                  {/* Amount */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full glass-dark rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                        placeholder="0.0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      
                      {selectedToken && (
                        <div className="absolute right-3 top-3 flex space-x-2">
                          <button
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 rounded px-2 py-1 text-sm transition-colors"
                            onClick={() => setAmount(selectedToken.balance)}
                          >
                            MAX
                          </button>
                          <div className="bg-gray-800 text-gray-300 rounded px-2 py-1 text-sm">
                            {selectedToken.symbol}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Memo (optional) */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Memo (optional)</label>
                    <textarea
                      className="w-full glass-dark rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 min-h-[100px]"
                      placeholder="Add a note to this transaction"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                  </div>
                  
                  {/* Submit button */}
                  <button
                    className={`w-full py-4 rounded-lg font-medium transition-colors ${
                      isConnected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                        : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                    }`}
                    onClick={handleSubmit}
                    disabled={!isConnected}
                  >
                    {!isConnected ? 'Connect Wallet to Send' : 'Continue'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Confirmation screen */}
            {txStage === 'confirm' && selectedToken && (
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">Confirm Transaction</h3>
                
                <div className="glass-dark rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-400">Sending</div>
                    <div className="text-sm text-gray-400">From</div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                      {selectedToken.image && (
                        <div className="w-12 h-12 rounded-full overflow-hidden relative">
                          <Image 
                            src={selectedToken.image} 
                            alt={selectedToken.symbol}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-xl font-bold">{amount} {selectedToken.symbol}</div>
                        <div className="text-sm text-gray-400">≈ ${(parseFloat(amount) * parseFloat(selectedToken.price)).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium">{walletAddress && formatAddress(walletAddress)}</div>
                      <div className="text-xs text-gray-400">Your wallet</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center my-4">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <ArrowRightIcon className="h-5 w-5 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-400">To</div>
                    <div 
                      className="flex items-center space-x-1 cursor-pointer" 
                      onClick={() => copyToClipboard(recipientAddress, 'address')}
                    >
                      {addressCopied ? (
                        <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-400" />
                      ) : (
                        <ClipboardIcon className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-400">Copy</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="font-medium">{recipientName || 'Unnamed Recipient'}</div>
                    <div className="text-sm text-gray-400">{recipientAddress}</div>
                  </div>
                  
                  {memo && (
                    <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-400 mb-1">Memo</div>
                      <div className="text-sm">{memo}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    className="w-1/2 py-4 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    onClick={() => setTxStage('input')}
                  >
                    Back
                  </button>
                  
                  <button
                    className="w-1/2 py-4 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-colors"
                    onClick={sendTransaction}
                    disabled={txLoading}
                  >
                    {txLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Confirm Send'
                    )}
                  </button>
                </div>
              </div>
            )}
            
            {/* Success screen */}
            {txStage === 'success' && selectedToken && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <CheckIcon className="h-10 w-10 text-green-400" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Transaction Successful</h3>
                <p className="text-gray-400 mb-6">Your tokens have been sent successfully</p>
                
                <div className="glass-dark rounded-lg p-6 mb-6 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-sm text-gray-400">Amount</div>
                      <div className="text-xl font-bold mt-1">{amount} {selectedToken.symbol}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Recipient</div>
                      <div className="font-medium mt-1">{recipientName || formatAddress(recipientAddress)}</div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 my-4 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-400">Transaction Hash</div>
                      <div 
                        className="flex items-center space-x-1 cursor-pointer" 
                        onClick={() => copyToClipboard(txHash, 'hash')}
                      >
                        {hashCopied ? (
                          <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-400" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-400">Copy</span>
                      </div>
                    </div>
                    <div className="text-sm font-mono mt-1 break-all">{txHash}</div>
                  </div>
                </div>
                
                <button
                  className="w-full py-4 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-colors"
                  onClick={resetForm}
                >
                  Send More Tokens
                </button>
              </div>
            )}
            
            {/* Error screen */}
            {txStage === 'error' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <XMarkIcon className="h-10 w-10 text-red-400" />
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Transaction Failed</h3>
                <p className="text-gray-400 mb-6">There was an error processing your transaction</p>
                
                <div className="flex space-x-4">
                  <button
                    className="w-1/2 py-4 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                    onClick={() => setTxStage('input')}
                  >
                    Back
                  </button>
                  
                  <button
                    className="w-1/2 py-4 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-colors"
                    onClick={sendTransaction}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 