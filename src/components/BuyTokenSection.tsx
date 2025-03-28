import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const BuyTokenSection: React.FC = () => {
  const { connected, contracts, account, provider, buyEduTokens } = useWeb3();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Mock token price (1 ETH = 1000 EDU)
  const exchangeRate = 1000;
  
  // Calculate output amount
  const outputAmount = parseFloat(amount) * exchangeRate || 0;
  
  // Handle purchase
  const handleBuy = async () => {
    try {
      if (!connected) {
        toast.error('Please connect your wallet first');
        return;
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      setLoading(true);
      
      // Use buyEduTokens method from Web3Context
      const tx = await buyEduTokens(amount);
      console.log('Transaction submitted:', tx.hash);
      
      await tx.wait();
      console.log('Transaction confirmed');
      
      // Clear input
      setAmount('');
      
      // Show success message
      toast.success(`Successfully purchased ${amount} EDU tokens!`);
      
    } catch (error: any) {
      console.error('Purchase failed:', error);
      toast.error(`Purchase failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl p-6 max-w-md mx-auto"
    >
      <h3 className="text-xl font-bold mb-4 text-center">Buy EDU Tokens</h3>
      <p className="text-gray-400 text-sm mb-6 text-center">
        Use ETH to purchase EDU tokens for platform governance and course trading
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Payment Amount (ETH)</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min="0"
              step="0.01"
            />
            <button
              className="absolute right-2 top-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              onClick={() => setAmount('0.1')}
            >
              MIN
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Tokens Received (EDU)</label>
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">{outputAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              <span className="text-indigo-400">EDU</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Exchange Rate</span>
            <span>1 ETH = {exchangeRate} EDU</span>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 rounded-lg p-3 text-sm">
            Purchase successful! Tokens have been added to your wallet.
          </div>
        )}
        
        <button
          className={`w-full py-3 rounded-lg font-medium transition-all ${
            connected
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
              : 'bg-gray-700 text-gray-300 cursor-not-allowed'
          }`}
          onClick={handleBuy}
          disabled={!connected || loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : !connected ? (
            'Please connect wallet first'
          ) : (
            'Buy EDU Tokens'
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default BuyTokenSection; 