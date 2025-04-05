'use client';

import { Web3Storage } from 'web3.storage';
import toast from 'react-hot-toast';

// IPFS Service Class
class IPFSService {
  private client: Web3Storage | null = null;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize Web3.Storage client
   */
  private initialize() {
    try {
      const token = process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN;
      
      if (!token) {
        console.warn('Web3.Storage token not found. IPFS uploads will not work.');
        return;
      }
      
      this.client = new Web3Storage({ token });
      console.log('IPFS service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize IPFS service:', error);
    }
  }
  
  /**
   * Upload file to IPFS
   * @param file File to upload
   * @returns CID of the uploaded file
   */
  public async uploadFile(file: File): Promise<string> {
    if (!this.client) {
      throw new Error('IPFS service not initialized');
    }
    
    try {
      toast.loading('Uploading to IPFS...', { id: 'ipfs-upload' });
      
      // Create a Web3.Storage file object
      const files = [new File([file], file.name, { type: file.type })];
      
      // Upload to IPFS
      const cid = await this.client.put(files, {
        maxRetries: 3,
        wrapWithDirectory: false
      });
      
      toast.success('Upload successful', { id: 'ipfs-upload' });
      console.log(`File uploaded to IPFS with CID: ${cid}`);
      
      return cid;
    } catch (error) {
      console.error('Failed to upload file to IPFS:', error);
      toast.error('Failed to upload file to IPFS', { id: 'ipfs-upload' });
      throw error;
    }
  }
  
  /**
   * Get IPFS URL from CID
   * @param cid IPFS CID
   * @returns IPFS URL
   */
  public getIPFSUrl(cid: string): string {
    return `https://${cid}.ipfs.dweb.link`;
  }
  
  /**
   * Check if IPFS service is ready
   * @returns boolean indicating if service is ready
   */
  public isReady(): boolean {
    return this.client !== null;
  }
}

// Singleton instance
const ipfsService = new IPFSService();

export default ipfsService; 