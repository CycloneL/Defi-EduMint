'use client';

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { XMarkIcon, PlayIcon, CheckCircleIcon, ClockIcon, AcademicCapIcon, TrophyIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Course interface
interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  image: string;
  progress: number;
  lastViewed?: string;
  videos: CourseVideo[];
  completed: boolean;
  certificate?: Certificate;
}

// Video interface
interface CourseVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  progress: number;
  completed: boolean;
  lastViewed?: string;
}

// Certificate interface
interface Certificate {
  id: string;
  tokenId: string;
  issueDate: string;
  image: string;
}

// Mock data - in a real app, this would be fetched from the blockchain/API
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Blockchain Fundamentals',
    description: 'An introduction to blockchain technology and its applications in the modern world.',
    category: 'Blockchain',
    level: 'Beginner',
    image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 75,
    lastViewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    videos: [
      {
        id: 'v1',
        title: 'Introduction to Blockchain',
        description: 'Understanding the basics of blockchain technology',
        duration: '25:30',
        progress: 100,
        completed: true,
        lastViewed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v2',
        title: 'Cryptography Basics',
        description: 'Learn the cryptographic principles behind blockchain',
        duration: '18:45',
        progress: 100,
        completed: true,
        lastViewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v3',
        title: 'Consensus Mechanisms',
        description: 'Explore different consensus algorithms',
        duration: '22:10',
        progress: 25,
        completed: false
      }
    ],
    completed: false
  },
  {
    id: '2',
    title: 'Smart Contract Development',
    description: 'Learn how to develop and deploy smart contracts on Ethereum using Solidity.',
    category: 'Development',
    level: 'Intermediate',
    image: 'https://images.unsplash.com/photo-1659606236737-de86dc9d9e67?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    progress: 100,
    lastViewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    videos: [
      {
        id: 'v1',
        title: 'Introduction to Solidity',
        description: 'Learn the basics of Solidity programming language',
        duration: '30:15',
        progress: 100,
        completed: true,
        lastViewed: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v2',
        title: 'Your First Smart Contract',
        description: 'Building a simple smart contract',
        duration: '28:40',
        progress: 100,
        completed: true,
        lastViewed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'v3',
        title: 'Testing and Deployment',
        description: 'How to test and deploy your smart contracts',
        duration: '35:20',
        progress: 100,
        completed: true,
        lastViewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    completed: true,
    certificate: {
      id: 'cert-001',
      tokenId: '0xabc123',
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      image: 'https://images.unsplash.com/photo-1569098644584-210bcd375b59?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
    }
  }
];

export default function MyLearningPage() {
  const { walletAddress, isConnected } = useWeb3();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // In a real app, this would fetch from the blockchain/API
        // For now, use mock data
        setTimeout(() => {
          setCourses(mockCourses);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load your courses');
        setIsLoading(false);
      }
    };
    
    if (isConnected) {
      fetchCourses();
    } else {
      setIsLoading(false);
    }
  }, [isConnected]);
  
  // Play video
  const playVideo = (course: Course, videoId: string) => {
    const video = course.videos.find(v => v.id === videoId);
    if (!video) return;
    
    setActiveVideo(video);
    setShowVideoPlayer(true);
    
    // In a real app, you would also update the progress on the blockchain
  };
  
  // Close video player
  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setActiveVideo(null);
  };
  
  // View certificate
  const viewCertificate = (course: Course) => {
    if (!course.certificate) return;
    
    setSelectedCourse(course);
    setShowCertificate(true);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };
  
  // Calculate course progress
  const calculateProgress = (videos: CourseVideo[]) => {
    if (videos.length === 0) return 0;
    
    const totalProgress = videos.reduce((acc, video) => acc + video.progress, 0);
    return Math.round(totalProgress / videos.length);
  };
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto pt-24 pb-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 gradient-text">My Learning</h1>
          <p className="text-xl text-gray-400">Track your progress and continue your learning journey</p>
        </div>
        
        {!isConnected ? (
          <div className="glass rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium mb-4">Please connect your wallet first</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to view your learning progress</p>
          </div>
        ) : isLoading ? (
          <div className="glass rounded-xl p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-gray-400">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <h3 className="text-xl font-medium mb-4">You haven't enrolled in any courses yet</h3>
            <p className="text-gray-400 mb-6">Discover and stake tokens for courses to start learning</p>
            <Link href="/learn" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white inline-block">
              Explore Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {/* Selected course view */}
            {selectedCourse ? (
              <div className="glass rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                  <button
                    onClick={() => setSelectedCourse(null)}
                    className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    ← Back to My Courses
                  </button>
                  
                  <div className="flex items-center">
                    <div className="flex bg-gray-800 rounded-full h-8 overflow-hidden">
                      <div 
                        className="bg-green-600 h-full" 
                        style={{ width: `${selectedCourse.progress}%` }}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm">{selectedCourse.progress}% Complete</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Course details */}
                    <div className="lg:col-span-2">
                      <h2 className="text-2xl font-bold mb-4">{selectedCourse.title}</h2>
                      
                      <div className="flex flex-wrap gap-3 mb-4">
                        <span className="px-2 py-1 bg-purple-600/30 text-purple-400 rounded-full text-sm">
                          {selectedCourse.category}
                        </span>
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-400 rounded-full text-sm">
                          {selectedCourse.level}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 mb-6">
                        {selectedCourse.description}
                      </p>
                      
                      {selectedCourse.completed && selectedCourse.certificate && (
                        <div className="glass-dark p-4 rounded-lg mb-6 border border-green-600/30">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="mr-4 bg-green-600/20 p-2 rounded-full">
                                <AcademicCapIcon className="h-6 w-6 text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-green-400">Course Completed!</h3>
                                <div className="text-gray-400 text-sm">
                                  Certificate issued on <span suppressHydrationWarning>{formatDate(selectedCourse.certificate.issueDate)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => viewCertificate(selectedCourse)}
                              className="px-3 py-1 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                            >
                              View Certificate
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Course videos */}
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Course Content</h3>
                        <div className="space-y-3">
                          {selectedCourse.videos.map((video) => (
                            <div 
                              key={video.id}
                              className="glass-dark p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors"
                              onClick={() => playVideo(selectedCourse, video.id)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex">
                                  <div className="mt-1 mr-4 flex-shrink-0">
                                    {video.completed ? (
                                      <div className="w-8 h-8 rounded-full bg-green-600/30 flex items-center justify-center">
                                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                                        <PlayIcon className="h-4 w-4 text-indigo-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{video.title}</h4>
                                    <p className="text-sm text-gray-400 mt-1">{video.description}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                      <div className="flex items-center mr-3">
                                        <ClockIcon className="h-3 w-3 mr-1" />
                                        {video.duration}
                                      </div>
                                      {video.lastViewed && (
                                        <div className="flex items-center">
                                          <ArrowPathIcon className="h-3 w-3 mr-1" />
                                          Last viewed: <span suppressHydrationWarning>{formatDate(video.lastViewed)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="mr-3 text-xs">
                                    {video.progress}%
                                  </div>
                                  <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full ${video.completed ? 'bg-green-600' : 'bg-indigo-600'}`}
                                      style={{ width: `${video.progress}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Course sidebar */}
                    <div>
                      <div className="glass-dark rounded-lg overflow-hidden sticky top-24">
                        <div className="p-4 border-b border-gray-700">
                          <h3 className="font-semibold">Your Progress</h3>
                        </div>
                        
                        <div className="p-4">
                          <div className="mb-4">
                            <div className="flex justify-between mb-2">
                              <div className="text-sm text-gray-400">Overall Progress</div>
                              <div className="text-sm font-medium">{selectedCourse.progress}%</div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full"
                                style={{ width: `${selectedCourse.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="mb-6">
                            <div className="text-sm text-gray-400 mb-2">Stats</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <div className="text-indigo-400 text-lg font-medium">
                                  {selectedCourse.videos.filter(v => v.completed).length}/{selectedCourse.videos.length}
                                </div>
                                <div className="text-xs text-gray-400">Videos completed</div>
                              </div>
                              <div className="bg-gray-800/50 p-3 rounded-lg">
                                <div className="text-indigo-400 text-lg font-medium">
                                  {formatDate(selectedCourse.lastViewed)}
                                </div>
                                <div className="text-xs text-gray-400">Last activity</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Continue learning button */}
                          <button
                            className="w-full py-3 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center"
                            onClick={() => {
                              // Find the first incomplete video or the last one if all completed
                              const incompleteVideo = selectedCourse.videos.find(v => !v.completed);
                              const videoToPlay = incompleteVideo || selectedCourse.videos[selectedCourse.videos.length - 1];
                              playVideo(selectedCourse, videoToPlay.id);
                            }}
                          >
                            {selectedCourse.completed ? "Rewatch Course" : "Continue Learning"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Enrolled Courses</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="glass rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-purple-500/20 transition-all"
                      onClick={() => setSelectedCourse(course)}
                    >
                      <div className="relative h-40">
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
                        
                        {course.completed && (
                          <div className="absolute top-2 right-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                        
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-gray-400">{course.level}</span>
                          <span className="text-gray-400">{course.videos.length} videos</span>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex justify-between mb-1 text-sm">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${course.completed ? 'bg-green-600' : 'bg-indigo-600'}`}
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-400">
                            Last viewed: <span suppressHydrationWarning>{formatDate(course.lastViewed)}</span>
                          </div>
                          <div className="flex items-center text-indigo-400 text-sm">
                            <span className="mr-1">Continue</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
              <h3 className="text-xl font-medium">{activeVideo.title}</h3>
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
              <h4 className="font-medium mb-2">{activeVideo.title}</h4>
              <p className="text-gray-400 text-sm">{activeVideo.description}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Certificate modal */}
      {showCertificate && selectedCourse?.certificate && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl max-w-2xl w-full mx-auto overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-medium">Course Certificate</h3>
              <button
                onClick={() => setShowCertificate(false)}
                className="p-1 hover:bg-gray-800 rounded-full"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="w-full aspect-video relative mb-6 border-8 border-indigo-900/50 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 flex flex-col items-center justify-center text-center p-8">
                  <TrophyIcon className="h-16 w-16 text-yellow-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
                  <p className="text-gray-300 mb-6">This certifies that</p>
                  <p className="text-xl font-medium mb-1">{walletAddress?.substring(0, 8)}...{walletAddress?.substring(walletAddress.length - 6)}</p>
                  <p className="text-gray-300 mb-6">has successfully completed</p>
                  <p className="text-2xl font-bold mb-6">{selectedCourse.title}</p>
                  <div className="text-sm text-gray-300">
                    <p>Issued on: <span suppressHydrationWarning>{new Date(selectedCourse.certificate.issueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</span></p>
                    <p className="mt-1">Certificate ID: {selectedCourse.certificate.tokenId}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-400 text-sm mb-2">
                  This certificate is stored as an NFT on the blockchain and serves as proof of your accomplishment.
                </p>
                <p className="text-indigo-400 text-sm">
                  Token ID: {selectedCourse.certificate.tokenId}
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                  View on Blockchain
                </button>
                <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors">
                  Download Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 