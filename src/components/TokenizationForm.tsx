'use client';

import React from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

interface TokenIcon {
  file: File;
  preview: string;
}

interface TokenizationFormProps {
  tokenName: string;
  setTokenName: (name: string) => void;
  tokenSymbol: string;
  setTokenSymbol: (symbol: string) => void;
  tokenIcon: TokenIcon | null;
  handleTokenIconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tokenIconInputRef: React.RefObject<HTMLInputElement>;
}

export default function TokenizationForm({
  tokenName,
  setTokenName,
  tokenSymbol,
  setTokenSymbol,
  tokenIcon,
  handleTokenIconUpload,
  tokenIconInputRef
}: TokenizationFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Course Token Details</h3>
        <p className="text-gray-400 mb-6">
          Your course will be tokenized, allowing students to earn and trade tokens 
          as they complete the course. Configure your token details below.
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Token Name</label>
        <input
          type="text"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. Blockchain Basics Token"
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          The full name of your course token
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Token Symbol</label>
        <input
          type="text"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="e.g. BBT"
          value={tokenSymbol}
          onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
          maxLength={5}
        />
        <p className="text-xs text-gray-500 mt-1">
          A short symbol for your token (max 5 characters)
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Token Icon</label>
        <div className="mt-2 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
          <div
            className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center ${
              tokenIcon ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-700'
            }`}
            style={{ width: '120px', height: '120px' }}
            onClick={() => tokenIconInputRef.current?.click()}
          >
            {tokenIcon ? (
              <img
                src={tokenIcon.preview}
                alt="Token Icon Preview"
                className="max-w-full max-h-full rounded-full"
              />
            ) : (
              <>
                <PlusCircleIcon className="h-10 w-10 text-gray-500 mb-2" />
                <span className="text-sm text-gray-500">Upload Icon</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              ref={tokenIconInputRef}
              accept="image/*"
              onChange={handleTokenIconUpload}
            />
          </div>
          
          <div>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => tokenIconInputRef.current?.click()}
            >
              {tokenIcon ? 'Change Icon' : 'Upload Icon'}
            </button>
            {tokenIcon && (
              <p className="text-sm text-gray-400 mt-2">
                {tokenIcon.file.name} ({Math.round(tokenIcon.file.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Upload a square image that will represent your token in wallets and marketplaces
        </p>
      </div>
      
      <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4 mt-6">
        <h4 className="font-medium mb-2">Token Benefits</h4>
        <ul className="text-sm space-y-2">
          <li className="flex items-start">
            <span className="text-indigo-400 mr-2">•</span>
            <span>Students can earn tokens by completing course modules</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-400 mr-2">•</span>
            <span>Tokens can be traded on the platform marketplace</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-400 mr-2">•</span>
            <span>Course creators earn royalties from token trades</span>
          </li>
          <li className="flex items-start">
            <span className="text-indigo-400 mr-2">•</span>
            <span>Token holders get access to exclusive content and community features</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 