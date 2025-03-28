'use client';

import React, { useState } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
// 移除Navbar导入，因为它已经在layout.tsx中引入
// import Navbar from '@/components/Navbar';
import { CreditCardIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function BuyPage() {
  // 状态和函数...

  return (
    <div className="min-h-screen">
      {/* 移除重复的Navbar组件 */}
      {/* <Navbar /> */}
      
      <div className="container mx-auto pt-24 pb-12 px-4">
        {/* 页面内容... */}
      </div>
    </div>
  );
}

// 其他组件... 