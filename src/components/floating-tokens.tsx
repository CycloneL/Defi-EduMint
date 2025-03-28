"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

// 课程代币数组，使用教育课程相关的缩写
const courseTokens = [
  { symbol: 'SF', color: '#F7931A' },     // Solidity Foundation
  { symbol: 'RC', color: '#627EEA' },     // React Course
  { symbol: 'JS+', color: '#F0DB4F' },    // JavaScript Advanced
  { symbol: 'PyF', color: '#3776AB' },    // Python Fundamentals
  { symbol: 'DeFi', color: '#FFB65C' },   // DeFi Principles
  { symbol: 'DAO', color: '#2775CA' },    // DAO Governance
  { symbol: 'Rclass', color: '#DE5C41' }, // Rust Class
  { symbol: 'WebDev', color: '#654FF0' }, // Web Development
  { symbol: 'ZKP', color: '#9E2FBA' },    // Zero-Knowledge Proofs
  { symbol: 'BC101', color: '#65C2CB' },  // Blockchain 101
  { symbol: 'W3D', color: '#FF6B4A' },    // Web3 Development
  { symbol: 'SC', color: '#29B6AF' },     // Smart Contracts
  { symbol: 'NodeJS', color: '#3B82F6' }, // Node.js Development
  { symbol: 'Crypto', color: '#06B6D4' }, // Cryptography
  { symbol: 'EVM', color: '#8B5CF6' },    // EVM Architecture
  { symbol: 'ML', color: '#34D399' },     // Machine Learning
  { symbol: 'DAPP', color: '#F43F5E' },   // Decentralized Applications
  { symbol: 'AI', color: '#EC4899' },     // AI for Blockchain
]

interface FloatingTokensProps {
  count?: number
}

const FloatingTokens: React.FC<FloatingTokensProps> = ({ count = 14 }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [tokens, setTokens] = useState<{ 
    token: typeof courseTokens[0], 
    positions: number[], 
    speed: number,
    amplitude: number,
    rotationRange: number, 
    delay: number,
    opacity: number[]
  }[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side after first render to prevent hydration mismatch
    setIsClient(true)

    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // 确保代币不会出现在页面最下方的社交媒体图标区域
    const footerHeight = 200; // 估计的页脚高度
    const usableHeight = window.innerHeight - footerHeight;

    // 重新初始化代币参数，增加更多随机元素和动态性
    const initialTokens = Array.from({ length: count }).map((_, index) => {
      // 随机选择代币类型
      const tokenIndex = Math.floor(Math.random() * courseTokens.length);
      
      // 更多速度差异，范围从40-60秒
      const speed = 40 + Math.floor(Math.random() * 20);
      
      // 随机振幅，较小的振幅让动画更自然
      const amplitude = 0.03 + (Math.random() * 0.08);
      
      // 随机旋转范围
      const rotationRange = 5 + Math.floor(Math.random() * 10);
      
      // 随机延迟启动动画
      const delay = Math.random() * 5;
      
      // 随机透明度变化范围
      const opacity = [
        0.5 + Math.random() * 0.3, 
        0.7 + Math.random() * 0.3, 
        0.5 + Math.random() * 0.3
      ];
      
      // 随机初始位置，但避开页面底部
      const xPos = Math.floor(Math.random() * (window.innerWidth * 0.8)) + (window.innerWidth * 0.1);
      const yPos = Math.floor(Math.random() * (usableHeight * 0.8) + 100);
      
      return {
        token: courseTokens[tokenIndex],
        positions: [xPos, yPos], 
        speed,
        amplitude,
        rotationRange,
        delay,
        opacity
      }
    })
    
    setTokens(initialTokens)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [count])

  // Only render the tokens on the client side to avoid hydration errors
  if (!isClient) {
    return null
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {tokens.map((item, index) => (
        <motion.div
          key={index}
          className="absolute"
          initial={{
            x: item.positions[0],
            y: item.positions[1],
            opacity: 0,
            rotate: 0
          }}
          animate={{
            x: [
              item.positions[0], 
              item.positions[0] + Math.floor(dimensions.width * item.amplitude * Math.sin(index)), 
              item.positions[0] - Math.floor(dimensions.width * item.amplitude * Math.cos(index * 1.3)),
              item.positions[0] + Math.floor(dimensions.width * item.amplitude * Math.sin(index * 0.7)),
              item.positions[0]
            ],
            y: [
              item.positions[1], 
              item.positions[1] - Math.floor(dimensions.height * item.amplitude * Math.sin(index * 1.2)), 
              item.positions[1] + Math.floor(dimensions.height * item.amplitude * Math.cos(index * 0.8)),
              item.positions[1] - Math.floor(dimensions.height * item.amplitude * 0.5),
              item.positions[1]
            ],
            rotate: [
              0, 
              index % 2 === 0 ? item.rotationRange : -item.rotationRange, 
              index % 3 === 0 ? -item.rotationRange/2 : item.rotationRange/2,
              index % 2 === 0 ? -item.rotationRange : item.rotationRange,
              0
            ],
            opacity: [
              item.opacity[0], 
              item.opacity[1], 
              item.opacity[2],
              item.opacity[1],
              item.opacity[0]
            ],
          }}
          transition={{
            duration: item.speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: item.delay,
            times: [0, 0.25, 0.5, 0.75, 1]
          }}
        >
          <div 
            className="flex items-center justify-center w-14 h-14 rounded-full bg-opacity-10 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
            style={{ 
              backgroundColor: `${item.token.color}20`,
              border: `1px solid ${item.token.color}40`
            }}
          >
            <span 
              className="text-sm font-bold"
              style={{ color: item.token.color }}
            >
              {item.token.symbol}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default FloatingTokens 