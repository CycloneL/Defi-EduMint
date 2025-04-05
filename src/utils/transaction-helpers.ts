'use client';

import { ContractTransaction, JsonRpcProvider } from 'ethers';
import { toast } from 'react-hot-toast';

/**
 * Helper function to wait for a transaction to be confirmed
 * Compatible with ethers.js v6
 * 
 * @param tx - The transaction to wait for
 * @param provider - The JsonRpcProvider instance used to wait for the transaction
 * @param toastId - Optional toast ID for notifications
 * @returns The transaction receipt
 */
export const waitForTransaction = async (
  tx: ContractTransaction,
  provider: JsonRpcProvider,
  toastId?: string
) => {
  try {
    const id = toastId || 'tx-confirmation';
    
    // Show loading toast
    toast.loading("Waiting for transaction confirmation...", { id });
    
    // Wait for transaction confirmation using provider.waitForTransaction
    const receipt = await provider.waitForTransaction((tx as any).hash);
    
    // Show success toast
    toast.success("Transaction confirmed!", { id });
    
    return receipt;
  } catch (error: any) {
    console.error("Transaction confirmation failed:", error);
    throw error;
  }
};

/**
 * Format address for display
 * 
 * @param address Wallet address to format
 * @returns Formatted address (6 characters + ... + 4 characters)
 */
export const formatAddress = (address: string | null): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
