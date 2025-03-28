'use client';

import React, { useRef } from 'react';
import Hero from "@/components/hero";
import { IntroSection, StatsSection,  Footer } from '@/components/home-sections';

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen">      
      <Hero scrollToContent={scrollToContent} />
      
      {/* Content below the fold */}
      <div ref={contentRef}>
        <IntroSection />
        <StatsSection />
        
        <Footer />
      </div>
    </main>
  );
}
