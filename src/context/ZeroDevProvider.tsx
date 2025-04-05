'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createKernelAccountClient } from "@zerodev/sdk";
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { BrowserProvider, JsonRpcProvider, Wallet } from 'ethers';
import { createPublicClient, http, Chain } from 'viem';
import { sepolia } from 'viem/chains';
import jwtDecode from 'jwt-decode';
import { OCAuthSandbox } from '@opencampus/ocid-connect-js';

// Define Open Campus Codex chain
const openCampusChain: Chain = {
  id: 656476,
  name: 'Open Campus Codex',
  nativeCurrency: {
    name: 'EDU',
    symbol: 'EDU',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.open-campus-codex.gelato.digital'],
    },
    public: {
      http: ['https://rpc.open-campus-codex.gelato.digital'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://opencampus-codex.blockscout.com/',
    },
  },
};

// Define ZeroDev context type
interface ZeroDevContextType {
  isConnected: boolean;
  isLoading: boolean;
  address: string | null;
  userName: string | null;
  userEmail: string | null;
  connectWithPasskey: () => Promise<void>;
  connectWithOCID: () => Promise<void>;
  disconnect: () => Promise<void>;
  provider: any;
  signer: any;
  kernelClient: any | null;
  loginWithOCID: () => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (transaction: {
    to: string;
    value?: bigint | string;
    data?: string;
  }) => Promise<string | null>;
}

// Create context
const ZeroDevContext = createContext<ZeroDevContextType>({
  isConnected: false,
  isLoading: false,
  address: null,
  userName: null,
  userEmail: null,
  connectWithPasskey: async () => {},
  connectWithOCID: async () => {},
  disconnect: async () => {},
  provider: null,
  signer: null,
  kernelClient: null,
  loginWithOCID: async () => {},
  loginWithPasskey: async () => {},
  signMessage: async () => null,
  sendTransaction: async () => null,
});

// Known contract addresses to avoid treating them as user addresses
const knownContractAddresses = [
  "0xca11bde05977b3631167028862be2a173976ca11", // multicall3
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // ensRegistry
  "0xc8Af999e38273D658BE1b921b88A9Ddf005769cC", // ensUniversalResolver
  "0x0000000000000000000000000000000000000000", // zero address
];

// Check if address is a valid user address
function isValidUserAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  if (knownContractAddresses.includes(address.toLowerCase())) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Function to get account address
async function getAccountAddress(account: any): Promise<string | null> {
  console.log("Getting account address, account object:", account);
  
  if (!account) {
    console.error("Account object is null or undefined");
    return null;
  }
  
  try {
    // 1. Try getting address directly from object
    if (account.account && account.account.address) {
      const address = account.account.address;
      if (isValidUserAddress(address)) return address;
    }
    
    // 2. Try getting from smartAccountAddress
    if (account.smartAccountAddress) {
      const address = account.smartAccountAddress;
      if (isValidUserAddress(address)) return address;
    }
    
    // 3. Try getting from address property
    if (account.address) {
      const address = account.address;
      if (isValidUserAddress(address)) return address;
    }
    
    // 4. Try calling getAddress method
    if (typeof account.getAddress === 'function') {
      try {
        const address = await account.getAddress();
        console.log("Address from getAddress() method:", address);
        if (isValidUserAddress(address)) return address;
      } catch (err) {
        console.error("getAddress method failed:", err);
      }
    }
    
    // 5. Try calling address as a function
    if (typeof account.address === 'function') {
      try {
        const address = await account.address();
        console.log("Address from address() method:", address);
        if (isValidUserAddress(address)) return address;
      } catch (err) {
        console.error("address method failed:", err);
      }
    }
    
    // 6. Try getting address from kernel client
    if (account.kernelClient || account._kernelClient) {
      const kernelClient = account.kernelClient || account._kernelClient;
      try {
        console.log("Trying to get address from kernelClient...");
        if (kernelClient.address) {
          const address = kernelClient.address;
          if (isValidUserAddress(address)) return address;
        }
        if (typeof kernelClient.getAddress === 'function') {
          const address = await kernelClient.getAddress();
          if (isValidUserAddress(address)) return address;
        }
      } catch (err) {
        console.error("Failed to get address from kernelClient:", err);
      }
    }
    
    // 7. Try calling deploy method to activate account
    if (typeof account.deployIfNeeded === 'function') {
      try {
        console.log("Trying to call deployIfNeeded method...");
        const result = await account.deployIfNeeded();
        console.log("deployIfNeeded result:", result);
        
        // Try getting address again
        if (account.account && account.account.address) {
          const address = account.account.address;
          if (isValidUserAddress(address)) return address;
        }
        
        // Try getting address from result
        if (result && result.address) {
          const address = result.address;
          if (isValidUserAddress(address)) return address;
        }
      } catch (err) {
        console.error("deployIfNeeded method failed:", err);
      }
    }
    
    // 8. Try initializing account
    if (typeof account.init === 'function') {
      try {
        console.log("Trying to call init method...");
        await account.init();
        
        // Try getting address again
        if (account.account && account.account.address) {
          const address = account.account.address;
          if (isValidUserAddress(address)) return address;
        }
        if (account.address) {
          const address = account.address;
          if (isValidUserAddress(address)) return address;
        }
      } catch (err) {
        console.error("init method failed:", err);
      }
    }
    
    // 9. If account has client property, try getting address from it
    if (account.client) {
      try {
        console.log("Trying to get address from client object...");
        if (account.client.account && account.client.account.address) {
          const address = account.client.account.address;
          if (isValidUserAddress(address)) return address;
        }
        if (account.client.address) {
          const address = account.client.address;
          if (isValidUserAddress(address)) return address;
        }
        if (typeof account.client.getAddress === 'function') {
          const address = await account.client.getAddress();
          if (isValidUserAddress(address)) return address;
        }
      } catch (err) {
        console.error("Failed to get address from client:", err);
      }
    }
    
    // 10. Try sendTransaction method to trigger wallet creation
    if (typeof account.sendTransaction === 'function') {
      try {
        console.log("Trying to use sendTransaction method to activate wallet...");
        // Do not send actual transaction, but it will trigger wallet creation
        const tx = {
          to: "0x0000000000000000000000000000000000000000",
          data: "0x",
          value: "0x0"
        };
        const txResponse = await account.sendTransaction(tx);
        console.log("sendTransaction response:", txResponse);
        
        // Try getting address again
        if (account.account && account.account.address) {
          const address = account.account.address;
          if (isValidUserAddress(address)) return address;
        }
        if (account.address) {
          const address = account.address;
          if (isValidUserAddress(address)) return address;
        }
        if (txResponse && txResponse.from) {
          const address = txResponse.from;
          if (isValidUserAddress(address)) return address;
        }
      } catch (err) {
        console.error("sendTransaction method failed:", err);
      }
    }
    
    // 11. Finally, try getting address from userOperation
    if (account.userOperation && account.userOperation.sender) {
      const address = account.userOperation.sender;
      if (isValidUserAddress(address)) return address;
    }
    
    // 12. Try finding address in JSON, excluding known contract addresses
    try {
      const accountStr = JSON.stringify(account);
      
      // Find all possible addresses
      const addressRegex = /"address":"(0x[a-fA-F0-9]{40})"/g;
      let match;
      let possibleAddresses = [];
      
      while ((match = addressRegex.exec(accountStr)) !== null) {
        const address = match[1];
        if (isValidUserAddress(address)) {
          possibleAddresses.push(address);
        }
      }
      
      console.log("Found all possible addresses:", possibleAddresses);
      
      if (possibleAddresses.length > 0) {
        console.log("Found possible address from JSON string:", possibleAddresses[0]);
        return possibleAddresses[0];
      }
    } catch (err) {
      console.error("Failed to analyze address from JSON:", err);
    }
    
    console.error("Failed to find a valid account address");
    return null;
  } catch (error) {
    console.error("Error getting address:", error);
    return null;
  }
}

// 使用新的Project ID和EDU测试网
const projectId = "9ed2eaaf-819d-4079-8bbd-698bb08461e6"; // 新的Open Campus Codex项目ID
const bundlerUrl = "https://rpc.zerodev.app/api/v2/bundler/9ed2eaaf-819d-4079-8bbd-698bb08461e6";
const paymasterUrl = "https://rpc.zerodev.app/api/v2/paymaster/9ed2eaaf-819d-4079-8bbd-698bb08461e6";

// ZeroDev provider component
export const ZeroDevProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [signer, setSigner] = useState<any | null>(null);
  const [kernelClient, setKernelClient] = useState<any | null>(null);
  const [ocidAuth, setOcidAuth] = useState<any>(null);
  const router = useRouter();

  // ZeroDev configuration - 使用上面定义的项目ID变量
  // const projectId = "fc20d9e8-001f-462a-adfa-625c7a5ee65b"; // 删除这行

  // Initialize OCID
  useEffect(() => {
    const initOCID = async () => {
      if (typeof window !== 'undefined' && !ocidAuth) {
        try {
          const { OCAuthSandbox } = await import('@opencampus/ocid-connect-js');
          const redirectUri = `${window.location.origin}/auth/callback`;
          
          const auth = new OCAuthSandbox({
            redirectUri,
            sandbox: true
          });
          
          setOcidAuth(auth);
        } catch (error) {
          console.error("Error initializing OCID:", error);
        }
      }
    };
    
    initOCID();
  }, [ocidAuth]);

  // 设置连接状态的函数
  const setupConnection = (accountAddress: string, accountSigner: any, userName?: string, userEmail?: string) => {
    if (!isValidUserAddress(accountAddress)) {
      console.error("Invalid wallet address, connection refused:", accountAddress);
      return false;
    }
    
    setAddress(accountAddress);
    
    console.log("Setting up connection for address:", accountAddress);
    console.log("Account signer available:", !!accountSigner);
    
    // Initialize a basic JsonRpcProvider if no signer is provided
    if (!accountSigner) {
      try {
        // Create a read-only provider using default RPC endpoint for EDU TestNet
        const readOnlyProvider = new JsonRpcProvider("http://localhost:8545");
        console.log("Created read-only provider for EDU TestNet");
        setProvider(readOnlyProvider);
        
        // Create a basic signer for OCID connections
        try {
          const wallet = new Wallet("0x0000000000000000000000000000000000000000000000000000000000000001", readOnlyProvider);
          console.log("Created basic wallet signer for read operations");
          setSigner(wallet);
          setKernelClient(wallet);
        } catch (signerError) {
          console.error("Failed to create basic wallet:", signerError);
        }
      } catch (error) {
        console.error("Failed to create read-only provider:", error);
      }
    } else if (accountSigner && typeof accountSigner === 'object' && (accountSigner.request || accountSigner.send || accountSigner.sendAsync)) {
      try {
        const browserProvider = new BrowserProvider(accountSigner);
        setProvider(browserProvider);
        
        // Get the signer from the provider
        browserProvider.getSigner().then(newSigner => {
          console.log("Successfully obtained signer from provider");
          setSigner(newSigner);
          setKernelClient(newSigner);
        }).catch(error => {
          console.error("Failed to get signer from provider:", error);
        });
      } catch (error) {
        console.warn("Failed to create BrowserProvider, using read-only mode:", error);
        // Create a read-only fallback
        try {
          const fallbackProvider = new JsonRpcProvider("http://localhost:8545");
          setProvider(fallbackProvider);
        } catch (fallbackError) {
          console.error("Failed to create fallback provider:", fallbackError);
        }
      }
    } else {
      console.log("Using read-only mode, no valid signer provider available");
      // Create a read-only provider
      try {
        const defaultProvider = new JsonRpcProvider("http://localhost:8545");
        setProvider(defaultProvider);
      } catch (error) {
        console.error("Failed to create read-only provider:", error);
      }
    }
    
    if (userName) setUserName(userName);
    if (userEmail) setUserEmail(userEmail);
    
    setIsConnected(true);
    
    // Ensure global connection state
    if (typeof window !== 'undefined') {
      // Set global state
      (window as any).walletConnected = true;
      (window as any).walletAddress = accountAddress;
      
      // Publish global event to notify other parts of the app that wallet is connected
      // Wrap in setTimeout to avoid triggering state updates during render cycle
      setTimeout(() => {
        const walletConnectedEvent = new CustomEvent('walletConnected', {
          detail: { 
            address: accountAddress,
            provider: "zerodev"
          }
        });
        window.dispatchEvent(walletConnectedEvent);
      }, 0);
    }
    
    return true;
  };

  // Check existing session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        // Check if session info exists in localStorage
        const sessionData = localStorage.getItem('sessionData');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          
          if (session && session.address && isValidUserAddress(session.address)) {
            setIsLoading(true);
            
            try {
              // Check if it's an OCID session and has token
              if (session.type === "ocid" && session.idToken) {
                try {
                  console.log("Found OCID session, but will require re-authentication for security");
                  // Instead of auto-restoring, we'll just pre-fill user information
                  setUserName(session.name || null);
                  setUserEmail(session.email || null);
                  
                  // Do not set address or connection state
                  // This forces user to explicitly authenticate again
                } catch (error) {
                  console.error("Failed to process OCID session:", error);
                  localStorage.removeItem('sessionData');
                }
              } 
              // Similarly don't auto-restore passkey sessions
              else if (session.type === "passkey") {
                console.log("Found Passkey session, but will require re-authentication for security");
                // No auto-restore for enhanced security
              }
            } catch (error) {
              console.error("Session processing failed:", error);
              localStorage.removeItem('sessionData');
            } finally {
              setIsLoading(false);
            }
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      checkExistingSession();
    }
  }, []);

  // Connect with Passkey
  const connectWithPasskey = async () => {
    if (isConnected) return;
    
    setIsLoading(true);
    
    try {
      console.log("Connecting with passkey to EDU TestNet...");
      
      // Base configuration - use EDU TestNet
      const config = {
        projectId,
        chain: openCampusChain,
        authenticator: {
          type: "passkey"
        }
      };
      
      // Use wrapper function to create account
      const account = await createAccount(config);
      
      // Safe get address
      const accountAddress = await getAccountAddress(account);
      if (!accountAddress) {
        throw new Error("Cannot get account address");
      }
      
      // Set connection status
      const connectionSuccess = setupConnection(accountAddress, account);
      
      if (connectionSuccess) {
        // Save session info to localStorage
        localStorage.setItem('zerodev_session', JSON.stringify({
          address: accountAddress,
          type: "passkey"
        }));
        
        toast.success("Connected with passkey!");
        console.log("Successfully connected to EDU TestNet with passkey:", accountAddress);
      } else {
        throw new Error("Connection failed, invalid wallet address");
      }
    } catch (error: any) {
      console.error("Passkey connection failed:", error);
      toast.error(`Connection failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect with OCID
  const connectWithOCID = async () => {
    if (isConnected) return;
    
    setIsLoading(true);
    
    try {
      // Always clear previous session data
      localStorage.removeItem('sessionData');
      
      // Store target chain info in localStorage
      localStorage.setItem('targetChain', JSON.stringify({
        network: "EDU TestNet",
        chainId: openCampusChain.id,
        projectId: projectId, // 使用统一的项目ID
        bundlerUrl: bundlerUrl, // 使用统一的bundlerUrl
        paymasterUrl: paymasterUrl // 使用统一的paymasterUrl
      }));
      
      console.log("Connecting to EDU TestNet with OCID...");
      
      if (!ocidAuth) {
        // 初始化OCID认证对象
        const redirectUri = `${window.location.origin}/auth/callback`;
        const auth = new OCAuthSandbox({
          redirectUri,
          sandbox: true // 使用sandbox模式
        });
        setOcidAuth(auth);
        
        // 使用OCID的signInWithRedirect方法进行跳转
        await auth.signInWithRedirect({ state: 'opencampus' });
      } else {
        // 如果已经初始化了ocidAuth，直接使用
        await ocidAuth.signInWithRedirect({ state: 'opencampus' });
      }
    } catch (error) {
      console.error("Error connecting with OCID:", error);
      toast.error("Failed to connect with OCID");
      setIsLoading(false);
    }
  };

  // Disconnect
  const disconnect = async () => {
    if (!isConnected) return;
    
    try {
      // Clear state
      setIsConnected(false);
      setAddress(null);
      setUserName(null);
      setUserEmail(null);
      setProvider(null);
      setSigner(null);
      
      // Remove session from localStorage
      localStorage.removeItem('zerodev_session');
      
      // Clear global state
      if (typeof window !== 'undefined') {
        const walletDisconnectedEvent = new CustomEvent('walletDisconnected');
        window.dispatchEvent(walletDisconnectedEvent);
        
        // Clear global state
        (window as any).walletConnected = false;
        (window as any).walletAddress = null;
      }
      
      toast.success("Successfully disconnected");
    } catch (error: any) {
      console.error("Failed to disconnect:", error);
      toast.error(`Failed to disconnect: ${error.message || "Unknown error"}`);
    }
  };

  // Signing functionality - new
  const signMessage = async (message: string) => {
    if (!isConnected || !kernelClient) {
      toast.error("Please connect wallet first");
      return null;
    }

    try {
      // Use Kernel client for signing
      const signature = await kernelClient.signMessage({
        message
      });
      return signature;
    } catch (error) {
      console.error("Failed to sign message:", error);
      toast.error("Failed to sign message");
      return null;
    }
  };

  // Sending transaction functionality - new
  const sendTransaction = async (transaction: {
    to: string;
    value?: bigint | string;
    data?: string;
  }) => {
    if (!isConnected || !kernelClient) {
      toast.error("Please connect wallet first");
      return null;
    }

    try {
      // Convert value format
      const txValue = typeof transaction.value === 'string' 
        ? BigInt(transaction.value) 
        : transaction.value || BigInt(0);

      // Use Kernel client to send transaction
      const txHash = await kernelClient.sendTransaction({
        to: transaction.to,
        value: txValue,
        data: transaction.data || '0x'
      });

      toast.success("Transaction submitted");
      return txHash;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      toast.error("Failed to send transaction");
      return null;
    }
  };

  // Provide context values
  const contextValue: ZeroDevContextType = {
    isConnected,
    isLoading,
    address,
    userName,
    userEmail,
    connectWithPasskey,
    connectWithOCID,
    disconnect,
    provider,
    signer,
    kernelClient,
    loginWithOCID: connectWithOCID,
    loginWithPasskey: connectWithPasskey,
    signMessage,
    sendTransaction
  };

  // Listen for global wallet events - used to synchronize wallet state between components
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Event handler for global wallet connect
    const handleGlobalWalletConnect = (e: any) => {
      // Safely access event detail
      const detail = e.detail || {};
      
      console.log("ZeroDev Provider: Received wallet connect event", { 
        syncAll: detail.syncAll,
        address: detail.address,
        currentlyConnected: isConnected
      });
      
      // If already connected, only update if syncAll flag is present
      if (isConnected && !detail.syncAll) {
        console.log("ZeroDev Provider: Already connected, ignoring event");
        return;
      }
      
      // Check for sync all flag - indicates we need to update state
      if (detail.syncAll && detail.address) {
        console.log("ZeroDev Provider: Detected sync request, updating state...");
        
        // Update ZeroDev state with address from event
        setAddress(detail.address);
        setIsConnected(true);
        
        // If userName data is present, also update it
        if (detail.userName) {
          setUserName(detail.userName);
        }
        
        console.log("ZeroDev Provider: State updated");
      }
    };
    
    // Add event listeners
    window.addEventListener('walletConnected', handleGlobalWalletConnect);
    
    // Clear event listeners
    return () => {
      window.removeEventListener('walletConnected', handleGlobalWalletConnect);
    };
  }, [isConnected]);

  // Initial state check - check for existing wallet connection on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if global wallet state is set
    if ((window as any).walletConnected && (window as any).walletAddress && !isConnected) {
      console.log("ZeroDev Provider: Detected existing global wallet state, initializing...");
      
      // Set initial state from global state
      setAddress((window as any).walletAddress);
      setIsConnected(true);
    }
  }, []);

  return (
    <ZeroDevContext.Provider value={contextValue}>
      {children}
    </ZeroDevContext.Provider>
  );
};

// Export hook for using the context
export const useZeroDev = () => useContext(ZeroDevContext);

// Extract ETH address from JWT token
function extractEthAddressFromToken(token: string): string | null {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("JWT token payload:", payload);
      
      if (payload.eth_address && isValidUserAddress(payload.eth_address)) {
        console.log("Found ETH address in JWT token:", payload.eth_address);
        return payload.eth_address;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to extract ETH address from JWT token:", error);
    return null;
  }
}

// Update the createAccount function to use Open Campus chain
async function createAccount(config: any): Promise<any> {
  console.log("Creating Kernel account with config:", config);
  
  let account = null;
  let error = null;
  
  try {
    // Helper function to activate account
    async function activateAccount(acc: any) {
      if (!acc) return null;
      
      try {
        // Try to deploy if needed
        if (typeof acc.deployIfNeeded === 'function') {
          console.log("Deploying account if needed...");
          await acc.deployIfNeeded();
        }
        
        // Try to initialize account
        if (typeof acc.init === 'function') {
          console.log("Initializing account...");
          await acc.init();
        }
        
        return acc;
      } catch (err) {
        console.error("Failed to activate account:", err);
        return acc;
      }
    }
    
    // Ensure chain is set to Open Campus EDU
    const baseConfig = {
      ...config,
      chain: openCampusChain,
    };
    
    // 1. First try with bundlerTransport config
    if (baseConfig.authenticator?.type === 'oauth' || baseConfig.authenticator?.authType === 'oauth') {
      // For OAuth configuration
      const bundlerUrl = "https://rpc.zerodev.app/api/v2/bundler/9ed2eaaf-819d-4079-8bbd-698bb08461e6";
      const paymasterUrl = "https://rpc.zerodev.app/api/v2/paymaster/9ed2eaaf-819d-4079-8bbd-698bb08461e6";
      
      const minConfig = {
        projectId: baseConfig.projectId,
        chain: baseConfig.chain,
        authenticator: {
          authType: 'oauth',
          token: baseConfig.authenticator.idToken || baseConfig.authenticator.token,
          provider: 'ocid'
        },
        bundlerTransport: ({ chain }: any) => http(bundlerUrl),
        paymasterTransport: ({ chain }: any) => http(paymasterUrl),
      };
      
      console.log("Trying with bundlerTransport configuration:", minConfig);
      
      try {
        account = await createKernelAccountClient(minConfig);
        console.log("Account creation successful (bundlerTransport method):", account);
        if (account) {
          return await activateAccount(account);
        }
      } catch (err) {
        console.error("OAuth method failed:", err);
        error = err;
      }
    } else if (baseConfig.authenticator?.type === 'passkey' || baseConfig.authenticator?.authType === 'passkey') {
      // For Passkey configuration
      try {
        account = await createKernelAccountClient(baseConfig);
        console.log("Account creation successful (passkey method):", account);
        if (account) {
          return await activateAccount(account);
        }
      } catch (err) {
        console.error("Passkey method failed:", err);
        error = err;
      }
    }
    
    // 2. If previous method failed, try with minimal config
    if (!account) {
      try {
        console.log("Trying with minimal configuration");
        account = await createKernelAccountClient(baseConfig);
        console.log("Account creation successful (minimal config):", account);
        if (account) {
          return await activateAccount(account);
        }
      } catch (err) {
        console.error("Minimal config method failed:", err);
        if (!error) error = err;
      }
    }
    
    // If all methods failed, throw the error
    if (!account && error) {
      throw error;
    }
    
    return account;
  } catch (err) {
    console.error("Failed to create account:", err);
    throw err;
  }
}

// Helper function to format wallet address for display
const formatWalletAddress = (address: string | null): string => {
  if (!address) return 'Not Connected';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}; 