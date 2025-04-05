'use client';

import React from 'react';
import { ClockIcon, VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VideoFile {
  name: string;
  size: number;
  type: string;
  duration: number;
  description: string;
  file: File;
}

interface VideoFormProps {
  videos: VideoFile[];
  setVideos: React.Dispatch<React.SetStateAction<VideoFile[]>>;
  handleVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

export default function VideoForm({
  videos,
  setVideos,
  handleVideoChange,
  videoInputRef
}: VideoFormProps) {
  // Format video duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update video details
  const updateVideoDetails = (index: number, field: string, value: string) => {
    const updatedVideos = [...videos];
    (updatedVideos[index] as any)[field] = value;
    setVideos(updatedVideos);
  };

  // Remove video
  const removeVideo = (index: number) => {
    const updatedVideos = [...videos];
    updatedVideos.splice(index, 1);
    setVideos(updatedVideos);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Course Videos</h3>
        
        {/* Video selection button */}
        <div className="mb-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
            onClick={() => videoInputRef.current?.click()}
          >
            <VideoCameraIcon className="h-5 w-5 mr-2" />
            Add Video
          </button>
          <input
            type="file"
            className="hidden"
            ref={videoInputRef}
            accept="video/*"
            onChange={handleVideoChange}
          />
        </div>
        
        {/* Video list */}
        <div className="space-y-4">
          {videos.length === 0 ? (
            <div className="bg-gray-800/50 rounded-lg p-6 text-center">
              <VideoCameraIcon className="h-10 w-10 mx-auto text-gray-600 mb-2" />
              <p className="text-gray-400">No videos added yet. Add your first video.</p>
            </div>
          ) : (
            videos.map((video, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className="bg-indigo-900/30 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                      <VideoCameraIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-medium">{video.name}</h4>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span className="flex items-center mr-3">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatDuration(video.duration)}
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
                    onClick={() => removeVideo(index)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Video Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    placeholder="Enter video title"
                    value={video.name}
                    onChange={(e) => updateVideoDetails(index, 'name', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Video Description
                  </label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter video description"
                    value={video.description}
                    onChange={(e) => updateVideoDetails(index, 'description', e.target.value)}
                    rows={3}
                  ></textarea>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 