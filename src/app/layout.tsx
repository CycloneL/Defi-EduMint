import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Web3Provider } from '@/context/Web3Context'
import { Toaster } from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import { SparklesCore } from '@/components/sparkles'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduMint | Learn & Invest in Education',
  description: 'EduMint combines DeFi with education to create a revolutionary educational financial ecosystem',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
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
      </body>
    </html>
  )
}
