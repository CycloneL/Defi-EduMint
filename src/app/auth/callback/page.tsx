'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LoginCallBack, useOCAuth } from '@opencampus/ocid-connect-js';
import { useZeroDev } from '@/context/ZeroDevProvider';
import { syncWalletAfterOCIDAuth, markWalletWithTransactionCapabilities } from '@/utils/wallet-sync';

// Custom loading component
function CustomLoadingComponent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Verifying</h1>
        <div className="text-center">
          <p className="text-lg mb-2">Processing OCID authentication...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom error component
function CustomErrorComponent() {
  const { authState } = useOCAuth();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Failed</h1>
        <div className="text-center">
          <div className="mt-4 text-red-600 p-3 bg-red-100 rounded-md">
            <p>{authState?.error?.message || 'An unknown error occurred during authentication'}</p>
          </div>
          <button 
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            onClick={() => window.location.href = '/'}
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Success handler component
function SuccessHandler() {
  const router = useRouter();
  const { authState, ethAddress, OCId } = useOCAuth();
  const { isConnected } = useZeroDev();
  const [processed, setProcessed] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  
  useEffect(() => {
    // Ensure component only processes success logic once
    if (!processed && authState?.isAuthenticated && ethAddress) {
      console.log("Authentication successful, user info:", { authState, ethAddress, OCId });
      setProcessed(true);
      
      // Use utility function to sync wallet state
      syncWalletAfterOCIDAuth(ethAddress, OCId || '', authState.idToken);
      
      // 存储认证信息，而不是尝试重新连接 OCID
      const setupWallet = async () => {
        try {
          setReconnecting(true);
          console.log("Setting up wallet for transactions...");
          
          // Wait a moment for initial sync to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 直接标记钱包具有交易能力，而不调用可能导致重定向的 connectWithOCID 方法
          markWalletWithTransactionCapabilities(ethAddress);
          
          // 使用自定义事件通知其他组件钱包已准备好
          if (typeof window !== 'undefined') {
            const walletReadyEvent = new CustomEvent('walletReady', { 
              detail: { address: ethAddress }
            });
            window.dispatchEvent(walletReadyEvent);
          }
          
          console.log("Wallet setup complete");
          toast.success("OCID connection successful!");
        } catch (error) {
          console.error("Wallet setup failed:", error);
          toast.error("Error setting up wallet: " + (error as Error).message);
        } finally {
          setReconnecting(false);
          
          // Delay redirect to home page
          setTimeout(() => {
            console.log("Redirecting to home page...");
            router.push('/');
          }, 1500);
        }
      };
      
      setupWallet();
    }
  }, [authState, ethAddress, OCId, router, processed]);
  
  // 检查 authState 是否已经加载
  if (!authState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">正在获取认证状态</h1>
          <div className="text-center">
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show UI when authentication is successful
  if (authState.isAuthenticated && ethAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Authentication Successful</h1>
          <div className="text-center">
            <p className="text-lg mb-2">
              {reconnecting 
                ? "Setting up wallet..." 
                : "OCID connection successful, returning to home page..."}
            </p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If authentication is not successful yet, return null to let LoginCallBack show its own components
  return null;
}

export default function AuthCallback() {
  const router = useRouter();
  
  // Login success callback
  const loginSuccess = () => {
    console.log("OCID login success callback triggered");
    // SuccessHandler component will handle post-authentication logic
  };
  
  // Login error callback
  const loginError = (error: any) => {
    console.error("OCID login failed:", error);
    toast.error("OCID connection failed: " + (error?.message || "Unknown error"));
    
    // Delay return to home page
    setTimeout(() => {
      router.push('/');
    }, 2000);
  };
  
  return (
    <>
      <SuccessHandler />
      <LoginCallBack 
        errorCallback={loginError}
        successCallback={loginSuccess}
        customErrorComponent={<CustomErrorComponent />}
        customLoadingComponent={<CustomLoadingComponent />}
      />
    </>
  );
} 