'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, StarIcon, BookOpenIcon, UsersIcon, PlayIcon, LockClosedIcon, ArrowTopRightOnSquareIcon, LockOpenIcon, ChevronLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ethers, Contract } from 'ethers';
import Image from 'next/image';
import Link from 'next/link';
import proxySigner from '@/utils/proxy-signer';
import contractAddresses from '../../contracts/contract-addresses.json';
import learningManagerABI from '../../contracts/LearningManager.json';

// 更新分类与Web3分类保持一致
const categories = [
  { id: 'blockchain', name: 'Blockchain Fundamentals' },
  { id: 'smartcontract', name: 'Smart Contract Development' },
  { id: 'dapp', name: 'DApp Development' },
  { id: 'defi', name: 'DeFi Principles' },
  { id: 'nft', name: 'NFT Creation' },
  { id: 'dao', name: 'DAO and Governance' },
  { id: 'crypto', name: 'Cryptography and Economics' },
  { id: 'security', name: 'Blockchain Security' },
  { id: 'layer2', name: 'Layer 2 Solutions' },
  { id: 'metaverse', name: 'Metaverse Technologies' }
];

// 定义课程类型
interface Course {
  id: string;
  title: string;
  symbol: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  students: number;
  price: string;
  rating: number | string;
  image: string;
  isPurchased: boolean;
  progress: number;
  createdAt?: string;
  videos?: CourseVideo[];
}

// 定义视频类型
interface CourseVideo {
  id?: string; // 可选ID
  name: string;
  title?: string; // 添加title属性，兼容现有代码
  description: string;
  duration: string;
  locked?: boolean;
  file?: File;
}

// 定义CourseCard的属性类型
interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  onPurchase: (courseId: string) => void;
  purchasing: boolean;
  purchaseSuccess: boolean;
}

// 修改 Course 接口
interface Course {
  id: string;
  title: string;
  symbol: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  students: number;
  price: string;
  rating: number | string;
  image: string;
  isPurchased: boolean;
  progress: number;
  createdAt?: string;
  videos?: CourseVideo[];
}

// 修改 CourseCardProps 接口
interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
  onPurchase: (courseId: string) => void;
  purchasing: boolean;
  purchaseSuccess: boolean;
}

// 更新模拟课程数据，使用不同的图片和正确的价格格式
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Blockchain Fundamentals',
    symbol: 'BLK',
    description: 'An introduction to blockchain technology and its applications in the modern world.',
    category: 'blockchain',
    level: 'Beginner',
    duration: '4 weeks',
    instructor: '0x1234...5678',
    students: 125,
    price: '4 BLK',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isPurchased: false,
    progress: 0,
    videos: [
      {
        id: 'v1',
        name: 'Introduction to Blockchain',
        description: 'Understanding the basics of blockchain technology',
        duration: '25:30',
        locked: true
      },
      {
        id: 'v2',
        name: 'Cryptography Basics',
        description: 'Learn the cryptographic principles behind blockchain',
        duration: '18:45',
        locked: true
      },
      {
        id: 'v3',
        name: 'Consensus Mechanisms',
        description: 'Explore different consensus algorithms',
        duration: '22:10',
        locked: true
      }
    ]
  },
  {
    id: '2',
    title: 'Smart Contract Development',
    symbol: 'SCD',
    description: 'Learn how to develop and deploy smart contracts on Ethereum using Solidity.',
    category: 'development',
    level: 'Intermediate',
    duration: '6 weeks',
    instructor: '0xabcd...ef12',
    students: 89,
    price: '6 SCD',
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1659606236737-de86dc9d9e67?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isPurchased: false,
    progress: 0,
    videos: [
      {
        id: 'v1',
        name: 'Introduction to Solidity',
        description: 'Learn the basics of Solidity programming language',
        duration: '30:15',
        locked: true
      },
      {
        id: 'v2',
        name: 'Your First Smart Contract',
        description: 'Building a simple smart contract',
        duration: '28:40',
        locked: true
      },
      {
        id: 'v3',
        name: 'Testing and Deployment',
        description: 'How to test and deploy your smart contracts',
        duration: '35:20',
        locked: true
      }
    ]
  },
  {
    id: '3',
    title: 'DeFi Principles',
    symbol: 'DEFI',
    description: 'Explore the world of Decentralized Finance and understand its key components.',
    category: 'defi',
    level: 'Advanced',
    duration: '8 weeks',
    instructor: '0x7890...1234',
    students: 67,
    price: '8 DEFI',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    isPurchased: false,
    progress: 0,
    videos: [
      {
        id: 'v1',
        name: 'DeFi Ecosystem Overview',
        description: 'Understanding the DeFi landscape',
        duration: '40:10',
        locked: true
      },
      {
        id: 'v2',
        name: 'Lending and Borrowing Protocols',
        description: 'Deep dive into lending and borrowing in DeFi',
        duration: '35:25',
        locked: true
      },
      {
        id: 'v3',
        name: 'Yield Farming Strategies',
        description: 'Advanced techniques for yield optimization',
        duration: '42:30',
        locked: true
      }
    ]
  }
];

// 添加模拟视频URL数组 - 使用实际可访问的公共示例视频
const demoVideoUrls = [
  'https://assets.codepen.io/6093409/river.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', 
  'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
  'https://samplelib.com/lib/preview/mp4/sample-20s.mp4'
];

// 添加模拟视频封面和Web3相关标题
const demoVideoTitles = [
  '以太坊基础架构详解',
  'Solidity智能合约开发入门',
  'DeFi协议分析与实现',
  'NFT市场趋势与创作',
  'Web3钱包集成教程'
];

// 添加模拟视频描述
const demoVideoDescriptions = [
  '了解以太坊区块链的核心概念、架构和工作原理，包括共识机制、账户模型和交易处理流程。',
  '从零开始学习Solidity语言，掌握智能合约开发的基础知识，包括数据类型、函数和安全实践。',
  '深入分析主流DeFi协议的设计原理和实现细节，学习如何构建自己的去中心化金融应用。',
  '探索NFT创作流程、定价策略和市场营销，了解如何将你的数字作品转化为有价值的NFT资产。',
  '学习如何将Web3钱包集成到你的应用中，实现用户身份验证、交易签名和资产管理等功能。'
];

// 添加模拟视频封面
const demoVideoThumbs = [
  '/images/courses/blockchain.png',
  '/images/courses/smartcontract.png',
  '/images/courses/defi.png',
  '/images/courses/nft.png',
  '/images/courses/dapp.png'
];

// 课程卡片组件 - 更新风格
const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect, onPurchase, purchasing, purchaseSuccess }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-xl overflow-hidden hover:shadow-md hover:shadow-purple-500/20 transition-all cursor-pointer"
      onClick={() => onSelect(course)}
    >
      <div className="relative h-48">
        {course.image ? (
          <Image
            src={course.image}
            alt={course.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">{course.title.substring(0, 2)}</span>
          </div>
        )}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 to-transparent">
          <div className="absolute bottom-4 left-4">
            <span className="px-2 py-1 bg-purple-600/80 text-white text-xs rounded-full">
              {course.category}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{course.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium">{course.rating}</span>
            <span className="text-xs text-gray-500 ml-1">({course.students})</span>
          </div>
          <div className="text-purple-400 font-semibold">{course.price}</div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mb-4">
          <div className="flex items-center">
            <BookOpenIcon className="h-3 w-3 mr-1" />
            <span>{course.level}</span>
          </div>
          <div>{course.duration}</div>
        </div>
        
        <button
          className={`w-full py-2 rounded-lg font-medium ${
            course.isPurchased
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            onPurchase(course.id);
          }}
          disabled={purchasing}
        >
          {purchasing ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              <span>Processing...</span>
            </div>
          ) : purchaseSuccess ? (
            "Purchase Successful"
          ) : course.isPurchased ? (
            "Continue Learning"
          ) : (
            "Purchase Access"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default function LearnPage() {
  const { isConnected, walletAddress, contracts, signer, provider, proxyEnabled } = useWeb3();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);
  
  // Fetch courses
  useEffect(() => {
    const loadCourses = async () => {
      // Start with a copy of mock courses and add prefix to ensure unique IDs
      let allCourses = mockCourses.map(course => ({
        ...course,
        id: `mock-${course.id}` // 添加前缀确保模拟课程ID唯一
      }));
      
      try {
        // Check for purchased courses in local storage
        const purchasedCoursesString = localStorage.getItem('purchasedCourses');
        let purchasedCourses: string[] = [];
        
        if (purchasedCoursesString) {
          try {
            purchasedCourses = JSON.parse(purchasedCoursesString);
          } catch (e) {
            console.error('Error parsing purchased courses:', e);
          }
        }
        
        // If contracts are available, fetch courses from blockchain
        if (contracts && contracts.courseFactory) {
          try {
            console.log("Attempting to fetch courses from blockchain");
            
            // Get some courses from the blockchain - we'll use a simpler approach to avoid type errors
            const blockchainCourses: Course[] = [];
            
            // Try to fetch a limited number of courses (10) starting from ID 1
            // This avoids the need to know the total count
            for (let i = 1; i <= 10; i++) {
              try {
                // Check if this courseFactory instance has getCourse method
                if (typeof contracts.courseFactory.getCourse !== 'function') {
                  console.warn("getCourse method not found on courseFactory contract");
                  break;
                }
                
                // Try to get the course - this will throw if course doesn't exist
                const courseData = await contracts.courseFactory.getCourse(i.toString());
                
                // Skip if we didn't get valid course data
                if (!courseData || !courseData.title) {
                  console.log(`No valid data for course ${i}`);
                  continue;
                }
                
                // Check if the course is active (if that field exists)
                if (courseData.isActive === false) {
                  console.log(`Course ${i} is not active, skipping`);
                  continue;
                }
                
                console.log(`Successfully fetched course ${i}: ${courseData.title}`);
                
                // Format price
                let priceFormatted = '0';
                if (courseData.price) {
                  try {
                    const priceStr = courseData.price.toString();
                    const priceValue = priceStr; // 保留为string类型
                    priceFormatted = (Number(priceValue) / 1e18).toFixed(2);
                  } catch (e) {
                    console.error(`Error formatting price for course ${i}:`, e);
                  }
                }
                
                // Format creator address
                const creator = courseData.creator || '';
                const formattedCreator = creator.length > 10 
                  ? `${creator.substring(0, 6)}...${creator.substring(creator.length - 4)}`
                  : creator;
                
                // Get duration
                let durationString = '4 weeks';
                try {
                  if (courseData.duration) {
                    const durationHours = parseInt(courseData.duration.toString());
                    const durationWeeks = Math.max(1, Math.ceil(durationHours / 40));
                    durationString = `${durationWeeks} week${durationWeeks !== 1 ? 's' : ''}`;
                  }
                } catch (e) {
                  console.error(`Error formatting duration for course ${i}:`, e);
                }
                
                // Create default course videos
                const courseVideos: CourseVideo[] = [];
                for (let j = 0; j < 3; j++) {
                  courseVideos.push({
                    id: `bc-${i}-${j}`, // 添加前缀确保视频ID唯一
                    name: `Module ${j + 1}`,
                    description: 'Blockchain course content',
                    duration: `${Math.floor(Math.random() * 30) + 10}:00`,
                    locked: true
                  });
                }
                
                // Create course object with blockchain prefix for ID
                const courseObj: Course = {
                  id: `bc-${i}`, // 为区块链课程添加前缀，确保ID唯一
                  title: courseData.title || 'Unnamed Course',
                  symbol: `CT${i}`,
                  description: courseData.description || 'No description available',
                  category: 'blockchain',
                  level: 'Beginner',
                  duration: durationString,
                  instructor: formattedCreator,
                  students: 0, // We might not be able to get this easily
                  price: `${priceFormatted} EDU`,
                  rating: (Math.random() * 2 + 3).toFixed(1), // Random rating between 3.0-5.0
                  image: `https://source.unsplash.com/random/400x300?blockchain=${i}`,
                  isPurchased: purchasedCourses.includes(`bc-${i}`), // 更新购买状态的检查方式
                  progress: 0,
                  videos: courseVideos
                };
                
                blockchainCourses.push(courseObj);
              } catch (error) {
                console.error(`Error fetching course ${i}:`, error);
                // If we get an error, it might be because we've reached the end of courses
                if (i > 1) break;
              }
            }
            
            // If we have blockchain courses, add them to our course list
            if (blockchainCourses.length > 0) {
              console.log(`Successfully loaded ${blockchainCourses.length} courses from blockchain`);
              // 区块链课程和模拟课程合并，现在它们都有唯一的ID前缀
              allCourses = [...blockchainCourses, ...allCourses];
              console.log("Combined courses:", allCourses.map(c => c.id));
            } else {
              console.log("No courses found on blockchain, using mock data only");
            }
          } catch (error) {
            console.error("Error in blockchain course fetching process:", error);
          }
        } else {
          console.log("Course contract not available, using mock data only");
        }
        
        // Update purchased status for courses - 更新检查逻辑以适应新的ID格式
        allCourses = allCourses.map(course => {
          // 处理旧格式的purchasedCourses，将课程ID提取出来进行比较
          const courseIdWithoutPrefix = course.id.includes('-') 
            ? course.id.split('-')[1] 
            : course.id;
            
          return {
            ...course,
            isPurchased: purchasedCourses.includes(course.id) || 
                         purchasedCourses.includes(courseIdWithoutPrefix)
          };
        });
        
        setCourses(allCourses);
        setFilteredCourses(allCourses);
      } catch (error) {
        console.error('Error loading courses:', error);
        toast.error('Failed to load courses');
        
        // Fall back to mock data with purchased status and unique IDs
        const coursesWithPurchaseStatus = mockCourses.map(course => {
          const purchasedCoursesString = localStorage.getItem('purchasedCourses');
          let purchasedCourses: string[] = [];
          
          if (purchasedCoursesString) {
            try {
              purchasedCourses = JSON.parse(purchasedCoursesString);
            } catch (e) {
              console.error('Error parsing purchased courses:', e);
            }
          }
          
          return {
            ...course,
            id: `mock-${course.id}`, // 确保ID唯一
            isPurchased: purchasedCourses.includes(course.id)
          };
        });
        
        setCourses(coursesWithPurchaseStatus);
        setFilteredCourses(coursesWithPurchaseStatus);
      }
    };
    
    loadCourses();
  }, [contracts]);
  
  // Handle purchasing a course
  const handlePurchase = async (courseId: string) => {
    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    // If already purchased, navigate to course content
    if (course.isPurchased) {
      setActiveCourse(course);
      return;
    }
    
    try {
      setPurchasing(true);
      setPurchaseError(null);
      
      // 如果合约可用，尝试区块链交易
      if (contracts && contracts.learningManager && walletAddress) {
        console.log("尝试通过区块链购买课程:", courseId);
        
        try {
          // Parse courseId to get actual blockchain course ID
          // (strip prefix if exists)
          const blockchainCourseId = courseId.includes('-') 
            ? courseId.split('-')[1] 
            : courseId;
            
          console.log("处理的区块链课程ID:", blockchainCourseId);
          
          // 解析课程价格
          const priceString = course.price.split(' ')[0]; // 获取价格数值部分
          const priceInWei = ethers.parseEther(priceString);
          
          console.log("课程价格 (wei):", priceInWei.toString());
          
          // 检查是否支持代理交易
          if (proxyEnabled && proxySigner.isReady()) {
            // 使用代理签名者进行交易
            console.log("使用代理签名者购买课程");
            
            try {
              // 准备交易数据
              const learningManagerInterface = new ethers.Interface(learningManagerABI.abi);
              const data = learningManagerInterface.encodeFunctionData('enrollCourse', [blockchainCourseId]);
              
              // 使用代理签名者执行交易
              const tx = await proxySigner.sendTransaction({
                to: contractAddresses.learningManager,
                data: data,
                value: priceInWei
              });
              
              console.log("代理交易已发送:", tx.hash);
              toast.success("The course purchase transaction has been submitted");
              
              // 更新课程购买状态
              updatePurchaseStatus(courseId);
              
              return;
            } catch (proxyError: any) {
              console.error("代理交易失败:", proxyError);
              
              if (proxyError.code === 4001) {
                toast.error("交易被用户拒绝");
                setPurchasing(false);
                return;
              }
              
              toast.error(`代理交易失败: ${proxyError.message}`);
              // 继续尝试常规交易方式，不直接返回
            }
          }
          
          // 常规交易方式 - 检查signer是否可用
          if (!signer) {
            console.error("没有有效的签名者，无法发送交易");
            toast.error("钱包连接错误，请重新连接钱包后再试");
            
            // 使用模拟购买作为备选
            await simulatePurchase(courseId);
            return;
          }
          
          // 使用常规方式发送交易
          console.log("使用常规签名者购买课程");
          
          // 重新创建一个带有签名者的合约实例
          const learningManagerWithSigner = new Contract(
            contractAddresses.learningManager,
            learningManagerABI.abi,
            signer
          );
          
          // 检查合约方法是否存在
          if (typeof learningManagerWithSigner.enrollCourse !== 'function') {
            console.error("enrollCourse方法不存在");
            toast.error("合约方法不可用");
            await simulatePurchase(courseId);
            return;
          }
          
          // 执行交易
          const tx = await learningManagerWithSigner.enrollCourse(
            blockchainCourseId,
            { value: priceInWei }
          );
          
          console.log("交易已发送:", tx);
          toast.success("课程购买交易已提交!");
          
          // 等待交易确认
          toast.loading("等待交易确认...");
          
          try {
            // ethers v6 中的交易对象处理方式可能有所不同
            if (provider) {
              // 使用字符串形式的tx作为交易哈希，或直接使用tx对象
              const txHash = typeof tx === 'string' ? tx : (tx as any).transactionHash;
              if (txHash) {
                const receipt = await provider.waitForTransaction(txHash);
                console.log("交易已确认:", receipt);
              } else {
                console.log("无法获取交易哈希，跳过确认等待");
              }
            }
            
            // 更新课程购买状态
            updatePurchaseStatus(courseId);
          } catch (waitError) {
            console.error("等待交易确认时出错:", waitError);
            // 即使确认过程出错，也更新购买状态（前端模拟成功）
            updatePurchaseStatus(courseId);
          }
          
        } catch (error: any) {
          console.error("区块链交易错误:", error);
          
          if (error.code === 4001) {
            toast.error("交易被用户拒绝");
            setPurchasing(false);
            return;
          }
          
          toast.error(`交易失败: ${error.message || "未知错误"}`);
          console.log("尝试使用模拟购买作为后备方案");
          
          // 使用模拟购买作为后备方案
          await simulatePurchase(courseId);
        }
      } else {
        console.log("合约未初始化或钱包未连接，使用模拟购买");
        await simulatePurchase(courseId);
      }
    } catch (error: any) {
      console.error('购买错误:', error);
      setPurchaseError(error.message || '购买课程时出错');
      toast.error(`购买失败: ${error.message || '未知错误'}`);
    } finally {
      setPurchasing(false);
    }
  };
  
  // 模拟购买功能（当区块链交易不可用时）
  const simulatePurchase = async (courseId: string) => {
    // 模拟合约交互
    console.log("使用模拟购买流程");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 更新课程购买状态
    updatePurchaseStatus(courseId);
    
    toast.success('课程购买成功!');
  };
  
  // 更新课程购买状态
  const updatePurchaseStatus = (courseId: string) => {
    // 更新课程购买状态
    const updatedCourses = courses.map(c => 
      c.id === courseId ? { ...c, isPurchased: true } : c
    );
    
    setCourses(updatedCourses);
    setFilteredCourses(updatedCourses);
    
    // 存储已购买课程到本地存储
    const purchasedCoursesString = localStorage.getItem('purchasedCourses');
    let purchasedCourses: string[] = [];
    
    if (purchasedCoursesString) {
      try {
        purchasedCourses = JSON.parse(purchasedCoursesString);
      } catch (e) {
        console.error('解析已购买课程时出错:', e);
      }
    }
    
    if (!purchasedCourses.includes(courseId)) {
      purchasedCourses.push(courseId);
      localStorage.setItem('purchasedCourses', JSON.stringify(purchasedCourses));
    }
    
    setPurchaseSuccess(true);
    
    // 3秒后重置成功状态
    setTimeout(() => {
      setPurchaseSuccess(false);
    }, 3000);
  };
  
  // Handle continuing learning for a course
  const handleContinueLearning = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course && course.videos && course.videos.length > 0) {
      // Unlock first video for purchased course
      const firstVideo = course.videos[0];
      setActiveVideo({
        ...firstVideo,
        locked: false
      });
      setShowVideoPlayer(true);
    }
  };
  
  // Filter courses based on search and filters
  useEffect(() => {
    let result = [...courses];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course => 
          course.title.toLowerCase().includes(query) || 
          course.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(course => course.category === categoryFilter);
    }
    
    // Apply level filter
    if (levelFilter !== 'all') {
      result = result.filter(course => course.level.toLowerCase() === levelFilter);
    }
    
    setFilteredCourses(result);
  }, [searchQuery, categoryFilter, levelFilter, courses]);
  
  // Close video player
  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setActiveVideo(null);
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Learning Center</h1>
          <p className="text-xl text-gray-400">Discover courses, purchase tokens, and start learning</p>
        </div>
        
        {/* 搜索和过滤器部分 - 仅在未选择课程时显示 */}
        {!activeCourse && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 flex items-center justify-center md:w-auto"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                <span>Filter</span>
              </button>
            </div>
            
            {/* 过滤器 */}
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg p-4 mb-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      <option value="blockchain">Blockchain</option>
                      <option value="development">Development</option>
                      <option value="defi">DeFi</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Level</label>
                    <select
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                    >
                      <option value="all">All Levels</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        
        {/* 完全互斥的课程详情或课程列表 */}
        {activeCourse ? (
          // 课程详情视图
          <div className="glass rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <button
                onClick={() => {
                  // 重置激活课程状态
                  setActiveCourse(null);
                  // 重置购买状态
                  setPurchaseSuccess(false);
                  setPurchasing(false);
                }}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-1" />
                Back to Courses
              </button>
              
              <Link
                href={`/trade?token=${activeCourse.symbol}`}
                className="flex items-center text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>Trade {activeCourse.symbol} Tokens</span>
                <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Course info */}
                <div className="md:col-span-2">
                  <h2 className="text-2xl font-bold mb-4">{activeCourse.title}</h2>
                  
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="px-2 py-1 bg-purple-600/30 text-purple-400 rounded-full text-sm">
                      {activeCourse.category}
                    </span>
                    <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
                      {activeCourse.level}
                    </span>
                    <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded-full text-sm">
                      {activeCourse.duration}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-6">
                    {activeCourse.description}
                  </p>
                  
                  <div className="glass-dark p-4 rounded-lg mb-6">
                    <h3 className="font-semibold mb-2">Course Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm">Instructor</div>
                        <div className="font-medium">{activeCourse.instructor.substring(0, 6)}...{activeCourse.instructor.substring(activeCourse.instructor.length - 4)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Students</div>
                        <div className="font-medium">{activeCourse.students}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Rating</div>
                        <div className="font-medium flex items-center">
                          {activeCourse.rating} <StarIcon className="h-4 w-4 text-yellow-500 ml-1" />
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Price</div>
                        <div className="font-medium">{activeCourse.price}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Course videos */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                    <div className="space-y-3">
                      {activeCourse.videos?.map((video, index) => (
                        <div 
                          key={video.id || index}
                          className={`glass-dark p-4 rounded-lg cursor-pointer transition-colors ${
                            activeCourse.isPurchased && index === 0 
                              ? 'hover:bg-gray-700/50' 
                              : 'opacity-70'
                          }`}
                          onClick={() => {
                            if (activeCourse.isPurchased && index === 0) {
                              setActiveVideo({
                                ...video,
                                locked: false
                              });
                              setShowVideoPlayer(true);
                            } else if (!activeCourse.isPurchased) {
                              toast.error('Purchase tokens to unlock this content');
                            } else {
                              toast('Complete previous videos to unlock this one');
                            }
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex">
                              <div className="mt-1 mr-4 flex-shrink-0">
                                {activeCourse.isPurchased && index === 0 ? (
                                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                                    <PlayIcon className="h-4 w-4 text-indigo-400" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium">{video.name}</h4>
                                <p className="text-sm text-gray-400 mt-1">{video.description}</p>
                                <div className="text-xs text-gray-500 mt-1">{video.duration}</div>
                              </div>
                            </div>
                            
                            {activeCourse.isPurchased && index === 0 ? (
                              <span className="px-2 py-1 bg-green-600/30 text-green-400 rounded-full text-xs">Unlocked</span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded-full text-xs">Locked</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Course sidebar */}
                <div>
                  <div className="glass-dark rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <h3 className="font-semibold">Course Token</h3>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center mb-4">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                          <span className="text-white font-bold">{activeCourse.symbol}</span>
                        </div>
                        <div>
                          <div className="font-medium">{activeCourse.title} Token</div>
                          <div className="text-sm text-purple-400">{activeCourse.symbol}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <div className="text-gray-400 text-sm">Price:</div>
                          <div>{activeCourse.price}</div>
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="text-gray-400 text-sm">Your Balance:</div>
                          <div className="font-medium">{activeCourse.isPurchased ? '1.0' : '0.0'} {activeCourse.symbol}</div>
                        </div>
                        
                        <div className="flex justify-between">
                          <div className="text-gray-400 text-sm">Status:</div>
                          <div className={activeCourse.isPurchased ? 'text-green-400' : 'text-red-400'}>
                            {activeCourse.isPurchased ? 'Purchased' : 'Not Purchased'}
                          </div>
                        </div>
                      </div>
                      
                      {activeCourse.isPurchased ? (
                        <div>
                          <button className="w-full py-3 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 mb-2"
                            onClick={() => handleContinueLearning(activeCourse.id)}>
                            Continue Learning
                          </button>
                          
                          <p className="text-xs text-gray-400 text-center">
                            Complete courses to earn more rewards
                          </p>
                        </div>
                      ) : (
                        <div>
                          <button
                            className="w-full py-3 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 mb-2"
                            onClick={() => handlePurchase(activeCourse.id)}
                            disabled={purchasing}
                          >
                            {purchasing ? (
                              <div className="flex justify-center items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                <span>Processing...</span>
                              </div>
                            ) : (
                              `Purchase with ${activeCourse.price}`
                            )}
                          </button>
                          
                          <p className="text-xs text-gray-400 text-center">
                            Buy course tokens to unlock content
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="glass-dark p-4 rounded-lg mt-6">
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-400">Course Duration</span>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 text-indigo-400 mr-1" />
                        <span>{activeCourse.duration}</span>
                      </div>
                    </div>
                    
                    {activeCourse.isPurchased && (
                      <div className="mb-3">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span>{activeCourse.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${activeCourse.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="glass-dark rounded-lg p-3 mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Purchase Amount</span>
                        <span>{activeCourse.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Estimated Rewards</span>
                        <span className="text-green-400">0.5 EDU</span>
                      </div>
                    </div>
                    
                    <Link href="/trade" className="w-full py-2 rounded-lg font-medium bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors flex items-center justify-center">
                      <span className="mr-1">Buy {activeCourse.symbol} tokens</span>
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 课程列表视图 - 仅当没有活动课程时显示
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={setActiveCourse}
                  onPurchase={handlePurchase}
                  purchasing={purchasing}
                  purchaseSuccess={purchaseSuccess}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="glass rounded-xl p-8">
                  <h3 className="text-xl font-medium mb-2">No courses found</h3>
                  <p className="text-gray-400">
                    Try changing your search query or filters
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Video player modal */}
      {showVideoPlayer && activeVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full mx-auto overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-medium">{activeVideo.name}</h3>
              <button
                onClick={closeVideoPlayer}
                className="p-1 hover:bg-gray-800 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="aspect-video bg-black flex items-center justify-center">
              <div className="text-center">
                <PlayIcon className="h-16 w-16 text-white/50 mx-auto mb-4" />
                <p className="text-gray-400">Video playback would appear here</p>
                <p className="text-gray-500 text-sm mt-2">This is a demo placeholder for the actual video player</p>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-medium mb-2">{activeVideo.name}</h4>
              <p className="text-gray-400 text-sm">{activeVideo.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

