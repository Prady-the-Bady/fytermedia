'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { FileRejection } from 'react-dropzone';
import { useDropzone } from 'react-dropzone';
import { FaImage, FaVideo, FaCube, FaSpinner, FaCheck, FaTimes, FaUpload } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export type MediaType = 'image' | 'video' | '3d' | 'audio';

interface MediaUploaderProps {
  onUploadComplete: (url: string, mediaType: MediaType) => void;
  onUploadError?: (error: string) => void;
  allowedTypes?: MediaType[];
  maxSizeMB?: number;
  className?: string;
}

export default function MediaUploader({
  onUploadComplete,
  onUploadError,
  allowedTypes = ['image', 'video', '3d'],
  maxSizeMB = 10,
  className = '',
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Abort controller for cancelling uploads
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Simulated upload progress
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isUploading) {
      intervalId = setInterval(() => {
        setUploadProgress(prev => {
          // Cap at 90% for actual upload completion
          const next = prev + Math.random() * 10;
          return next > 90 ? 90 : next;
        });
      }, 300);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isUploading]);
  
  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);
  
  // Detect file type and set mediaType
  const detectMediaType = useCallback((file: File): MediaType => {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('video/')) {
      return 'video';
    } else if (
      file.type.includes('gltf') ||
      file.type.includes('glb') ||
      file.name.endsWith('.glb') ||
      file.name.endsWith('.gltf')
    ) {
      return '3d';
    } else if (file.type.startsWith('audio/')) {
      return 'audio';
    }
    
    // Default to image type if unknown
    return 'image';
  }, []);
  
  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      const error = `File size exceeds ${maxSizeMB}MB limit`;
      setError(error);
      if (onUploadError) onUploadError(error);
      return;
    }
    
    // Detect and validate media type
    const detectedType = detectMediaType(file);
    if (!allowedTypes.includes(detectedType)) {
      const error = `File type ${detectedType} is not allowed`;
      setError(error);
      if (onUploadError) onUploadError(error);
      return;
    }
    
    // Set file and media type
    setFile(file);
    setMediaType(detectedType);
    
    // Create preview
    if (detectedType === 'image') {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else if (detectedType === 'video') {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    } else {
      // For 3D files, use a placeholder preview
      setPreview(null);
    }
  }, [allowedTypes, maxSizeMB, onUploadError, detectMediaType]);
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: !!file, // Disable click when a file is already selected
    noKeyboard: !!file, // Disable keyboard when a file is already selected
    multiple: false,
    accept: {
      'image/*': allowedTypes.includes('image') ? ['.jpg', '.jpeg', '.png', '.gif', '.webp'] : [],
      'video/*': allowedTypes.includes('video') ? ['.mp4', '.webm', '.mov'] : [],
      'model/*': allowedTypes.includes('3d') ? ['.glb', '.gltf'] : [],
      'application/octet-stream': allowedTypes.includes('3d') ? ['.glb', '.gltf'] : [],
    },
  });
  
  // Upload file to server
  const uploadFile = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Create a new AbortController for this upload
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);
      
      // Send request with fetch
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Set progress to 100% to indicate completion
      setUploadProgress(100);
      
      // Call onUploadComplete with the URL from the response
      onUploadComplete(data.url, mediaType);
      
      // Reset state after a short delay to show the completion animation
      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setPreview(null);
      }, 1000);
      
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        const error = 'Upload cancelled';
        setError(error);
        if (onUploadError) onUploadError(error);
      } else {
        const error = (err as Error).message || 'Upload failed';
        setError(error);
        if (onUploadError) onUploadError(error);
      }
      
      setIsUploading(false);
    }
  };
  
  // Cancel ongoing upload
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
  
  // Reset state
  const resetUploader = () => {
    if (isUploading) {
      cancelUpload();
    }
    
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    
    setFile(null);
    setPreview(null);
    setMediaType('image');
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  };
  
  // Render media type icon
  const renderTypeIcon = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <FaImage className="h-8 w-8 text-indigo-500" />;
      case 'video':
        return <FaVideo className="h-8 w-8 text-pink-500" />;
      case '3d':
        return <FaCube className="h-8 w-8 text-cyan-500" />;
      default:
        return <FaImage className="h-8 w-8 text-indigo-500" />;
    }
  };
  
  return (
    <div className={`media-uploader w-full rounded-lg bg-gray-800 p-4 ${className}`}>
      {/* Dropzone area */}
      <div 
        {...getRootProps()}
        className={`relative overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          isDragActive 
            ? 'border-indigo-500 bg-indigo-500/10' 
            : error 
              ? 'border-red-500 bg-red-500/10' 
              : 'border-gray-600 bg-gray-700/50 hover:border-indigo-500 hover:bg-gray-700'
        }`}
      >
        <input {...getInputProps()} />
        
        {/* Preview */}
        {preview ? (
          <div className="relative aspect-video w-full overflow-hidden">
            {mediaType === 'image' && (
              <Image
                src={preview}
                alt="Upload preview"
                fill
                className="object-cover"
              />
            )}
            
            {mediaType === 'video' && (
              <video
                src={preview}
                className="h-full w-full object-cover"
                controls
                loop
                muted
              />
            )}
            
            {/* Cancel button */}
            {!isUploading && (
              <motion.button
                className="absolute right-3 top-3 rounded-full bg-gray-800/70 p-2 text-white backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetUploader();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        ) : (
          // Dropzone content
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/20">
              {renderTypeIcon(mediaType)}
            </div>
            
            <div className="mt-4 max-w-xs text-center">
              <p className="text-sm font-medium text-white">
                {isDragActive
                  ? 'Drop the file here...'
                  : `Drag & drop a ${allowedTypes.join('/')} file, or click to select`}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Maximum file size: {maxSizeMB}MB
              </p>
              
              {error && (
                <motion.p
                  className="mt-2 text-sm font-medium text-red-500"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </div>
          </div>
        )}
        
        {/* Upload progress overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Progress circle */}
              <div className="relative h-16 w-16">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    className="stroke-gray-700"
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="8"
                    fill="none"
                  />
                  
                  {/* Progress circle */}
                  <motion.circle
                    className="stroke-indigo-500"
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: 251.2, strokeDashoffset: 251.2 }}
                    animate={{
                      strokeDashoffset: 251.2 - (251.2 * uploadProgress) / 100,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
                
                {/* Percentage or icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {uploadProgress === 100 ? (
                    <FaCheck className="h-6 w-6 text-green-500" />
                  ) : (
                    <span className="text-sm font-semibold text-white">
                      {Math.round(uploadProgress)}%
                    </span>
                  )}
                </div>
              </div>
              
              <p className="mt-4 text-sm font-medium text-white">
                {uploadProgress === 100 ? 'Upload complete!' : 'Uploading...'}
              </p>
              
              {/* Cancel button */}
              {uploadProgress < 100 && (
                <button
                  className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelUpload();
                  }}
                >
                  Cancel
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Action buttons */}
      <div className="mt-4 flex justify-between">
        <div>
          {allowedTypes.length > 1 && !file && (
            <div className="flex space-x-2">
              {allowedTypes.map((type) => (
                <button
                  key={type}
                  className={`flex items-center rounded-md px-3 py-1 text-sm ${
                    mediaType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setMediaType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {file && !isUploading && (
          <button
            className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            onClick={uploadFile}
            disabled={isUploading}
          >
            <FaUpload className="mr-2 h-4 w-4" />
            Upload
          </button>
        )}
      </div>
    </div>
  );
}
