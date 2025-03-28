'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon as SearchIcon, FunnelIcon as FilterIcon, BookOpenIcon, ClockIcon, UserIcon, StarIcon, ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ethers } from 'ethers';

// 更新分类与Web3分类保持一致
const categories = [
  { id: 'blockchain', name: '区块链基础' },
  { id: 'smartcontract', name: '智能合约开发' },
  { id: 'dapp', name: '去中心化应用' },
  { id: 'defi', name: 'DeFi协议' },
  { id: 'nft', name: 'NFT与数字艺术' },
  { id: 'dao', name: 'DAO与治理' },
  { id: 'crypto', name: '加密经济学' },
  { id: 'security', name: '区块链安全' },
  { id: 'layer2', name: '扩容与二层解决方案' },
  { id: 'metaverse', name: '元宇宙技术' }
];

// 定义课程类型
interface Course {
  id: string;
  title: string;
  symbol?: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  students: number;
  price: string;
  rating: number | string;
  image: string;
  isStaked: boolean;
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
  onStake: (courseId: string) => void;
  staking: boolean;
  stakingSuccess: boolean;
}

// 默认课程数据
const defaultCourses: Course[] = [
  {
    id: "course-1",
    title: "Solidity智能合约开发",
    description: "从零开始学习Solidity智能合约开发，掌握区块链应用开发核心技能。",
    category: "smartcontract",
    level: "初级",
    duration: "30天",
    instructor: "0xAb38...7FD2",
    students: 1240,
    price: "0.05 ETH",
    rating: 4.8,
    image: "/images/courses/smartcontract.png",
    isStaked: false,
    progress: 0
  },
  {
    id: "course-2",
    title: "DeFi协议设计与实现",
    description: "深入理解DeFi协议原理，学习如何设计和实现去中心化金融应用。",
    category: "defi",
    level: "高级",
    duration: "45天",
    instructor: "0xF32A...9BE1",
    students: 860,
    price: "0.12 ETH",
    rating: 4.6,
    image: "/images/courses/defi.png",
    isStaked: false,
    progress: 0
  },
  {
    id: "course-3",
    title: "NFT艺术与市场",
    description: "探索NFT艺术创作和市场运作机制，了解数字艺术品的价值和发展趋势。",
    category: "nft",
    level: "中级",
    duration: "21天",
    instructor: "0x8C71...3F42",
    students: 1560,
    price: "0.08 ETH",
    rating: 4.9,
    image: "/images/courses/nft.png",
    isStaked: true,
    progress: 35
  },
  {
    id: "course-4",
    title: "Web3应用开发实战",
    description: "学习如何构建真实世界的Web3应用，从前端到智能合约的全栈开发。",
    category: "dapp",
    level: "中级",
    duration: "38天",
    instructor: "0x2D43...9A01",
    students: 1120,
    price: "0.1 ETH",
    rating: 4.7,
    image: "/images/courses/dapp.png",
    isStaked: true,
    progress: 68
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
const CourseCard: React.FC<CourseCardProps> = ({ course, onSelect, onStake, staking, stakingSuccess }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="course-card"
      onClick={() => onSelect(course)}
    >
      {course.image ? (
        <img src={course.image} alt={course.title} className="course-image" />
      ) : (
        <div className="course-image-placeholder flex items-center justify-center">
          <span className="text-lg font-bold text-gray-300">
            {course.title.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}
      
      <div className="course-content">
        <div className="flex justify-between items-start mb-2">
          <h3 className="course-title">{course.title}</h3>
          <span className="course-category">{course.category}</span>
        </div>
        
        <p className="course-description">{course.description}</p>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-xs text-gray-400">
            <span className="mr-2">{course.level}</span>
            <span>•</span>
            <span className="mx-2">{course.duration}</span>
          </div>
          <div className="text-xs text-indigo-400 font-medium">
            {course.price === "0" ? "Free" : `${course.price} ETH`}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-gray-400">
            <span>{course.students} students</span>
          </div>
          <div className="flex items-center text-xs">
            <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>{course.rating}</span>
          </div>
        </div>
        
        {course.isStaked && (
          <>
            <div className="course-progress">
              <div 
                className="course-progress-fill" 
                style={{ width: `${course.progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default function LearnPage() {
  const { connected, contracts, account, stakeCourse } = useWeb3();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [mockCourses, setMockCourses] = useState<Course[]>(defaultCourses);
  const [staking, setStaking] = useState(false);
  const [stakingSuccess, setStakingSuccess] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<CourseVideo | null>(null);
  const [videoBlob, setVideoBlob] = useState<string | null>(null);

  // 从本地存储加载课程
  useEffect(() => {
    try {
      const storedCourses = localStorage.getItem('courses');
      if (storedCourses) {
        // 合并存储的课程和默认课程
        const parsedCourses = JSON.parse(storedCourses);
        setMockCourses([...defaultCourses, ...parsedCourses]);
      }
    } catch (error) {
      console.error('从本地存储加载课程失败:', error);
    }
  }, []);

  // 搜索和过滤课程
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 质押学习
  const handleStake = async (courseId: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    try {
      setStaking(true);
      
      // 调用stakeCourse方法
      const tx = await stakeCourse(courseId, "0.1");
      
      // 等待交易确认
      await tx.wait();
      
      // 更新UI状态
      toast.success('Course staked successfully! You can now start learning.');
      
      // 更新课程状态
      setMockCourses(prevCourses => {
        return prevCourses.map(course => {
          if (course.id === courseId) {
            return { ...course, isStaked: true, progress: 0 };
          }
          return course;
        });
      });
      
      // 如果是当前激活的课程，也更新激活课程的状态
      if (activeCourse && activeCourse.id === courseId) {
        setActiveCourse(prev => prev ? { ...prev, isStaked: true, progress: 0 } : null);
      }
      
    } catch (error) {
      console.error('Failed to stake course:', error);
      toast.error('Failed to stake the course. Please try again.');
    } finally {
      setStaking(false);
    }
  };

  // 继续学习按钮处理函数
  const handleContinueLearning = (courseId: string) => {
    const courseData = mockCourses.find(c => c.id === courseId);
    if (!courseData) return;

    // 设置当前激活的课程
    setActiveCourse(courseData);

    // 检查课程是否有视频
    if (!courseData.videos || courseData.videos.length === 0) {
      alert('此课程没有可用的视频。');
      return;
    }

    // 找到第一个视频并设置为当前视频
    const firstVideo = courseData.videos[0];
    
    try {
      // 使用demo视频URL
      const demoVideoIndex = parseInt(courseId) % demoVideoUrls.length;
      
      // 增强视频对象，添加demo标题和描述
      const enhancedVideo = {
        ...firstVideo,
        title: demoVideoTitles[demoVideoIndex],
        name: firstVideo.name || demoVideoTitles[demoVideoIndex],
        description: firstVideo.description || demoVideoDescriptions[demoVideoIndex]
      };
      
      setCurrentVideo(enhancedVideo);
      setVideoBlob(demoVideoUrls[demoVideoIndex]);
      setShowVideoPlayer(true);
      
    } catch (error) {
      console.error("加载演示视频失败:", error);
      toast.error("无法加载视频，请稍后重试");
      
      // 即使加载失败也显示播放器
      setCurrentVideo(firstVideo);
      setVideoBlob(null);
      setShowVideoPlayer(true);
    }
  };
  
  // 关闭视频播放器
  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setCurrentVideo(null);
    if (videoBlob) {
      URL.revokeObjectURL(videoBlob);
      setVideoBlob(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-12 px-4">
        {!activeCourse ? (
          // 课程列表视图
          <>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 gradient-text">知识搜索中心</h1>
              <p className="text-gray-400">探索Web3课程，质押学习并获得奖励</p>
            </div>
            
            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="glass rounded-xl px-4 py-3 flex items-center flex-grow">
                  <SearchIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    placeholder="搜索课程..."
                    className="bg-transparent border-none outline-none w-full text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="glass rounded-xl p-3 flex items-center">
                  <FilterIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <select
                    className="bg-transparent border-none outline-none text-white"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all" className="bg-gray-800">所有分类</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id} className="bg-gray-800">
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {connected && (
                <div className="glass rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold mb-4">我的学习进度</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-indigo-600/20 rounded-lg p-4">
                      <span className="text-xl font-bold">{mockCourses.filter(c => c.isStaked).length}</span>
                      <p className="text-sm text-gray-400">进行中的课程</p>
                    </div>
                    <div className="bg-green-600/20 rounded-lg p-4">
                      <span className="text-xl font-bold">1</span>
                      <p className="text-sm text-gray-400">已完成的课程</p>
                    </div>
                    <div className="bg-blue-600/20 rounded-lg p-4">
                      <span className="text-xl font-bold">0.25 ETH</span>
                      <p className="text-sm text-gray-400">质押总额</p>
                    </div>
                    <div className="bg-purple-600/20 rounded-lg p-4">
                      <span className="text-xl font-bold">0.18 ETH</span>
                      <p className="text-sm text-gray-400">已赚取奖励</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-6">
                {filteredCourses.length > 0 
                  ? `找到 ${filteredCourses.length} 门课程`
                  : '没有找到符合条件的课程'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onSelect={(c: Course) => setActiveCourse(c)}
                    onStake={handleStake}
                    staking={staking}
                    stakingSuccess={stakingSuccess}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          // 课程详情视图
          <div>
            <button 
              className="flex items-center text-gray-400 hover:text-white mb-6"
              onClick={() => setActiveCourse(null)}
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              返回课程列表
            </button>
            
            {/* 视频播放器 */}
            {showVideoPlayer && activeCourse && currentVideo && (
              <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold">{currentVideo.title || currentVideo.name}</h3>
                    <button 
                      onClick={() => setShowVideoPlayer(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4 flex-grow overflow-auto">
                    {videoBlob ? (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full h-full" 
                          src={videoBlob}
                          poster={demoVideoThumbs[parseInt(activeCourse.id) % demoVideoThumbs.length]}
                          onError={(e) => {
                            console.error("视频加载错误:", e);
                            toast.error("视频加载失败，正在尝试备用视频");
                            
                            // 尝试加载备用视频
                            const fallbackIndex = Math.floor(Math.random() * demoVideoUrls.length);
                            setVideoBlob(demoVideoUrls[fallbackIndex]);
                          }}
                        >
                          您的浏览器不支持视频播放。
                        </video>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg flex flex-col items-center justify-center text-center p-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">正在加载Web3教程视频</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          请稍候，正在准备视频资源...<br/>
                          如长时间未加载，请点击下方按钮重试。
                        </p>
                        <button 
                          onClick={() => {
                            const randomIndex = Math.floor(Math.random() * demoVideoUrls.length);
                            setVideoBlob(demoVideoUrls[randomIndex]);
                            
                            // 同时更新视频标题和描述
                            if (currentVideo) {
                              const updatedVideo = {
                                ...currentVideo,
                                title: demoVideoTitles[randomIndex],
                                name: demoVideoTitles[randomIndex],
                                description: demoVideoDescriptions[randomIndex]
                              };
                              setCurrentVideo(updatedVideo);
                            }
                            
                            toast.success("正在加载视频，请稍候...");
                          }}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
                        >
                          加载Web3教程视频
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <h4 className="font-bold text-lg mb-2">{currentVideo.title || currentVideo.name}</h4>
                      <p className="text-gray-600 dark:text-gray-300">{currentVideo.description}</p>
                    </div>
                    
                    {activeCourse.videos && activeCourse.videos.length > 1 && (
                      <div className="mt-6">
                        <h5 className="font-bold mb-3">课程目录</h5>
                        <div className="space-y-2">
                          {activeCourse.videos.map((video, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                // 更新当前视频
                                setCurrentVideo(video);
                                
                                // 使用演示视频和相应的标题、描述
                                const demoIndex = (parseInt(activeCourse.id) + index) % demoVideoUrls.length;
                                setVideoBlob(demoVideoUrls[demoIndex]);
                                
                                // 创建新的视频对象，包含demo标题和描述
                                const enhancedVideo = {
                                  ...video,
                                  title: demoVideoTitles[demoIndex],
                                  name: video.name || demoVideoTitles[demoIndex],
                                  description: demoVideoDescriptions[demoIndex]
                                };
                                setCurrentVideo(enhancedVideo);
                              }}
                              className={`w-full text-left p-3 rounded-lg flex items-center ${
                                currentVideo && currentVideo.name === video.name
                                  ? 'bg-blue-100 dark:bg-blue-900'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 mr-3">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium">{video.title || video.name || demoVideoTitles[index % demoVideoTitles.length]}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {video.duration} 分钟
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="glass rounded-xl overflow-hidden mb-8">
              <div className="relative">
                <div 
                  className="h-64 bg-cover bg-center" 
                  style={{ 
                    backgroundImage: `url(${activeCourse.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-24"></div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-3/4">
                    <h1 className="text-3xl font-bold mb-4">{activeCourse.title}</h1>
                    <p className="text-gray-300 mb-6">{activeCourse.description}</p>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="bg-gray-800/80 rounded-lg px-4 py-2 flex items-center">
                        <BookOpenIcon className="h-5 w-5 text-indigo-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-400">课程分类</div>
                          <div>{categories.find(cat => cat.id === activeCourse.category)?.name || activeCourse.category}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/80 rounded-lg px-4 py-2 flex items-center">
                        <ClockIcon className="h-5 w-5 text-indigo-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-400">课程时长</div>
                          <div>{activeCourse.duration}</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/80 rounded-lg px-4 py-2 flex items-center">
                        <UserIcon className="h-5 w-5 text-indigo-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-400">学习人数</div>
                          <div>{activeCourse.students} 人</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/80 rounded-lg px-4 py-2 flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <div>
                          <div className="text-sm text-gray-400">课程评分</div>
                          <div>{activeCourse.rating}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-xl font-bold mb-4">讲师信息</h3>
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-xl font-bold mr-4">
                          {activeCourse.instructor.charAt(activeCourse.instructor.length - 1)}
                        </div>
                        <div>
                          <h4 className="font-medium">{activeCourse.instructor}</h4>
                          <p className="text-gray-400 text-sm">区块链资深开发者</p>
                        </div>
                      </div>
                    </div>
                    
                    {activeCourse.isStaked && (
                      <div className="mb-8">
                        <h3 className="text-xl font-bold mb-4">学习内容</h3>
                        <div className="glass rounded-lg p-4">
                          {activeCourse.videos && activeCourse.videos.length > 0 ? (
                            <div className="space-y-3">
                              {activeCourse.videos.map((video, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center mr-3">
                                      {video.locked ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      )}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{video.name}</h4>
                                      <p className="text-sm text-gray-400">{video.description}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-sm text-gray-400 mr-2">{video.duration}</span>
                                    {video.locked ? (
                                      <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded">
                                        已锁定
                                      </span>
                                    ) : (
                                      <button 
                                        className="bg-indigo-600/20 text-indigo-400 text-xs px-2 py-1 rounded hover:bg-indigo-600/30"
                                        onClick={() => {
                                          setCurrentVideo(video);
                                          setShowVideoPlayer(true);
                                          // 使用示例视频
                                          const demoIndex = index % demoVideoUrls.length;
                                          setVideoBlob(demoVideoUrls[demoIndex]);
                                        }}
                                      >
                                        观看
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-gray-400 py-6">此课程暂无视频内容</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:w-1/4">
                    {!activeCourse.isStaked ? (
                      <div className="glass rounded-lg p-5 sticky top-24">
                        <div className="text-2xl font-bold mb-2">{activeCourse.price}</div>
                        <p className="text-gray-400 text-sm mb-6">质押此金额参与课程学习</p>
                        
                        <div className="space-y-4 mb-6">
                          <div className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-300">完成课程后可获得70%的ETH返还</span>
                          </div>
                          <div className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-300">获得不可转让的课程NFT证书</span>
                          </div>
                          <div className="flex items-start">
                            <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-300">终身访问课程内容</span>
                          </div>
                        </div>
                        
                        <button 
                          className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mb-4"
                          onClick={() => handleStake(activeCourse.id)}
                          disabled={!connected}
                        >
                          {connected ? '质押并开始学习' : '请先连接钱包'}
                        </button>
                        
                        <p className="text-xs text-gray-400 text-center">
                          质押资金将锁定到智能合约中，完成课程后自动解锁
                        </p>
                      </div>
                    ) : (
                      <div className="glass rounded-lg p-5 sticky top-24">
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600/30 mb-2">
                            <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className="font-bold text-lg">已质押课程</h3>
                          <p className="text-gray-400 text-sm">您已成功质押此课程</p>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">学习进度</span>
                            <span>{activeCourse.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                              style={{ width: `${activeCourse.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="glass-dark rounded-lg p-3 mb-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">质押金额</span>
                            <span>{activeCourse.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">预计返还</span>
                            <span className="text-green-400">0.035 ETH</span>
                          </div>
                        </div>
                        
                        <button className="w-full py-3 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 mb-2"
                          onClick={() => handleContinueLearning(activeCourse.id)}>
                          继续学习
                        </button>
                        
                        <p className="text-xs text-gray-400 text-center">
                          完成度越高，获得的返还越多
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}