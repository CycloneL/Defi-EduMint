"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWeb3 } from '@/context/Web3Context';
import { useZeroDev } from '@/context/ZeroDevProvider';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronDown, Menu, X, Wallet } from "lucide-react"
import ZeroDevLogin from './ZeroDevLogin';
//import ProxyStatus from './ProxyStatus';
import { forceReconnectWallet } from '@/utils/wallet-sync';
import { formatEther, parseEther } from 'ethers';
import { usePathname } from 'next/navigation';


// Dropdown menu interface
interface DropdownItem {
  label: string
  href: string
}

// Navigation item interface
interface NavItem {
  label: string
  dropdown: DropdownItem[]
}

// Wallet provider interface
interface WalletProvider {
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Navigation menu data in English
const navItems: NavItem[] = [
  {
    label: "        Create",
    dropdown: [
      { label: "Create Course", href: "/create" },
      { label: "My Creations", href: "/my-courses" },
    ],
  },
  {
    label: "        Learn",
    dropdown: [
      { label: "Learning Center", href: "/learn" },
      { label: "My Courses", href: "/my-learning" },
    ],
  },
  {
    label: "        Trade",
    dropdown: [
      { label: "Exchange", href: "/trade" },
      { label: "Send", href: "/send" },
      { label: "Buy", href: "/buy" },
    ],
  },
  {
    label: "        Explore",
    dropdown: [
      { label: "Liquidity Providing", href: "/liquidity" },
      { label: "EDU Mining", href: "/mining" },
      { label: "Governance", href: "/governance" },
    ],
  },
]

// Wallet provider data
const walletProviders: WalletProvider[] = [
  {
    name: "MetaMask",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    description: "Connect to your MetaMask wallet"
  },
  {
    name: "Coinbase",
    icon: "https://seeklogo.com/images/C/coinbase-coin-logo-C86F46D7B8-seeklogo.com.png",
    description: "Connect to your Coinbase wallet"
  },
  {
    name: "WalletConnect",
    icon: "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
    description: "Scan QR code with WalletConnect"
  },
  {
    name: "Trust Wallet",
    icon: "https://trustwallet.com/assets/images/media/assets/trust_platform.svg",
    description: "Connect to your Trust Wallet"
  }
]

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { walletAddress, isConnected, connecting, connectWallet, eduBalance } = useWeb3();
  const { isConnected: zeroDevConnected, address, userName, userEmail } = useZeroDev();
  const [buyAmount, setBuyAmount] = useState('');
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [localEduBalance, setLocalEduBalance] = useState('0');
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [combinedConnectionState, setCombinedConnectionState] = useState({
    isConnected: false,
    address: '',
    displayName: '',
    eduBalance: '0'
  });

  // 从本地存储加载EDU余额
  useEffect(() => {
    try {
      // 尝试从本地存储中读取余额
      const storedBalance = localStorage.getItem('eduBalance');
      if (storedBalance) {
        setLocalEduBalance(storedBalance);
      } else {
        // 如果本地存储中没有余额，则设置默认值
        localStorage.setItem('eduBalance', '100');
        setLocalEduBalance('100');
      }
    } catch (error) {
      console.error('读取本地EDU余额失败:', error);
    }
  }, []);

  // 监听余额变化事件
  useEffect(() => {
    const handleBalanceChange = (event: any) => {
      if (event.detail && event.detail.balance) {
        setLocalEduBalance(event.detail.balance);
        // 显示余额变化动画效果
        setBalanceLoading(true);
        setTimeout(() => {
          setBalanceLoading(false);
        }, 800);
      }
    };

    window.addEventListener('eduBalanceChanged', handleBalanceChange);
    
    return () => {
      window.removeEventListener('eduBalanceChanged', handleBalanceChange);
    };
  }, []);

  // Monitor global state changes and wallet connection state changes
  useEffect(() => {
    const updateCombinedState = () => {
      // 1. Check ZeroDev status
      if (zeroDevConnected && address) {
        setBalanceLoading(true);
        setCombinedConnectionState({
          isConnected: true,
          address: address,
          displayName: userName || formatAddress(address),
          // 优先使用本地存储中的余额，如果没有再使用eduBalance
          eduBalance: localEduBalance || eduBalance || 'Loading...'
        });
        
        // Timer to set balance to 0 after 5 seconds if still loading
        const timer = setTimeout(() => {
          if (eduBalance === '0' || !eduBalance) {
            setBalanceLoading(false);
            setCombinedConnectionState(prev => ({
              ...prev,
              eduBalance: localEduBalance || '100'
            }));
          }
        }, 5000);
        
        return () => clearTimeout(timer);
      }
      
      // 2. Check Web3Context status
      else if (zeroDevConnected && walletAddress) {
        setBalanceLoading(true);
        setCombinedConnectionState({
          isConnected: true,
          address: walletAddress,
          displayName: formatAddress(walletAddress),
          eduBalance: localEduBalance || eduBalance || 'Loading...'
        });
      }
      
      // 3. Check global state as fallback
      else if (typeof window !== 'undefined' && (window as any).walletConnected && (window as any).walletAddress) {
        setBalanceLoading(true);
        const globalAddress = (window as any).walletAddress;
        setCombinedConnectionState({
          isConnected: true,
          address: globalAddress,
          displayName: formatAddress(globalAddress),
          eduBalance: localEduBalance || eduBalance || 'Loading...'
        });
        
        // Try to force reconnect wallet to ensure state sync
        if (!zeroDevConnected && !isConnected) {
          forceReconnectWallet();
        }
      }
      
      // 4. Not connected
      else {
        setCombinedConnectionState({
          isConnected: false,
          address: '',
          displayName: '',
          eduBalance: '0'
        });
        setBalanceLoading(false);
      }
    };
    
    updateCombinedState();
    
    // Update combined state when any dependent state changes
    return () => {
      // Clean up any pending timers if needed
    };
  }, [zeroDevConnected, address, userName, walletAddress, eduBalance, localEduBalance]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format address display
  const formatAddress = (address: string) => {
    return "connect to EDU";//`${address.substring(0, 6)}...${address.substring(address.length - 5)}`;
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex items-center justify-between px-6 py-4 backdrop-blur-sm border-b border-white/10 relative z-50"
    >
      <Link href="/" className="flex items-center space-x-2">
        <Image 
          src="https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png" 
          alt="EduMint" 
          width={32} 
          height={32} 
          unoptimized
        />
        <span className="text-white font-medium text-xl">EduMint</span>
      </Link>

      {/* Desktop navigation menu */}
      <div className="hidden md:flex items-center space-x-1">
        {navItems.map((item, index) => (
          <div key={index} className="relative group">
            <button
              className="px-3 py-2 text-gray-300 hover:text-white flex items-center"
              onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}
            >
              {item.label}
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            {activeDropdown === index && (
              <div className="absolute left-0 mt-2 w-48 rounded-md glass-dark shadow-lg z-10">
                <div className="py-1">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      href={dropdownItem.href}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-purple-700/20 hover:text-white"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Wallet Connection */}
      <div className="flex items-center space-x-4">
        {combinedConnectionState.isConnected && (
          <div className="hidden md:flex items-center space-x-2">
            <div className="px-3 py-1 rounded-lg bg-purple-900/30 text-purple-300 border border-purple-700/50 flex items-center">
              {balanceLoading ? (
                <div className="animate-pulse flex items-center">
                  <div className="w-2 h-2 bg-purple-300 rounded-full mr-1"></div>
                  <span className="text-xs font-medium">Loading...</span>
                </div>
              ) : (
                <span className="text-xs font-medium">{combinedConnectionState.eduBalance} EDU</span>
              )}
            </div>
            
            <div className="px-3 py-1 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50 flex items-center">
              <Wallet className="w-3 h-3 mr-1" />
              <span className="text-xs font-medium">{combinedConnectionState.displayName}</span>
            </div>
            
            {/* <ProxyStatus /> */}
          </div>
        )}
        
        {/* ZeroDev Login Button */}
        <ZeroDevLogin />
        
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-800/50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-300" />
          ) : (
            <Menu className="h-6 w-6 text-gray-300" />
          )}
        </button>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass border-t border-white/10 p-4 z-40">
          {navItems.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="font-medium text-gray-200 mb-2">{item.label}</div>
              <div className="pl-4 space-y-2">
                {item.dropdown.map((dropdownItem, dropdownIndex) => (
                  <Link
                    key={dropdownIndex}
                    href={dropdownItem.href}
                    className="block text-sm text-gray-400 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {dropdownItem.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar; 