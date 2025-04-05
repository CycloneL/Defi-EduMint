'use client';

import React, { useEffect } from 'react';
import { Web3Provider } from '@/context/Web3Context';
import { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { SparklesCore } from '@/components/sparkles';
import { ZeroDevProvider } from '@/context/ZeroDevProvider';
import WalletSyncManager from '@/components/WalletSyncManager';
import dynamic from 'next/dynamic';

// 动态导入OCConnectWrapper，避免SSR问题
const OCConnectWrapper = dynamic(() => import('@/components/OCConnectWrapper'), {
  ssr: false
});

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // 初始化全局钱包状态
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 检查是否有会话数据
    const storedData = localStorage.getItem('sessionData');
    
    if (storedData) {
      try {
        const sessionData = JSON.parse(storedData);
        
        // 如果会话数据存在并有效，初始化全局状态
        if (sessionData.address) {
          console.log("Initializing global wallet state from stored session:", sessionData.address);
          
          // 设置全局变量
          (window as any).walletConnected = true;
          (window as any).walletAddress = sessionData.address;
          
          if (sessionData.ocid) {
            (window as any).ocid = sessionData.ocid;
          }
          
          // 立即先触发一次事件确保立即更新状态
          const immediateEvent = new CustomEvent('walletConnected', { 
            detail: {
              address: sessionData.address,
              ocid: sessionData.ocid,
              provider: sessionData.type,
              syncAll: true,
              forceUpdate: true
            }
          });
          window.dispatchEvent(immediateEvent);
          
          // 然后延迟触发另一次事件，确保组件已加载完成
          setTimeout(() => {
            const walletConnectedEvent = new CustomEvent('walletConnected', { 
              detail: {
                address: sessionData.address,
                ocid: sessionData.ocid,
                provider: sessionData.type,
                syncAll: true,
                forceUpdate: true
              }
            });
            window.dispatchEvent(walletConnectedEvent);
            
            console.log("Dispatched global wallet connected event");
          }, 1000);
        }
      } catch (e) {
        console.error("Failed to parse stored session data:", e);
      }
    }
    
    // 每10秒检查一次状态，确保所有组件同步
    const intervalId = setInterval(() => {
      if ((window as any).walletConnected && (window as any).walletAddress) {
        const syncEvent = new CustomEvent('walletConnected', { 
          detail: { 
            address: (window as any).walletAddress,
            syncAll: true,
            forceUpdate: true
          }
        });
        window.dispatchEvent(syncEvent);
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <OCConnectWrapper>
      <ZeroDevProvider>
        <Web3Provider>
          <WalletSyncManager />
          <div className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02] relative">
            {/* Particle background for all pages */}
            <div className="h-full w-full absolute inset-0 z-0">
              <SparklesCore
                id="tsparticlesfullpage"
                background="transparent"
                minSize={0.6}
                maxSize={1.4}
                particleDensity={100}
                className="w-full h-full"
                particleColor="#FFFFFF"
              />
            </div>

            <div className="relative z-10">
              <Navbar />
              <main className="relative">
                {children}
              </main>
            </div>
          </div>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#1f1f23',
              color: '#fff',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }
          }} />
        </Web3Provider>
      </ZeroDevProvider>
    </OCConnectWrapper>
  );
} 