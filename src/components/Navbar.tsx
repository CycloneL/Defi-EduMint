"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import { ChevronDown, Menu, X } from "lucide-react"

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
    label: "Course Creators",
    dropdown: [
      { label: "Create Course", href: "/create" },
      { label: "My Creations", href: "/my-courses" },
    ],
  },
  {
    label: "Learners",
    dropdown: [
      { label: "Learning Center", href: "/learn" },
      { label: "My Courses", href: "/my-learning" },
    ],
  },
  {
    label: "Traders",
    dropdown: [
      { label: "Exchange", href: "/trade" },
      { label: "Send", href: "/send" },
      { label: "Buy", href: "/buy" },
    ],
  },
  {
    label: "Explore",
    dropdown: [
      { label: "Liquidity Providing", href: "/liquidity" },
      { label: "EDU Mining", href: "/mining" },
      { label: "Governance", href: "/governance" },
    ],
  },
]

// 钱包提供商数据 - 使用真实图标
const walletProviders: WalletProvider[] = [
  {
    name: "MetaMask",
    icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    description: "连接到您的MetaMask钱包"
  },
  {
    name: "Coinbase",
    icon: "https://seeklogo.com/images/C/coinbase-coin-logo-C86F46D7B8-seeklogo.com.png",
    description: "连接到您的Coinbase钱包"
  },
  {
    name: "WalletConnect",
    icon: "https://seeklogo.com/images/W/walletconnect-logo-EE83B50C97-seeklogo.com.png",
    description: "使用WalletConnect扫码连接"
  },
  {
    name: "Trust Wallet",
    icon: "https://trustwallet.com/assets/images/media/assets/trust_platform.svg",
    description: "连接到您的Trust Wallet"
  }
]

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { account, connected, connecting, connectWallet, eduBalance } = useWeb3();
  const [buyAmount, setBuyAmount] = useState('');
  const [buying, setBuying] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Format address display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setWalletModalOpen(false);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
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
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item, index) => (
          <div 
            key={index} 
            className="relative"
          >
            {/* Use a div instead of button to fix the hover issue */}
            <div 
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors cursor-pointer"
              onMouseEnter={() => setActiveDropdown(index)}
            >
              <span>{item.label}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            
            {/* Dropdown menu - fixed by adding onMouseLeave to the dropdown itself */}
            {activeDropdown === index && (
              <div 
                className="absolute left-0 mt-2 w-48 rounded-md overflow-hidden z-50 glass-dark"
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <div className="py-1">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      href={dropdownItem.href}
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/20 hover:text-white"
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

      {/* Wallet connection button and EDU balance */}
      <div className="hidden md:flex items-center space-x-4">
        {connected && (
          <div className="text-sm text-gray-300">
            <span className="mr-1">EDU Balance:</span>
            <span className="font-bold text-purple-400">{eduBalance || '0'}</span>
          </div>
        )}
        
        {!connected ? (
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
              {formatAddress(account || '')}
            </Button>
          </div>
        )}
      </div>

      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="md:hidden text-white"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </Button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 glass-dark md:hidden z-50">
          <div className="px-4 py-3 space-y-4">
            {navItems.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="text-white font-medium">{item.label}</div>
                <div className="pl-4 space-y-2">
                  {item.dropdown.map((dropdownItem, dropdownIndex) => (
                    <Link
                      key={dropdownIndex}
                      href={dropdownItem.href}
                      className="block text-sm text-gray-300 hover:text-white"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {dropdownItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Mobile EDU balance */}
            {connected && (
              <div className="text-sm text-gray-300 pt-2">
                <span>EDU Balance:</span>
                <span className="font-bold text-purple-400 ml-2">{eduBalance || '0'}</span>
              </div>
            )}
            
            {/* Mobile wallet connection button */}
            <div className="pt-2">
              {!connected ? (
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={handleConnectWallet}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full text-white border-purple-500 hover:bg-purple-500/20">
                    {formatAddress(account || '')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
};

export default Navbar; 