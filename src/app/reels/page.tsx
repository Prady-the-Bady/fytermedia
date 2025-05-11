'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useGesture } from '@use-gesture/react';
import { FaHeart, FaComment, FaShare, FaMusic, FaBookmark, FaPlay, FaPause, FaVolumeMute, FaVolumeUp, FaSpinner } from 'react-icons/fa';
import MainNav from '@/components/layout/MainNav';
import ReputationScore from '@/components/ui/ReputationScore';
import { useReels, useLikeReel } from '@/hooks/api';
import { toast } from 'react-hot-toast';

// Define the reel interface
interface Reel {
  id: string;
  videoUrl: string;
  caption?: string;
  soundName?: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
    reputationScore: number;
    isFollowing: boolean;
  };
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

// Floating comment component
function CommentOverlay({ isOpen, onClose, reelId }: { isOpen: boolean; onClose: () => void; reelId: string }) {
  const [comments, setComments] = useState([
    { id: '1', user: { name: 'Alex Ray', username: 'alexray', image: '/placeholders/user.png' }, content: 'This is amazing! How did you create this effect?', createdAt: new Date(Date.now() - 1000 * 60 * 30), likes: 24 },
    { id: '2', user: { name: 'Jordan Kim', username: 'jkim', image: '/placeholders/user.png' }, content: 'Love the colors and the transition! 🔥', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), likes: 17 },
    { id: '3', user: { name: 'Taylor Nova', username: 'tnova', image: '/placeholders/user.png' }, content: 'Definitely going to try this technique in my next project!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), likes: 9 },
  ]);
  const [newComment, setNewComment] = useState('');
  
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    const comment = {
      id: `new-${Date.now()}`,
      user: { name: 'Current User', username: 'currentuser', image: '/placeholders/user.png' },
      content: newComment,
      createdAt: new Date(),
      likes: 0
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="h-[80vh] w-full bg-gradient-to-t from-gray-900 to-gray-900/90 sm:m-auto sm:h-auto sm:max-w-lg sm:rounded-xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <h3 className="text-lg font-medium text-white">Comments</h3>
              <button className="text-gray-400" onClick={onClose}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="h-[calc(80vh-8rem)] max-h-[500px] overflow-y-auto p-4 sm:h-[400px]">
              {comments.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <motion.div 
                      key={comment.id}
                      className="flex space-x-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                        <Image 
                          src={comment.user.image} 
                          alt={comment.user.name} 
                          width={40} 
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="rounded-2xl bg-gray-800 p-3">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-white">{comment.user.name}</span>
                            <span className="text-xs text-indigo-400">@{comment.user.username}</span>
                          </div>
                          <p className="mt-1 text-gray-300">{comment.content}</p>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 pl-2 text-xs text-gray-500">
                          <span>{new Date(comment.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <button className="flex items-center space-x-1">
                            <FaHeart className="h-3 w-3" />
                            <span>{comment.likes}</span>
                          </button>
                          <button>Reply</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-800 p-4">
              <form onSubmit={handleSubmitComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 rounded-full bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="rounded-full bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
                  disabled={!newComment.trim()}
                >
                  Post
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Individual reel component
function ReelPlayer({ 
  reel, 
  isActive, 
  isNext,
  onLike, 
  onShowComments 
}: { 
  reel: Reel; 
  isActive: boolean;
  isNext: boolean;
  onLike: () => void; 
  onShowComments: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Handle playback when reel becomes active
  useEffect(() => {
    if (isActive) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(e => console.error('Playback failed:', e));
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
    
    // Preload next video
    if (isNext && videoRef.current) {
      videoRef.current.load();
    }
  }, [isActive, isNext]);
  
  // Update progress bar
  useEffect(() => {
    if (!videoRef.current || !isActive) return;
    
    const updateProgress = () => {
      if (videoRef.current) {
        const { currentTime, duration } = videoRef.current;
        setProgress((currentTime / duration) * 100);
      }
    };
    
    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, [isActive]);
  
  // Toggle play/pause
  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Toggle mute
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="h-full w-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        onClick={togglePlayback}
      />
      
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div 
          className="h-full bg-indigo-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Play/pause overlay - only visible on tap or when paused */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="rounded-full bg-white/20 p-6 backdrop-blur-sm"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={togglePlayback}
            >
              <FaPlay className="h-8 w-8 text-white" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex items-center space-x-3">
        <button 
          className="rounded-full bg-black/40 p-2 backdrop-blur-sm"
          onClick={togglePlayback}
        >
          {isPlaying ? <FaPause className="h-5 w-5 text-white" /> : <FaPlay className="h-5 w-5 text-white" />}
        </button>
        
        <button 
          className="rounded-full bg-black/40 p-2 backdrop-blur-sm"
          onClick={toggleMute}
        >
          {isMuted ? <FaVolumeMute className="h-5 w-5 text-white" /> : <FaVolumeUp className="h-5 w-5 text-white" />}
        </button>
      </div>
      
      {/* User info */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                <Image
                  src={reel.user.image}
                  alt={reel.user.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-medium text-white">{reel.user.name}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-300">@{reel.user.username}</p>
                  <ReputationScore score={reel.user.reputationScore} userId={reel.user.id} size="sm" />
                </div>
              </div>
            </div>
            
            {reel.caption && (
              <p className="mt-2 max-w-[70%] text-sm text-white">{reel.caption}</p>
            )}
            
            {reel.soundName && (
              <div className="mt-2 flex items-center space-x-2">
                <FaMusic className="h-4 w-4 animate-spin text-white" style={{ animationDuration: '3s' }} />
                <p className="text-sm text-white">{reel.soundName}</p>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col space-y-4">
            <motion.button
              className="flex flex-col items-center"
              onClick={onLike}
              whileTap={{ scale: 1.2 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                <FaHeart className={`h-6 w-6 ${reel.liked ? 'text-red-500' : 'text-white'}`} />
              </div>
              <span className="mt-1 text-sm font-medium text-white">{reel.likes}</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center"
              onClick={onShowComments}
              whileTap={{ scale: 1.2 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                <FaComment className="h-6 w-6 text-white" />
              </div>
              <span className="mt-1 text-sm font-medium text-white">{reel.comments}</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center"
              whileTap={{ scale: 1.2 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                <FaShare className="h-6 w-6 text-white" />
              </div>
              <span className="mt-1 text-sm font-medium text-white">{reel.shares}</span>
            </motion.button>
            
            <motion.button
              className="flex flex-col items-center"
              whileTap={{ scale: 1.2 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                <FaBookmark className="h-6 w-6 text-white" />
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import the API hook Reel type to avoid conflicts
import type { Reel as ApiReel } from '@/hooks/api';

// Main reels page component
export default function ReelsPage() {
  const { data: session } = useSession();
  const { reels, isLoading, error, loadMore, hasMore, isFetchingMore } = useReels(4);
  const { likeReel, isLoading: isLiking } = useLikeReel();
  
  // Use static reels as fallback when API data is loading or empty
  const [staticReels, setStaticReels] = useState<Reel[]>([
    {
      id: '1',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-water-surface-from-a-swimmers-perspective-1179-large.mp4',
      caption: 'Exploring the depths and discovering new perspectives. #3DArt #DigitalCreation',
      soundName: 'Ambient Dreams - Riley Cooper',
      user: {
        id: 'user1',
        name: 'Alex Johnson',
        username: 'alexj',
        image: '/placeholders/user.png',
        reputationScore: 87,
        isFollowing: false
      },
      likes: 1247,
      comments: 89,
      shares: 45,
      liked: false
    },
    {
      id: '2',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
      caption: 'Created this holographic effect using the new MindCast feature. Thoughts become visuals!',
      soundName: 'Neural Waves - TechAudio',
      user: {
        id: 'user2',
        name: 'Maya Patel',
        username: 'mayap',
        image: '/placeholders/user.png',
        reputationScore: 93,
        isFollowing: true
      },
      likes: 5832,
      comments: 326,
      shares: 214,
      liked: true
    },
    {
      id: '3',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
      caption: 'This is what happens when you combine 3D modeling with AI generation. The future is now!',
      soundName: 'Cosmic Dreams - Stellar Sound',
      user: {
        id: 'user3',
        name: 'Jordan Ray',
        username: 'jray',
        image: '/placeholders/user.png',
        reputationScore: 79,
        isFollowing: false
      },
      likes: 3104,
      comments: 172,
      shares: 98,
      liked: false
    },
    {
      id: '4',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-closeup-of-a-hand-holding-a-pen-and-tablet-40831-large.mp4',
      caption: 'Working on a new AR interface project. The gestures will feel so natural!',
      soundName: 'Digital Future - TechWave',
      user: {
        id: 'user4',
        name: 'Robin Zhang',
        username: 'robinz',
        image: '/placeholders/user.png',
        reputationScore: 91,
        isFollowing: true
      },
      likes: 2789,
      comments: 156,
      shares: 78,
      liked: true
    }
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  
  // Combine API reels with static reels if needed
  // Ensure type compatibility by using a type assertion
  const displayReels = (isLoading || reels.length === 0 ? staticReels : reels) as Reel[];
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Setup gesture handler for vertical swiping
  useGesture(
    {
      onDrag: ({ movement: [_x, my], direction: [_dx, dy], down, cancel }) => {
        // Vertical swipe detection
        if (!down) {
          // User finished swiping
          if (dy > 0 && my > 70) {
            // Swiped down, show previous reel
            if (currentIndex > 0) {
              setCurrentIndex(currentIndex - 1);
            }
          } else if (dy < 0 && my < -70) {
            // Swiped up, show next reel
            if (currentIndex < reels.length - 1) {
              setCurrentIndex(currentIndex + 1);
            }
          }
        }
      }
    },
    {
      target: containerRef,
      drag: {
        filterTaps: true,
        threshold: 10,
      }
    }
  );
  
  // Type guard to check if a reel has a reputationScore property
  const isApiReel = (reel: any): reel is Reel => {
    return reel && typeof reel.id === 'string' && typeof reel.user === 'object';
  };
  
  // Handle like/unlike
  const handleLike = (reelId: string) => {
    if (isLoading || isLiking) return;
    
    // If we're using real API data, call the likeReel endpoint
    if (!isLoading && reels.length > 0) {
      likeReel({ reelId });
    } else {
      // For demo static data
      setStaticReels(prev => 
        prev.map(reel => 
          reel.id === reelId
            ? { 
                ...reel, 
                liked: !reel.liked,
                likes: reel.liked ? reel.likes - 1 : reel.likes + 1
              }
            : reel
        )
      );
    }
  };
  
  // Show comments for a specific reel
  const handleShowComments = (reelId: string) => {
    setActiveReelId(reelId);
    setShowComments(true);
  };

  return (
    <div className="relative min-h-screen bg-black text-white">
      <MainNav />
      
      <div className="sm:pl-64">
        <div 
          ref={containerRef} 
          className="h-[calc(100vh-4rem)] w-full touch-none sm:h-screen" 
          key="reel-container"
        >
          {/* Reels container - only render current, prev, and next for performance */}
          <div className="relative h-full w-full">
            {displayReels.map((reel, index) => {
              // Only render current, previous and next reels for performance
              if (Math.abs(index - currentIndex) > 1) return null;
              
              const isActive = index === currentIndex;
              const isNext = index === currentIndex + 1;
              
              return (
                <motion.div
                  key={reel.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0,
                    y: isActive ? 0 : index < currentIndex ? '-100%' : '100%'
                  }}
                  transition={{ 
                    type: 'spring', 
                    damping: 30, 
                    stiffness: 300,
                    opacity: { duration: 0.2 }
                  }}
                >
                  <ReelPlayer
                    reel={reel}
                    isActive={isActive}
                    isNext={isNext}
                    onLike={() => handleLike(reel.id)}
                    onShowComments={() => handleShowComments(reel.id)}
                  />
                </motion.div>
              );
            })}
            
            {/* Navigation hints */}
            <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col items-center space-y-2">
              {currentIndex > 0 && (
                <div className="text-xs text-white/70">
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>Swipe down</span>
                </div>
              )}
            </div>
            
            <div className="absolute bottom-20 left-4 flex flex-col items-center space-y-2">
              {currentIndex < displayReels.length - 1 && (
                <div className="text-xs text-white/70">
                  <span>Swipe up</span>
                  <svg className="h-6 w-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
              
              {/* Load more button when at the end of the list and more is available */}
              {currentIndex === displayReels.length - 1 && hasMore && !isLoading && (
                <button 
                  className="mt-4 rounded-full bg-indigo-600 px-3 py-1 text-xs text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadMore();
                  }}
                  disabled={isFetchingMore}
                >
                  {isFetchingMore ? (
                    <FaSpinner className="h-3 w-3 animate-spin" />
                  ) : (
                    'Load more'
                  )}
                </button>
              )}
            </div>
            
            {/* Reel counter */}
            <div className="absolute right-4 top-4 rounded-full bg-black/40 px-2 py-1 text-xs text-white backdrop-blur-sm">
              {currentIndex + 1} / {displayReels.length}
            </div>
            
            {/* Loading indicator for infinite scroll */}
            {isFetchingMore && hasMore && (
              <div className="absolute bottom-20 right-4 rounded-full bg-black/40 p-2 backdrop-blur-sm">
                <FaSpinner className="h-5 w-5 animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-lg bg-gray-900 p-6 shadow-xl">
            <FaSpinner className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-4 text-center text-white">Loading reels...</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-red-500/10 p-4 text-center text-red-500">
          <p>Error loading reels: {error}</p>
          <button 
            className="mt-2 rounded-lg bg-red-500 px-4 py-2 text-white"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Comments overlay */}
      <CommentOverlay
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        reelId={activeReelId || ''}
      />
    </div>
  );
}
