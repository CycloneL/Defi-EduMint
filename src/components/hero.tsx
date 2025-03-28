"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import FloatingTokens from './floating-tokens';
import EduAnimation from './edu-animation';

// Define typing text options
const typingTexts = [
  "Learn blockchain development",
  "Trade course tokens",
  "Earn while you learn",
  "Create educational content",
  "Build your Web3 future"
];

interface HeroProps {
  scrollToContent: () => void;
}

const Hero: React.FC<HeroProps> = ({ scrollToContent }) => {
  const [typingIndex, setTypingIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Typing effect
  useEffect(() => {
    const text = typingTexts[typingIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayText(text.substring(0, displayText.length + 1));
        
        if (displayText.length === text.length) {
          // Pause at the end before deleting
          setTypingSpeed(1500);
          setIsDeleting(true);
        } else {
          // Normal typing speed
          setTypingSpeed(50 + Math.random() * 50);
        }
      } else {
        setDisplayText(text.substring(0, displayText.length - 1));
        
        if (displayText.length === 0) {
          setIsDeleting(false);
          setTypingIndex((typingIndex + 1) % typingTexts.length);
          // Pause before typing the next word
          setTypingSpeed(500);
        } else {
          // Deleting speed
          setTypingSpeed(30);
        }
      }
    }, typingSpeed);
    
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, typingIndex, typingSpeed]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* Background Effects */}
      <FloatingTokens count={14} />
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center pt-20 pb-32">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
        >
          <span className="block">The Future of Education in</span>
          <span className="gradient-text">Web3 Space</span>
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-14 md:h-16 flex items-center justify-center mb-8 text-xl md:text-2xl text-gray-300"
        >
          <span className="typing-animation inline-block px-1">{displayText}</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Link href="/learn" className="btn-primary text-lg px-8 py-6 text-center">
            Explore Courses
          </Link>
          <Link href="/trade" className="btn-secondary text-lg px-8 py-6 text-center">
            Start Trading
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          onClick={scrollToContent}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer hover:text-purple-400 transition-colors"
        >
          <div className="flex flex-col items-center">
            <span className="text-sm mb-2">Learn More</span>
            <ChevronDown className="animate-bounce" />
          </div>
        </motion.div>
      </div>
      
      {/* Edu Token Animation */}
      <EduAnimation />
    </section>
  );
};

export default Hero; 