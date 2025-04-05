/**
 * Proxy Signer Module
 * 
 * Provides core implementation for proxy transactions using a specified private key
 * allowing users to interact with the blockchain without paying gas fees
 */

'use client';

import { ethers } from 'ethers';
import toast from 'react-hot-toast';

// 改回原来可工作的 RPC URL
const EDU_TESTNET_RPC = 'https://rpc.open-campus-codex.gelato.digital';

class ProxySigner {
  private signer: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private balance: string = '0';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize proxy signer
   */
  private async initialize() {
    try {
      // Get private key from environment variables
      const privateKey = process.env.NEXT_PUBLIC_PROXY_PRIVATE_KEY;
      
      if (!privateKey) {
        console.warn('Proxy signer private key not configured, proxy transactions will be unavailable');
        return;
      }
      
      console.log('Initializing proxy signer with configured private key');
      
      // Create Provider
      this.provider = new ethers.JsonRpcProvider(EDU_TESTNET_RPC);
      
      // Create wallet instance
      const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      this.signer = new ethers.Wallet(formattedKey, this.provider);
      
      // Query current balance
      this.updateBalance();
      
      console.log(`Proxy signer initialized successfully, address: ${this.signer.address}`);
    } catch (error) {
      console.error('Failed to initialize proxy signer:', error);
      this.signer = null;
      this.provider = null;
    }
  }

  /**
   * Update balance information
   */
  private async updateBalance() {
    if (!this.signer || !this.provider) return;
    
    try {
      const balance = await this.provider.getBalance(this.signer.address);
      this.balance = ethers.formatEther(balance);
      console.log(`Proxy account balance: ${this.balance} ETH`);
    } catch (error) {
      console.error('Failed to get proxy account balance:', error);
    }
  }

  /**
   * Get proxy signer address
   */
  public async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('Proxy signer not initialized');
    }
    return this.signer.address;
  }

  /**
   * Send transaction
   */
  public async sendTransaction(transaction: {
    to: string;
    value?: bigint | string;
    data?: string;
  }): Promise<ethers.TransactionResponse> {
    if (!this.signer) {
      throw new Error('Proxy signer not initialized');
    }
    
    // Send transaction
    const tx = await this.signer.sendTransaction(transaction);
    console.log(`Proxy transaction sent: ${tx.hash}`);
    
    // Update balance
    this.updateBalance();
    
    return tx;
  }

  /**
   * Check if proxy signer is ready
   */
  public isReady(): boolean {
    return this.signer !== null;
  }

  /**
   * Get proxy signer current balance
   */
  public getBalance(): string {
    return this.balance;
  }

  /**
   * Get proxy signer instance
   */
  public getSigner(): ethers.Wallet | null {
    return this.signer;
  }

  /**
   * Get Provider instance
   */
  public getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }
}

// Create singleton instance
const proxySigner = new ProxySigner();

export default proxySigner; 