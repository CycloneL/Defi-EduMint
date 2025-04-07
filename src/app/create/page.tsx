'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  PlusCircleIcon,
  VideoCameraIcon,
  DocumentIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  PlusIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { uploadToIPFS, uploadJSONToIPFS, getIPFSUrl } from '@/lib/ipfs';
import { parseEther, hexlify, toUtf8Bytes, ContractRunner } from 'ethers';
import tokenAbi from '../../contracts/CourseFactory.json';
import contractAddresses from '../../contracts/contract-addresses.json';
import { updateEduBalance } from '@/utils/balance-operations';


const provider = new ethers.JsonRpcProvider('https://rpc.open-campus-codex.gelato.digital');
const privateKey= process.env.NEXT_PUBLIC_PROXY_PRIVATE_KEY || '';
const wallet = new ethers.Wallet(privateKey, provider);
const signer = wallet.connect(provider);
const courseFactoryAddress=contractAddresses.courseFactory;
const courseFactoryContract=new ethers.Contract(courseFactoryAddress, tokenAbi.abi, signer) ;
const contracts = {
  courseFactory: courseFactoryContract
};



// Course categories
const courseCategories = [
  { id: 'blockchain', name: 'Blockchain Basics' },
  { id: 'smartcontract', name: 'Smart Contract Development' },
  { id: 'dapp', name: 'Decentralized Applications' },
  { id: 'defi', name: 'DeFi Protocols' },
  { id: 'nft', name: 'NFTs & Digital Art' },
  { id: 'dao', name: 'DAO & Governance' },
  { id: 'crypto', name: 'Cryptoeconomics' },
  { id: 'security', name: 'Blockchain Security' },
  { id: 'layer2', name: 'Scaling & Layer 2 Solutions' },
  { id: 'metaverse', name: 'Metaverse Technology' }
];

// Define file types interface
interface CourseFile {
  name: string;
  size: number;
  type: string;
}

// Add custom video file type
interface VideoFile {
  name: string;
  size: number;
  type: string;
  duration: number;
  description: string;
}

// Creator experience levels
const creatorLevels = [
  { id: 'beginner', name: 'Beginner', stakingAmount: '100' },
  { id: 'intermediate', name: 'Intermediate', stakingAmount: '200' },
  { id: 'advanced', name: 'Advanced', stakingAmount: '500' },
  { id: 'expert', name: 'Expert', stakingAmount: '1000' }
];

// Token icon interface
interface TokenIcon {
  file: File;
  preview: string;
}

export default function CreatePage() {
  const { walletAddress, isConnected } = useWeb3();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [coverImage, setCoverImage] = useState<CourseFile | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenIcon, setTokenIcon] = useState<TokenIcon | null>(null);
  const [creatorLevel, setCreatorLevel] = useState('beginner');
  const [stakingAmount, setStakingAmount] = useState(creatorLevels[0].stakingAmount);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const tokenIconInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-generate token name and symbol
  useEffect(() => {
    if (title) {
      // Generate token name
      setTokenName(`${title} Token`);
      
      // Generate token symbol (first letters of each word)
      const symbol = title
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
      
      setTokenSymbol(symbol.length > 5 ? symbol.substring(0, 5) : symbol);
    }
  }, [title]);
  
  // Update staking amount when creator level changes
  useEffect(() => {
    const selectedLevel = creatorLevels.find(level => level.id === creatorLevel);
    if (selectedLevel) {
      setStakingAmount(selectedLevel.stakingAmount);
    }
  }, [creatorLevel]);
  
  // Handle cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Save file object
      setCoverImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string || '');
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle video file selection
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setVideos([]);
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file type and size
    if (!file.type.includes('video')) {
      toast.error('Please upload a video file');
      return;
    }
    
    if (file.size > 500 * 1024 * 1024) { // 500MB
      toast.error('Video size must be less than 500MB');
      return;
    }
    
    // Create video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      
      // Add to video list
      setVideos([...videos, {
        name: file.name.split('.')[0],
        size: file.size,
        type: file.type,
        duration,
        description: ''
      }]);
    };
    
    video.src = URL.createObjectURL(file);
  };
  
  // Handle token icon upload
  const handleTokenIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type and size
      if (!file.type.includes('image')) {
        toast.error('Please upload an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        toast.error('Image size must be less than 2MB');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setTokenIcon({
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Create course
  const createCourse = async () => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    
    if (!title || !description || !category || !price || !duration) {
      toast.error('请填写所有必填字段');
      return;
    }
    
    if (videos.length === 0) {
      toast.error('请至少添加一个视频');
      return;
    }
    
    // 检查EDU余额是否足够
    const creationCost = "10"; // 创建课程需要10 EDU
    const currentBalance = localStorage.getItem('eduBalance');
    if (!currentBalance || parseFloat(currentBalance) < parseFloat(creationCost)) {
      toast.error(`创建课程需要${creationCost} EDU，您的余额不足`);
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Convert image to Base64 format for storage
      let finalImageUrl = coverImagePreview;
      
      // Use default category-based image if none uploaded
      if (!finalImageUrl) {
        finalImageUrl = `/images/courses/${category.toLowerCase()}.png`;
      }
      
      // 2. Simulate uploading course content to IPFS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 3. Create course on blockchain
      if (contracts && contracts.courseFactory && walletAddress) {
        console.log("开始创建课程，合约状态:", {
          courseFactoryAddress: contracts.courseFactory.target,
          signer: signer ? "已初始化" : "未初始化",
          account: walletAddress
        });
        
        // 检查合约和签名者状态
        if (!signer) {
          console.error("签名者未初始化");
          toast.error("钱包签名者未初始化，请重新连接钱包");
          setLoading(false);
          return;
        }
        
        try {
          // 直接使用 courseFactory 合约调用 createCourse 方法
          const coursePrice = parseEther(price);
          
          // 使用 @ts-ignore 忽略类型检查错误
          // @ts-ignore
          const tx = await contracts.courseFactory.createCourse(
            title,
            description,
            duration,
            category,
            coursePrice
          );
          
          console.log("课程创建交易已提交:", tx);
          toast.success("课程创建交易已提交!");
          
          // 等待交易确认
          //const receipt = 'wait' in tx ? await tx.wait() : tx;
          const receipt=await provider
          console.log("交易已确认:", receipt);
          
          // 扣减创建课程所需的EDU代币（教学演示，实际应在合约中处理）
          updateEduBalance(`-${creationCost}`, '创建课程');
          
          // 将新创建的课程代币信息保存到本地存储，以便其他页面可用
          try {
            // 创建代币ID (使用时间戳和随机数组合确保唯一性)
            const courseId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const courseSymbol = tokenSymbol || title.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
            
            // 创建代币对象
            const newCourseToken = {
              id: courseId,
              symbol: courseSymbol.length > 5 ? courseSymbol.substring(0, 5) : courseSymbol,
              name: title,
              price: price,
              change: '+0.0%', // 新代币初始涨跌幅
              description: description,
              image: finalImageUrl,
              supply: '1,000,000',
              holders: 1, // 创建者自己
              createdAt: new Date().toISOString(),
              courseId: courseId,
              category: category,
              instructor: walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Unknown',
              level: creatorLevel,
              duration: `${duration} hours`,
              students: 0,
              popularity: 'new' as any
            };
            
            // 交易数据对象
            const newToken = {
              id: courseId,
              symbol: courseSymbol.length > 5 ? courseSymbol.substring(0, 5) : courseSymbol,
              name: title,
              image: finalImageUrl,
              price: parseFloat(price),
              change: '+0.0%',
              volume: '0',
              balance: '1,000,000'
            };
            
            // 流动性池数据对象
            const newLiquidityToken = {
              id: parseInt(courseId.split('-')[0]),
              name: title,
              symbol: courseSymbol.length > 5 ? courseSymbol.substring(0, 5) : courseSymbol,
              price: parseFloat(price),
              change24h: 0,
              volume24h: 0,
              marketCap: 1000000 * parseFloat(price),
              totalSupply: 1000000,
              poolSize: 1000,
              myLiquidity: 1000,
              apr: 15,
              popularity: 'low' as 'high' | 'medium' | 'low',
              image: finalImageUrl
            };
            
            // 从本地存储中获取现有数据
            const courseTokensJson = localStorage.getItem('createdCourseTokens');
            const tradeTokensJson = localStorage.getItem('createdTradeTokens');
            const liquidityTokensJson = localStorage.getItem('createdLiquidityTokens');
            
            // 解析现有数据或创建新数组
            const courseTokens = courseTokensJson ? JSON.parse(courseTokensJson) : [];
            const tradeTokens = tradeTokensJson ? JSON.parse(tradeTokensJson) : [];
            const liquidityTokens = liquidityTokensJson ? JSON.parse(liquidityTokensJson) : [];
            
            // 添加新数据
            courseTokens.push(newCourseToken);
            tradeTokens.push(newToken);
            liquidityTokens.push(newLiquidityToken);
            
            // 保存回本地存储
            localStorage.setItem('createdCourseTokens', JSON.stringify(courseTokens));
            localStorage.setItem('createdTradeTokens', JSON.stringify(tradeTokens));
            localStorage.setItem('createdLiquidityTokens', JSON.stringify(liquidityTokens));
            
            console.log("课程代币信息已保存到本地存储:", newCourseToken);
          } catch (storageError) {
            console.error("保存课程代币信息到本地存储失败:", storageError);
            // 不影响主流程，只记录错误
          }
          
          // 3. Update state
          toast.success("课程创建成功!");
          setLoading(false);
          
          // Clear form fields
          setTitle('');
          setDescription('');
          setPrice('');
          setCategory('');
          setCreatorLevel('beginner');
          setCoverImage(null);
          setDuration('1');
          setTokenIcon(null);
          setVideos([]);
          
          // Redirect to course page (in a real app)
          router.push('/dashboard');
        } catch (contractError: any) {
          console.error("合约调用错误:", contractError);
          toast.error(`合约调用失败: ${contractError.message || '未知错误'}`);
          setLoading(false);
        }
      } else {
        console.error("合约或钱包状态错误:", { 
          contracts: !!contracts, 
          courseFactory: !!contracts?.courseFactory, 
          account: !!walletAddress 
        });
        toast.error("合约未初始化或钱包未连接");
        setLoading(false);
      }
      
    } catch (error: any) {
      console.error('创建课程失败:', error);
      toast.error(`创建失败: ${error.message || '未知错误'}`);
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-12 px-4">
        <h1 className="text-4xl font-bold mb-8 gradient-text">
          Create Web3 Course
        </h1>
        
        {!isConnected ? (
          <div className="glass rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium mb-4">Please connect your wallet first</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to create courses and earn rewards</p>
          </div>
        ) : (
          <div className="glass rounded-xl overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-gray-700">
              <button
                className={`px-6 py-4 text-center transition-colors ${
                  activeTab === 'basic' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`px-6 py-4 text-center transition-colors ${
                  activeTab === 'content' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('content')}
              >
                Course Content
              </button>
              <button
                className={`px-6 py-4 text-center transition-colors ${
                  activeTab === 'materials' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('materials')}
              >
                Learning Materials
              </button>
              <button
                className={`px-6 py-4 text-center transition-colors ${
                  activeTab === 'review' ? 'bg-indigo-600 text-white' : 'hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('review')}
              >
                Review & Publish
              </button>
            </div>
            
            <div className="p-6">
              {/* Basic Info */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Course Title</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter course title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Course Description</label>
                    <textarea
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-32"
                      placeholder="Enter course description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {courseCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Course Price (ETH)</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          min="0"
                          step="0.0001"
                        />
                        <div className="absolute right-4 top-2.5 text-gray-400">ETH</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Course Duration (days)</label>
                      <input
                        type="number"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Course Cover</label>
                    <div className="mt-2 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center ${
                          coverImagePreview ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-700'
                        }`}
                        style={{ width: '200px', height: '150px' }}
                      >
                        {coverImagePreview ? (
                          <img
                            src={coverImagePreview}
                            alt="Course Cover Preview"
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <>
                            <PlusCircleIcon className="h-10 w-10 text-gray-500 mb-2" />
                            <span className="text-sm text-gray-500">Upload Cover Image</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleCoverImageUpload}
                        />
                      </div>
                      
                      <div>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {coverImagePreview ? 'Change Image' : 'Upload Image'}
                        </button>
                        {coverImagePreview && (
                          <p className="text-sm text-gray-400 mt-2">
                            {coverImage?.name} ({coverImage ? Math.round(coverImage.size / 1024) : 0} KB)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                      onClick={() => setActiveTab('content')}
                    >
                      Next: Add Course Content
                    </button>
                  </div>
                </div>
              )}
              
              {/* Course Content */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Course Videos</h3>
                    
                    {/* Current added videos */}
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Video File</label>
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                              onClick={() => videoInputRef.current?.click()}
                            >
                              <span className="flex items-center">
                                <VideoCameraIcon className="h-5 w-5 mr-1" />
                                Select Video File
                              </span>
                            </button>
                            <input
                              type="file"
                              className="hidden"
                              ref={videoInputRef}
                              accept="video/*"
                              onChange={handleVideoChange}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Video Title</label>
                          <input
                            type="text"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter video title"
                            value={videos[0]?.name || ''}
                            onChange={(e) => {
                              const updatedVideos = [...videos];
                              updatedVideos[0] = {
                                ...updatedVideos[0],
                                name: e.target.value
                              };
                              setVideos(updatedVideos);
                            }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1">Video Description</label>
                          <input
                            type="text"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter video description"
                            value={videos[0]?.description || ''}
                            onChange={(e) => {
                              const updatedVideos = [...videos];
                              updatedVideos[0] = {
                                ...updatedVideos[0],
                                description: e.target.value
                              };
                              setVideos(updatedVideos);
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => {
                              const updatedVideos = [...videos];
                              updatedVideos.pop();
                              setVideos(updatedVideos);
                            }}
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Video list */}
                    <div className="space-y-3">
                      {videos.length === 0 ? (
                        <p className="text-center text-gray-500 py-6">No course videos yet. Please add at least one video.</p>
                      ) : (
                        videos.map((video, index) => (
                          <div key={index} className="glass rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="bg-indigo-900/30 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                                  <VideoCameraIcon className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{video.name}</h4>
                                  <p className="text-sm text-gray-400">{video.description}</p>
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <span className="flex items-center mr-3">
                                      <ClockIcon className="h-3 w-3 mr-1" />
                                      {video.duration}
                                    </span>
                                    <span>
                                      {Math.round(video.size / 1024 / 1024)} MB
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="text-gray-500 hover:text-red-400"
                                onClick={() => {
                                  const updatedVideos = [...videos];
                                  updatedVideos.splice(index, 1);
                                  setVideos(updatedVideos);
                                }}
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg text-gray-300"
                      onClick={() => setActiveTab('basic')}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                      onClick={() => setActiveTab('materials')}
                    >
                      Next: Add Learning Materials
                    </button>
                  </div>
                </div>
              )}
              
              {/* Learning Materials */}
              {activeTab === 'materials' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Learning Materials (Optional)</h3>
                    
                    <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
                          onClick={() => {
                            // Implementation for adding learning material
                          }}
                        >
                          <span className="flex items-center">
                            <DocumentIcon className="h-5 w-5 mr-1" />
                            Add Learning Material
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Materials list */}
                  <div className="space-y-3">
                    {/* Implementation for displaying learning materials */}
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg text-gray-300"
                      onClick={() => setActiveTab('content')}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white"
                      onClick={() => setActiveTab('review')}
                    >
                      Next: Review & Publish
                    </button>
                  </div>
                </div>
              )}
              
              {/* Review & Publish */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium mb-4">Course Preview</h3>
                  
                  <div className="glass rounded-lg p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Course Cover */}
                      <div className="md:w-1/3">
                        {coverImagePreview ? (
                          <img
                            src={coverImagePreview}
                            alt="Course Cover"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500">No cover image</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Course Info */}
                      <div className="md:w-2/3">
                        <h2 className="text-2xl font-bold mb-2">{title || 'Course Title'}</h2>
                        <p className="text-gray-400 mb-4">{description || 'Course Description'}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center">
                            <TagIcon className="h-5 w-5 text-indigo-400 mr-2" />
                            <span>
                              {courseCategories.find(cat => cat.id === category)?.name || 'Category not selected'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-indigo-400 mr-2" />
                            <span>{duration ? `${duration} days course` : 'Duration not set'}</span>
                          </div>
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-indigo-400 mr-2" />
                            <span>{price ? `${price} ETH` : 'Price not set'}</span>
                          </div>
                          <div className="flex items-center">
                            <VideoCameraIcon className="h-5 w-5 text-indigo-400 mr-2" />
                            <span>{videos.length} videos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video list */}
                  <div>
                    <h4 className="font-medium mb-3">Course Content</h4>
                    <div className="glass rounded-lg p-4">
                      {videos.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">Course content is empty. Please add at least one video.</p>
                      ) : (
                        <div className="space-y-2">
                          {videos.map((video, index) => (
                            <div key={index} className="flex items-center py-2 border-b border-gray-700 last:border-0">
                              <div className="w-8 h-8 bg-indigo-900/30 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm">{index + 1}</span>
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium">{video.name}</h5>
                                <p className="text-sm text-gray-400">{video.description}</p>
                              </div>
                              <div className="text-sm text-gray-500">{video.duration}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Learning Materials */}
                  <div>
                    <h4 className="font-medium mb-3">Learning Materials</h4>
                    <div className="glass rounded-lg p-4">
                      {/* Implementation for displaying learning materials */}
                    </div>
                  </div>
                  
                  {/* Publish confirmation */}
                  <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-indigo-400" />
                      Ready to Publish
                    </h4>
                    <p className="text-sm text-gray-300 mb-2">
                      Publishing your course will create a course NFT and corresponding course token for students to stake and trade. Please verify all course information is correct.
                    </p>
                    <p className="text-xs text-gray-400">
                      Note: Creating a course requires a small gas fee. Please ensure you have enough ETH in your wallet.
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-lg p-3 text-sm">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-900/20 border border-green-800 text-green-400 rounded-lg p-3 text-sm">
                      Course created successfully! Your course NFT and token have been generated.
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-700 hover:bg-gray-800 rounded-lg text-gray-300"
                      onClick={() => setActiveTab('materials')}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className={`px-6 py-2 rounded-lg text-white font-medium ${
                        loading
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                      }`}
                      onClick={createCourse}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Publish Course'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 