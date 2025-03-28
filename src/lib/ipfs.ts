import { Buffer } from 'buffer';

// Mock IPFS implementation without external dependencies

// Mock storage for development
const mockIpfsStorage: Record<string, any> = {};

// Configuration - use environment variables if available
const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID || '';
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET || '';
const auth = projectId && projectSecret
  ? 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
  : '';

// Simulated delay for realistic mock operations
const simulateNetworkDelay = (min = 500, max = 2000) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Upload content to IPFS (mock implementation)
 * @param file File to upload
 * @param onProgress Progress callback function
 * @returns Uploaded IPFS hash
 */
export const uploadToIPFS = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Simulate progress updates
    if (onProgress) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15);
        if (progress > 100) progress = 100;
        onProgress(progress);
        if (progress === 100) clearInterval(interval);
      }, 300);
    }

    // Simulate network delay
    await simulateNetworkDelay();

    // Generate a mock IPFS hash - in real implementation this would come from IPFS
    const mockHash = `Qm${Array.from({ length: 44 }, () => 
      '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'[Math.floor(Math.random() * 58)]
    ).join('')}`;

    // Store file metadata in mock storage
    mockIpfsStorage[mockHash] = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      timestamp: Date.now()
    };

    console.log(`[MOCK IPFS] File uploaded with hash: ${mockHash}`);
    return mockHash;
  } catch (error) {
    console.error('Error in mock IPFS upload:', error);
    throw new Error('Failed to upload to IPFS (mock)');
  }
};

/**
 * Upload JSON object to IPFS (mock implementation)
 * @param jsonData JSON object to upload
 * @param onProgress Progress callback function
 * @returns Uploaded IPFS hash
 */
export const uploadJSONToIPFS = async (
  jsonData: any,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Convert JSON to string
    const jsonString = JSON.stringify(jsonData);
    
    // Create a mock file
    const metadataBlob = new Blob([jsonString], { type: 'application/json' });
    const metadataFile = new File([metadataBlob], 'metadata.json');
    
    // Use the file upload function
    return await uploadToIPFS(metadataFile, onProgress);
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

/**
 * Generate IPFS content URL (mock implementation)
 * @param ipfsHash IPFS hash
 * @returns IPFS gateway URL
 */
export const getIPFSUrl = (ipfsHash: string): string => {
  // In a real implementation, this would return an actual IPFS gateway URL
  // For demo purposes, we're using a mock URL format
  return `https://mock-ipfs-gateway.io/ipfs/${ipfsHash}`;
};

/**
 * Create video playback URL (mock implementation)
 * @param ipfsHash IPFS hash
 * @returns Video URL
 */
export const getVideoUrl = (ipfsHash: string): string => {
  return getIPFSUrl(ipfsHash);
};

/**
 * Create image URL (mock implementation)
 * @param ipfsHash IPFS hash
 * @returns Image URL
 */
export const getImageUrl = (ipfsHash: string): string => {
  return getIPFSUrl(ipfsHash);
};

// Optional: Mock function to retrieve data (would be handled by IPFS gateways in real implementation)
export const getFromIPFS = async (ipfsHash: string): Promise<any> => {
  await simulateNetworkDelay(200, 800);
  return mockIpfsStorage[ipfsHash] || null;
}; 