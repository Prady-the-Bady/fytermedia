'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaImage, FaVideo, FaCube, FaSpinner } from 'react-icons/fa';
import MediaUploader, { MediaType } from './MediaUploader';
import { useCreatePost } from '@/hooks/api';
import { useCreateStory } from '@/hooks/api';
import { useCreateReel } from '@/hooks/api';
import { toast } from 'react-hot-toast';

export type ContentType = 'post' | 'story' | 'reel';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentType;
}

export default function CreateContentModal({
  isOpen,
  onClose,
  contentType,
}: CreateContentModalProps) {
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  
  // API hooks
  const { createPost, isLoading: isPostLoading } = useCreatePost();
  const { createStory, isLoading: isStoryLoading } = useCreateStory();
  const { createReel, isLoading: isReelLoading } = useCreateReel();
  
  // Get title and allowed media types based on content type
  const getContentTypeDetails = () => {
    switch (contentType) {
      case 'post':
        return {
          title: 'Create Post',
          allowedTypes: ['image', 'video', '3d'] as MediaType[],
          ctaText: 'Post',
        };
      case 'story':
        return {
          title: 'Create Story',
          allowedTypes: ['image', 'video'] as MediaType[],
          ctaText: 'Share to Story',
        };
      case 'reel':
        return {
          title: 'Create Reel',
          allowedTypes: ['video'] as MediaType[],
          ctaText: 'Share Reel',
        };
      default:
        return {
          title: 'Create Content',
          allowedTypes: ['image', 'video', '3d'] as MediaType[],
          ctaText: 'Share',
        };
    }
  };
  
  const { title, allowedTypes, ctaText } = getContentTypeDetails();
  
  // Handle upload complete
  const handleUploadComplete = (url: string, type: MediaType) => {
    setMediaUrl(url);
    setMediaType(type);
    setStep('details');
    toast.success('Upload complete! Add details to your content.');
  };
  
  // Handle upload error
  const handleUploadError = (error: string) => {
    toast.error(error);
  };
  
  // Submit content based on type
  const handleSubmit = async () => {
    if (!mediaUrl) {
      toast.error('Please upload media first');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (contentType === 'post') {
        await createPost({
          content: caption,
          mediaUrl,
          mediaType,
        });
      } else if (contentType === 'story') {
        await createStory({
          mediaUrl,
          mediaType,
          caption: caption || undefined,
          duration: mediaType === 'video' ? 8 : 5,
        });
      } else if (contentType === 'reel') {
        await createReel({
          videoUrl: mediaUrl,
          caption: caption || undefined,
        });
      }
      
      toast.success(`${title} shared successfully!`);
      onClose();
      
    } catch (error) {
      toast.error(`Failed to create ${contentType}: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Close if clicking outside the modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };
  
  // Reset state when modal is closed
  const handleClose = () => {
    onClose();
    // Reset after animation completes
    setTimeout(() => {
      setCaption('');
      setMediaUrl('');
      setMediaType('image');
      setStep('upload');
      setIsSubmitting(false);
    }, 300);
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-gray-900 shadow-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <button
                  className="rounded-full p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                  onClick={handleClose}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {step === 'upload' ? (
                <MediaUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  allowedTypes={allowedTypes}
                  maxSizeMB={20}
                />
              ) : (
                <div className="space-y-4">
                  {/* Caption input */}
                  <div>
                    <label
                      htmlFor="caption"
                      className="mb-2 block text-sm font-medium text-white"
                    >
                      Caption
                    </label>
                    <textarea
                      id="caption"
                      className="h-32 w-full rounded-lg bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={`Write a caption for your ${contentType}...`}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                  </div>
                  
                  {/* Media preview */}
                  <div className="overflow-hidden rounded-lg">
                    {mediaType === 'image' && (
                      <div className="relative aspect-video w-full">
                        <img
                          src={mediaUrl}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    
                    {mediaType === 'video' && (
                      <div className="relative aspect-video w-full">
                        <video
                          src={mediaUrl}
                          className="h-full w-full object-cover"
                          controls
                          muted
                          autoPlay
                          loop
                        />
                      </div>
                    )}
                    
                    {mediaType === '3d' && (
                      <div className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-4">
                        <FaCube className="h-16 w-16 text-indigo-500" />
                        <p className="ml-4 text-lg font-medium text-white">
                          3D content ready
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-800 bg-gray-900 p-4">
              {step === 'upload' ? (
                <p className="text-center text-sm text-gray-400">
                  Upload your content to continue
                </p>
              ) : (
                <div className="flex justify-between">
                  <button
                    className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                    onClick={() => setStep('upload')}
                    disabled={isSubmitting}
                  >
                    Back
                  </button>
                  
                  <button
                    className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-800 disabled:opacity-70"
                    onClick={handleSubmit}
                    disabled={isSubmitting || isPostLoading || isStoryLoading || isReelLoading}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      ctaText
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
