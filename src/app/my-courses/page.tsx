'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ChartBarIcon, 
  VideoCameraIcon, 
  ArrowUpTrayIcon, 
  XMarkIcon,
  PlayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { uploadToIPFS as ipfsUpload, uploadJSONToIPFS, getIPFSUrl, getVideoUrl } from '@/lib/ipfs';
import { Buffer } from 'buffer';
import contractAddresses from '@/contracts/contract-addresses.json';
import CourseFactoryABI from '@/contracts/CourseFactory.json';

// IPFS 配置
const projectId = process.env.NEXT_PUBLIC_IPFS_PROJECT_ID || ''; // TODO: Add your Infura IPFS project ID
const projectSecret = process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET || ''; // TODO: Add your Infura IPFS project secret key
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

// Course interface
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
  tokenName: string;
  tokenSymbol: string;
  tokenPrice: string;
  tokenIconUrl: string;
  videos: Video[];
  totalStudents: number;
  totalEarnings: string;
  salesLastWeek: number;
}

// Contract Course interface
interface ContractCourse {
  id: any;
  title: string;
  description: string;
  duration: any;
  price: any;
  creator: string;
  courseTokenAddress: string;
  creationTime: any;
  learnersCount: any;
  isActive: boolean;
}

// Video interface
interface Video {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number;
  ipfsHash: string;
  thumbnail?: string;
  purchases: number;
}

// Video upload interface
interface VideoUpload {
  file: File | null;
  name: string;
  description: string;
  price: string;
  duration: number;
}

// Mock data - in a real application, this should be fetched from the blockchain
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Blockchain',
    description: 'Learn the fundamentals of blockchain technology and its applications in the real world.',
    category: 'Blockchain Basics',
    createdAt: '2023-04-15T12:00:00Z',
    tokenName: 'Blockchain Intro Token',
    tokenSymbol: 'BIT',
    tokenPrice: '0.5',
    tokenIconUrl: 'https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png',
    videos: [
      {
        id: 'v1',
        name: 'What is Blockchain?',
        description: 'Introduction to blockchain technology and its core concepts.',
        price: '0.1',
        duration: 1520, // 25m 20s
        ipfsHash: 'QmXyZ...',
        purchases: 47
      },
      {
        id: 'v2',
        name: 'Cryptography Basics',
        description: 'Understanding the cryptographic principles behind blockchain.',
        price: '0.2',
        duration: 1860, // 31m
        ipfsHash: 'QmABC...',
        purchases: 35
      },
      {
        id: 'v3',
        name: 'Consensus Mechanisms',
        description: 'Exploring different consensus algorithms used in blockchain networks.',
        price: '0.2',
        duration: 2340, // 39m
        ipfsHash: 'QmDEF...',
        purchases: 29
      }
    ],
    totalStudents: 58,
    totalEarnings: '24.6',
    salesLastWeek: 12
  },
  {
    id: '2',
    title: 'Smart Contract Development',
    description: 'A comprehensive guide to building smart contracts on Ethereum.',
    category: 'Smart Contract Development',
    createdAt: '2023-06-22T15:30:00Z',
    tokenName: 'Smart Contract Token',
    tokenSymbol: 'SCT',
    tokenPrice: '0.8',
    tokenIconUrl: 'https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png',
    videos: [
      {
        id: 'v4',
        name: 'Introduction to Solidity',
        description: 'Getting started with Solidity programming language.',
        price: '0.3',
        duration: 2760, // 46m
        ipfsHash: 'QmGHI...',
        purchases: 41
      },
      {
        id: 'v5',
        name: 'Writing Your First Smart Contract',
        description: 'Step-by-step guide to creating a basic smart contract.',
        price: '0.3',
        duration: 3120, // 52m
        ipfsHash: 'QmJKL...',
        purchases: 38
      }
    ],
    totalStudents: 43,
    totalEarnings: '32.5',
    salesLastWeek: 8
  }
];

const MyCoursesPage = () => {
  const { walletAddress, isConnected, contracts, signer } = useWeb3();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [videoUpload, setVideoUpload] = useState<VideoUpload>({
    file: null,
    name: '',
    description: '',
    price: '0.01',
    duration: 0
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch creator's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        
        // Start with mock courses, but ensure unique IDs by adding prefix
        // 为模拟课程添加"mock-"前缀以避免与区块链课程ID冲突
        let allCourses = mockCourses.map(course => ({
          ...course,
          id: `mock-${course.id}` // 添加前缀确保ID唯一性
        }));
        
        // If wallet is connected and contracts are available, fetch blockchain courses
        if (isConnected && walletAddress && contracts) {
          try {
            // Check if courseFactory contract is available
            if (contracts.courseFactory) {
              console.log("Fetching courses from blockchain for:", walletAddress);
              
              // Get creator's courses from the contract
              const creatorCoursesIds = await contracts.courseFactory.getCreatorCourses(walletAddress);
              
              // If there are courses in the blockchain
              if (creatorCoursesIds && creatorCoursesIds.length > 0) {
                console.log("Found courses:", creatorCoursesIds.length);
                
                // Array to store blockchain courses
                const blockchainCourses: Course[] = [];
                
                // Process each course ID
                for (let i = 0; i < creatorCoursesIds.length; i++) {
                  try {
                    const courseId = creatorCoursesIds[i];
                    
                    // Get course details from contract
                    if (contracts.courseFactory && typeof contracts.courseFactory.getCourse === 'function') {
                      const course = await contracts.courseFactory.getCourse(courseId);
                      
                      if (course) {
                        // Get number of learners if learningManager is available
                        let learnersCount = 0;
                        if (contracts.learningManager) {
                          try {
                            const learners = await contracts.learningManager.getCourseLearners(courseId);
                            learnersCount = learners?.length || 0;
                          } catch (error) {
                            console.warn("Could not fetch learners for course", courseId.toString(), error);
                          }
                        }
                        
                        // Format price from wei to ETH
                        let priceInEth = '0';
                        if (course.price) {
                          try {
                            // Convert price from wei to ETH
                            const priceInWei = course.price.toString();
                            const priceValue = parseInt(priceInWei);
                            priceInEth = (priceValue / 1e18).toFixed(2);
                          } catch (e) {
                            console.error("Error formatting price:", e);
                          }
                        }
                        
                        // Get creation timestamp
                        const creationTime = course.creationTime 
                          ? parseInt(course.creationTime.toString()) 
                          : Math.floor(Date.now() / 1000);
                        
                        // 使用"bc-"前缀明确标识区块链课程
                        const uniqueCourseId = `bc-${courseId.toString()}`;
                        
                        // Create course object matching our interface
                        blockchainCourses.push({
                          id: uniqueCourseId, // 使用带前缀的唯一ID
                          title: course.title || 'Untitled Course',
                          description: course.description || 'No description available',
                          category: 'Blockchain', // Default category
                          createdAt: new Date(creationTime * 1000).toISOString(),
                          tokenName: `${course.title || 'Course'} Token`,
                          tokenSymbol: `CT${courseId.toString()}`,
                          tokenPrice: priceInEth,
                          tokenIconUrl: 'https://framerusercontent.com/images/Ej7ALagKx7ezHgAuABhjaN5gs.png', // Default icon
                          videos: [], // Empty videos array, would need to be fetched separately
                          totalStudents: learnersCount,
                          totalEarnings: '0', // Would need to be calculated
                          salesLastWeek: 0 // Would need to be calculated
                        });
                      }
                    }
                  } catch (error) {
                    console.error("Error processing course:", error);
                    // Continue with next course
                  }
                }
                
                // 合并区块链课程和模拟课程
                if (blockchainCourses.length > 0) {
                  console.log("Loaded courses from blockchain:", blockchainCourses);
                  // 将区块链课程放在前面，以便优先显示
                  allCourses = [...blockchainCourses, ...allCourses];
                  console.log("Combined courses list:", allCourses.map(c => ({id: c.id, title: c.title})));
                }
              } else {
                console.log("No blockchain courses found for this wallet");
              }
            } else {
              console.log("CourseFactory contract not available");
            }
          } catch (error) {
            console.error("Error fetching courses from blockchain:", error);
            toast.error("Failed to load courses from blockchain");
          }
        } else {
          console.log("Wallet not connected or contracts not available, using mock data only");
        }
        
        // Update state with all courses
        setCourses(allCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load your courses');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourses();
  }, [isConnected, walletAddress, contracts]);
  
  // Handle video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
        
        setVideoUpload({
          file,
          name: file.name.split('.')[0],
          description: '',
          price: '0.01',
          duration,
        });
      };
      
      video.src = URL.createObjectURL(file);
    }
  };
  
  // Upload file to IPFS
  const uploadFileToIPFS = async (file: File): Promise<string> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Use function from lib/ipfs with progress callback
      const updateProgress = (progress: number) => {
        setUploadProgress(progress);
      };
      
      // Call the imported IPFS upload function
      const ipfsHash = await ipfsUpload(file, updateProgress);
      
      setIsUploading(false);
      return ipfsHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      setIsUploading(false);
      throw error;
    }
  };
  
  // Add video to course
  const addVideoToCourse = async () => {
    if (!videoUpload.file || !videoUpload.name) {
      toast.error('Please select a video file and add title');
      return;
    }
    
    try {
      setIsUploading(true);
      toast.loading('Uploading video to IPFS...');
      
      // Upload video file
      const videoHash = await uploadFileToIPFS(videoUpload.file);
      console.log("Video uploaded to IPFS with hash:", videoHash);
      
      // Create video metadata
      const videoMetadata = {
        name: videoUpload.name,
        description: videoUpload.description,
        duration: videoUpload.duration,
        price: videoUpload.price,
        ipfsHash: videoHash,
        thumbnail: "", // Can add thumbnail later
        dateAdded: new Date().toISOString()
      };
      
      // Upload metadata to IPFS
      const metadataHash = await uploadJSONToIPFS(videoMetadata);
      
      // Add video to course here
      // (Actual implementation might involve smart contract calls)
      
      // Mock API call - in a real scenario, should be added via contract
      const videoId = Date.now().toString();
      const newVideoEntry: Video = {
        id: videoId,
        name: videoUpload.name,
        description: videoUpload.description || '',
        price: videoUpload.price || '0',
        duration: videoUpload.duration || 0,
        ipfsHash: videoHash,
        purchases: 0
      };
      
      // Update selected course's video list
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse?.id) {
          return {
            ...course,
            videos: [...course.videos, newVideoEntry]
          };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      
      // Clear form
      setVideoUpload({
        file: null,
        name: '',
        description: '',
        price: '0.01',
        duration: 0
      });
      setShowAddVideoModal(false);
      
      toast.dismiss();
      toast.success('Video added successfully!');
      
    } catch (error) {
      console.error("Failed to add video:", error);
      toast.dismiss();
      toast.error('Failed to add video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Delete video
  const deleteVideo = (videoId: string) => {
    if (!selectedCourse) return;
    
    if (confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      const updatedVideos = selectedCourse.videos.filter(video => video.id !== videoId);
      
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          return {
            ...course,
            videos: updatedVideos
          };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      setSelectedCourse({
        ...selectedCourse,
        videos: updatedVideos
      });
      
      toast.success('Video deleted successfully!');
    }
  };
  
  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return [
      hours > 0 ? `${hours}h` : null,
      minutes > 0 ? `${minutes}m` : null,
      secs > 0 || (hours === 0 && minutes === 0) ? `${secs}s` : null
    ].filter(Boolean).join(' ');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Courses</h1>
          
          <Link
            href="/create"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white hover:from-purple-700 hover:to-indigo-700 transition-colors"
          >
            Create New Course
          </Link>
        </div>
        
        {!isConnected ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Please connect your wallet to view your created courses.</p>
            <button
              onClick={() => toast.error('Please connect wallet from the navbar')}
              className="px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="glass p-8 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="glass p-8 rounded-xl text-center">
            <h2 className="text-2xl font-semibold mb-4">No Courses Yet</h2>
            <p className="text-gray-400 mb-6">You haven't created any courses yet. Get started by creating your first course!</p>
            <Link
              href="/create"
              className="px-6 py-3 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors"
            >
              Create First Course
            </Link>
          </div>
        ) : (
          selectedCourse ? (
            <div className="glass rounded-xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-800">
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                  }}
                  className="px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
                >
                  Back to Courses
                </button>
                
                <div className="flex items-center space-x-3">
                  <button className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  
                  <button className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Course Info */}
                  <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">{selectedCourse.title}</h2>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">
                        {selectedCourse.category}
                      </span>
                      
                      <span className="text-gray-400 text-sm">
                        Created: {formatDate(selectedCourse.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 mb-6">
                      {selectedCourse.description}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="glass-dark p-4 rounded-lg">
                        <div className="text-lg font-bold text-purple-400">{selectedCourse.totalStudents}</div>
                        <div className="text-gray-400 text-sm">Total Students</div>
                      </div>
                      
                      <div className="glass-dark p-4 rounded-lg">
                        <div className="text-lg font-bold text-green-400">{selectedCourse.totalEarnings} EDU</div>
                        <div className="text-gray-400 text-sm">Total Earnings</div>
                      </div>
                      
                      <div className="glass-dark p-4 rounded-lg">
                        <div className="text-lg font-bold text-blue-400">+{selectedCourse.salesLastWeek}</div>
                        <div className="text-gray-400 text-sm">Sales Last Week</div>
                      </div>
                    </div>
                    
                    {/* Video Management */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Videos</h3>
                        
                        <button
                          onClick={() => setShowAddVideoModal(true)}
                          className="flex items-center px-4 py-2 bg-purple-600/30 border border-purple-500/50 rounded-lg hover:bg-purple-600/40 transition-colors"
                        >
                          <PlusIcon className="w-5 h-5 mr-2" />
                          <span>Add Video</span>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedCourse.videos.map(video => (
                          <div key={video.id} className="glass-dark p-4 rounded-lg">
                            <div className="flex justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="bg-gray-700 rounded-md w-16 h-16 flex items-center justify-center flex-shrink-0">
                                  <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-1">{video.name}</h4>
                                  <p className="text-gray-400 text-sm mb-2">{video.description}</p>
                                  
                                  <div className="flex items-center space-x-4 text-sm">
                                    <span className="text-purple-400">{video.price} {selectedCourse.tokenSymbol}</span>
                                    <span className="text-gray-400">{formatDuration(video.duration)}</span>
                                    <span className="text-gray-400">{video.purchases} purchases</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-2">
                                <button className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                                  <PlayIcon className="w-4 h-4" />
                                </button>
                                
                                <button className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => deleteVideo(video.id)}
                                  className="p-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Token Info */}
                  <div>
                    <div className="glass-dark p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-4">Token Information</h3>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                          <Image
                            src={selectedCourse.tokenIconUrl}
                            alt={selectedCourse.tokenSymbol}
                            width={40}
                            height={40}
                            className="rounded-full"
                            unoptimized
                          />
                        </div>
                        
                        <div>
                          <div className="font-semibold">{selectedCourse.tokenName}</div>
                          <div className="text-purple-400">{selectedCourse.tokenSymbol}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-gray-400 text-sm mb-1">Current Price</div>
                          <div className="text-xl font-semibold">{selectedCourse.tokenPrice} EDU</div>
                        </div>
                        
                        {/* Token Performance */}
                        <div>
                          <div className="text-gray-400 text-sm mb-1">24h Change</div>
                          <div className="text-green-400">+4.2%</div>
                        </div>
                        
                        {/* Token Market Cap */}
                        <div>
                          <div className="text-gray-400 text-sm mb-1">Market Cap</div>
                          <div>1,255 EDU</div>
                        </div>
                        
                        {/* Token Holders */}
                        <div>
                          <div className="text-gray-400 text-sm mb-1">Holders</div>
                          <div>{selectedCourse.totalStudents}</div>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-700">
                        <Link
                          href={`/trade?token=${selectedCourse.tokenSymbol}`}
                          className="block w-full py-3 text-center bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors"
                        >
                          View on Market
                        </Link>
                      </div>
                    </div>
                    
                    {/* Analytics Preview */}
                    <div className="glass-dark p-6 rounded-lg mt-6">
                      <h3 className="text-xl font-semibold mb-4">Analytics</h3>
                      
                      <div className="flex flex-col items-center justify-center py-6">
                        <ChartBarIcon className="w-16 h-16 text-gray-500 mb-4" />
                        <p className="text-center text-gray-400">
                          View detailed analytics for your course performance.
                        </p>
                        
                        <button className="mt-4 px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors">
                          View Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="glass rounded-xl overflow-hidden hover:shadow-md hover:shadow-purple-500/20 transition-all cursor-pointer"
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                        <Image
                          src={course.tokenIconUrl}
                          alt={course.tokenSymbol}
                          width={32}
                          height={32}
                          className="rounded-full"
                          unoptimized
                        />
                      </div>
                      
                      <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">
                        {course.category}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="text-center p-2 rounded-lg bg-gray-800/50">
                        <div className="font-semibold">{course.videos.length}</div>
                        <div className="text-gray-400 text-xs">Videos</div>
                      </div>
                      
                      <div className="text-center p-2 rounded-lg bg-gray-800/50">
                        <div className="font-semibold">{course.totalStudents}</div>
                        <div className="text-gray-400 text-xs">Students</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-400 text-xs">Token Price</span>
                        <div className="text-purple-400 font-semibold">{course.tokenPrice} EDU</div>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-xs">Earnings</span>
                        <div className="text-green-400 font-semibold">{course.totalEarnings} EDU</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-800 flex justify-between items-center">
                    <div className="text-gray-400 text-xs">
                      Created: {formatDate(course.createdAt)}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                      }}
                      className="text-purple-400 text-sm hover:text-purple-300 transition-colors flex items-center"
                    >
                      <span className="mr-1">Manage</span>
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </motion.div>
      
      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-900 rounded-xl max-w-2xl w-full mx-4 overflow-hidden shadow-xl border border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-medium">Add New Video</h3>
              <button
                onClick={() => {
                  setShowAddVideoModal(false);
                  setVideoUpload({
                    file: null,
                    name: '',
                    description: '',
                    price: '0.01',
                    duration: 0
                  });
                }}
                className="p-1 rounded-full hover:bg-gray-800"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {videoUpload.file ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Title
                    </label>
                    <input
                      type="text"
                      value={videoUpload.name}
                      onChange={(e) => setVideoUpload({ ...videoUpload, name: e.target.value })}
                      placeholder="Video title"
                      className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={videoUpload.description}
                      onChange={(e) => setVideoUpload({ ...videoUpload, description: e.target.value })}
                      placeholder="Video description"
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Price (in {selectedCourse?.tokenSymbol})
                      </label>
                      <input
                        type="number"
                        value={videoUpload.price}
                        onChange={(e) => setVideoUpload({ ...videoUpload, price: e.target.value })}
                        placeholder="0.01"
                        step="0.01"
                        min="0.01"
                        className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration
                      </label>
                      <div className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-white">
                        {formatDuration(videoUpload.duration)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 flex items-center">
                    <VideoCameraIcon className="w-6 h-6 text-gray-400 mr-3" />
                    <div className="flex-1 truncate">
                      <div className="font-medium">{videoUpload.file.name}</div>
                      <div className="text-gray-400 text-sm">
                        {(videoUpload.file.size / (1024 * 1024)).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => setVideoUpload({
                        ...videoUpload,
                        file: null
                      })}
                      className="p-1 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600/30 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-16">
                  <div className="text-center">
                    <ArrowUpTrayIcon
                      className="mx-auto h-12 w-12 text-gray-500"
                      aria-hidden="true"
                    />
                    <div className="mt-4 flex text-sm leading-6 text-gray-400">
                      <label
                        htmlFor="video-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-purple-400 focus-within:outline-none hover:text-purple-300"
                      >
                        <span>Upload a video</span>
                        <input
                          id="video-upload"
                          name="video-upload"
                          type="file"
                          className="sr-only"
                          accept="video/*"
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">MP4, WEBM, MOV up to 500MB</p>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddVideoModal(false);
                    setVideoUpload({
                      file: null,
                      name: '',
                      description: '',
                      price: '0.01',
                      duration: 0
                    });
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-lg text-white hover:bg-gray-800 transition-colors mr-3"
                >
                  Cancel
                </button>
                
                <button
                  onClick={addVideoToCourse}
                  disabled={!videoUpload.file || isUploading}
                  className={`px-4 py-2 rounded-lg text-white transition-colors ${
                    !videoUpload.file || isUploading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{`Uploading... ${uploadProgress}%`}</span>
                    </div>
                  ) : (
                    'Add Video'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage; 