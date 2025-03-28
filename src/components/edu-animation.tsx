"use client"

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const EduAnimation = () => {
  return (
    <div className="absolute right-10 bottom-1/3 md:bottom-1/4 z-10 pointer-events-none">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-15, 15, -15] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        {/* Background glow effect */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -inset-6 rounded-full bg-purple-500/20 blur-xl z-0"
        />
        
        {/* EDU Token */}
        <Image
          src="https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png"
          alt="EDU Token"
          width={100}
          height={100}
          className="relative z-10"
        />
      </motion.div>
    </div>
  );
};

export default EduAnimation; 