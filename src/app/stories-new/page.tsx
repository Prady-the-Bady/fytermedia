'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { FaCamera, FaHeart, FaComment, FaShare, FaPlus, FaTimes } from 'react-icons/fa';
import MainNav from '@/components/layout/MainNav';
import ReputationScore from '@/components/ui/ReputationScore';

// Define story interface
interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
    reputationScore: number;
  };
  items: StoryItem[];
  viewed: boolean;
  createdAt: Date;
}

interface StoryItem {
  id: string;
  type: 'image' | 'video' | '3d';
  url: string;
  caption?: string;
  createdAt: Date;
  duration: number; // duration in seconds
}

// Story creation component
function StoryCreator({ onClose }: { onClose: () => void }) {
  const [captureMode, setCaptureMode] = useState<'image' | 'video' | '3d'>('image');
  const [caption, setCaption] = useState('');
  
  return (
    <motion.div 
      className="absolute inset-0 z-20 flex flex-col bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between p-4">
        <button 
          className="rounded-full bg-gray-800 p-2 text-white"
          onClick={onClose}
        >
          <FaTimes className="h-5 w-5" />
        </button>
        
        <div className="flex space-x-4">
          <button 
            className={`rounded-full px-4 py-2 ${captureMode === 'image' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setCaptureMode('image')}
          >
            Photo
          </button>
          <button 
            className={`rounded-full px-4 py-2 ${captureMode === 'video' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setCaptureMode('video')}
          >
            Video
          </button>
          <button 
            className={`rounded-full px-4 py-2 ${captureMode === '3d' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-300'}`}
            onClick={() => setCaptureMode('3d')}
          >
            3D
          </button>
        </div>
        
        <button 
          className="rounded-full bg-indigo-600 p-2 text-white"
          onClick={() => {
            // Simulate story upload
            setTimeout(onClose, 500);
          }}
        >
          <FaShare className="h-5 w-5" />
        </button>
      </div>
      
      <div className="relative flex flex-1 items-center justify-center">
        {captureMode === 'image' && (
          <div className="h-full w-full bg-gradient-to-b from-indigo-900/30 to-fuchsia-900/30 text-center">
            <div className="flex h-full flex-col items-center justify-center">
              <FaCamera className="h-16 w-16 text-white/50" />
              <p className="mt-4 text-white/70">Tap to capture a photo</p>
            </div>
          </div>
        )}
        
        {captureMode === 'video' && (
          <div className="h-full w-full bg-gradient-to-b from-red-900/30 to-orange-900/30 text-center">
            <div className="flex h-full flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-white/50 p-1">
                <div className="h-full w-full rounded-full bg-red-500/70"></div>
              </div>
              <p className="mt-4 text-white/70">Hold to record a video</p>
            </div>
          </div>
        )}
        
        {captureMode === '3d' && (
          <div className="h-full w-full bg-gradient-to-b from-cyan-900/30 to-blue-900/30 text-center">
            <div className="flex h-full flex-col items-center justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute h-12 w-12 rotate-45 rounded-lg border-2 border-white/50 bg-transparent"></div>
                <div className="absolute top-6 left-6 h-12 w-12 rotate-45 rounded-lg border-2 border-white/50 bg-transparent"></div>
              </div>
              <p className="mt-4 text-white/70">Create a 3D object or scene</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-black p-4">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption..."
          className="w-full rounded-full bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </motion.div>
  );
}

// Story progress indicator
function StoryProgress({ 
  items, 
  currentIndex, 
  isPlaying,
  duration 
}: { 
  items: StoryItem[]; 
  currentIndex: number;
  isPlaying: boolean;
  duration: number;
}) {
  const [progress, setProgress] = useState<number[]>(items.map(() => 0));
  
  useEffect(() => {
    if (!isPlaying) return;
    
    let intervalId: NodeJS.Timeout;
    
    // Reset current item progress when changing items
    const newProgress = [...progress];
    
    // Set all previous items to 100%
    for (let i = 0; i < currentIndex; i++) {
      newProgress[i] = 100;
    }
    
    // Reset current item progress
    newProgress[currentIndex] = 0;
    
    // Reset all next items progress
    for (let i = currentIndex + 1; i < items.length; i++) {
      newProgress[i] = 0;
    }
    
    setProgress(newProgress);
    
    // Start progress for current item
    if (isPlaying) {
      const increment = 100 / (duration * 10); // 10 updates per second
      
      intervalId = setInterval(() => {
        setProgress(prev => {
          const newProgress = [...prev];
          newProgress[currentIndex] = Math.min(newProgress[currentIndex] + increment, 100);
          return newProgress;
        });
      }, 100);
    }
    
    return () => {
      clearInterval(intervalId);
    };
  }, [currentIndex, isPlaying, duration, items.length]);
  
  return (
    <div className="z-10 flex w-full space-x-1 px-2">
      {items.map((_, index) => (
        <div 
          key={index} 
          className="flex-1 rounded-full bg-white/30 backdrop-blur-sm"
          style={{ height: 3 }}
        >
          <div 
            className="h-full rounded-full bg-white"
            style={{ width: `${progress[index]}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// Story viewer component
function StoryViewer({ 
  stories, 
  initialStoryIndex, 
  initialItemIndex, 
  onClose 
}: { 
  stories: Story[]; 
  initialStoryIndex: number;
  initialItemIndex: number;
  onClose: () => void;
}) {
  const [storyIndex, setStoryIndex] = useState(initialStoryIndex);
  const [itemIndex, setItemIndex] = useState(initialItemIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showReactions, setShowReactions] = useState(false);
  
  const currentStory = stories[storyIndex];
  const currentItem = currentStory?.items[itemIndex];
  
  // Set up timer for auto-advancing stories
  useEffect(() => {
    if (!isPlaying || !currentItem) return;
    
    const timer = setTimeout(() => {
      goToNextItem();
    }, currentItem.duration * 1000);
    
    return () => clearTimeout(timer);
  }, [currentItem, isPlaying, itemIndex, storyIndex]);
  
  // Navigation functions
  const goToNextItem = () => {
    if (itemIndex < currentStory.items.length - 1) {
      setItemIndex(itemIndex + 1);
    } else {
      goToNextStory();
    }
  };
  
  const goToPrevItem = () => {
    if (itemIndex > 0) {
      setItemIndex(itemIndex - 1);
    } else {
      goToPrevStory();
    }
  };
  
  const goToNextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
      setItemIndex(0);
    } else {
      onClose();
    }
  };
  
  const goToPrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setItemIndex(stories[storyIndex - 1].items.length - 1);
    }
  };
  
  const handleDragStart = () => {
    // Pause story when user is interacting
    setIsPlaying(false);
  };
  
  const handleTap = (event: React.MouseEvent) => {
    // Handle tap navigation
    const clickX = event.clientX;
    
    if (window.innerWidth / 2 > clickX) {
      // Left side tap - go back
      goToPrevItem();
    } else {
      // Right side tap - go forward
      goToNextItem();
    }
  };
  
  // No stories available
  if (!currentStory || !currentItem) {
    return null;
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black touch-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="relative h-full w-full"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragStart={handleDragStart}
        onDragEnd={(_, info: PanInfo) => {
          // Handle horizontal drag
          if (info.offset.x < -50) {
            // Dragged left - go to next story
            goToNextStory();
          } else if (info.offset.x > 50) {
            // Dragged right - go to prev story
            goToPrevStory();
          }
          
          setIsPlaying(true);
        }}
        onClick={handleTap}
      >
        {/* Story content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${storyIndex}-${itemIndex}`}
            className="absolute inset-0 bg-gradient-to-b from-gray-900/20 to-black/40"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {currentItem.type === 'image' && (
              <Image
                src={currentItem.url}
                alt="Story"
                fill
                className="object-cover"
                priority
              />
            )}
            
            {currentItem.type === 'video' && (
              <video
                src={currentItem.url}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
                loop
              />
            )}
            
            {currentItem.type === '3d' && (
              <div className="flex h-full items-center justify-center">
                <p className="text-xl font-medium text-white">3D Content Placeholder</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        
        {/* Overlay with controls */}
        <div className="absolute inset-0">
          {/* Top bar */}
          <div className="p-4 pb-6 pt-8">
            <StoryProgress 
              items={currentStory.items} 
              currentIndex={itemIndex}
              isPlaying={isPlaying}
              duration={currentItem.duration}
            />
            
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-indigo-500">
                  <Image
                    src={currentStory.user.image}
                    alt={currentStory.user.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-white">{currentStory.user.name}</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-300">
                      {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <ReputationScore 
                      score={currentStory.user.reputationScore} 
                      userId={currentStory.user.id}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="rounded-full bg-black/40 p-2 backdrop-blur-sm"
              >
                <FaTimes className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          {/* Caption */}
          {currentItem.caption && (
            <div className="absolute bottom-28 left-0 right-0 px-4">
              <div className="rounded-xl bg-black/30 p-3 backdrop-blur-sm">
                <p className="text-center text-white">{currentItem.caption}</p>
              </div>
            </div>
          )}
          
          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Send a message..."
                className="flex-1 rounded-full bg-black/40 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setIsPlaying(false)}
              />
              
              <div className="ml-4 flex items-center space-x-3">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500"
                >
                  <FaHeart className="h-5 w-5 text-white" />
                </button>
                
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                  <FaShare className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reaction selector */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              className="absolute bottom-24 right-4 rounded-xl bg-black/60 p-2 backdrop-blur-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="grid grid-cols-5 gap-2">
                {['❤️', '😂', '😮', '😢', '🔥', '👍', '🙌', '🎉', '🤩', '💯'].map((emoji) => (
                  <button
                    key={emoji}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
                    onClick={() => setShowReactions(false)}
                  >
                    <span className="text-xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// Stories thumbnail component
function StoryThumbnail({ 
  story, 
  onOpenStory 
}: { 
  story: Story; 
  onOpenStory: () => void;
}) {
  return (
    <div className="group relative flex flex-shrink-0 flex-col items-center space-y-1 px-1">
      <div 
        className={`h-20 w-20 cursor-pointer overflow-hidden rounded-full ${
          story.viewed ? 'ring-2 ring-gray-600' : 'ring-2 ring-gradient-to-tr from-purple-600 to-pink-500'
        }`}
        onClick={onOpenStory}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="h-full w-full"
        >
          <Image
            src={story.user.image}
            alt={story.user.name}
            width={80}
            height={80}
            className={`h-full w-full object-cover transition-opacity ${
              story.viewed ? 'opacity-70' : 'opacity-100'
            }`}
          />
        </motion.div>
      </div>
      
      <p className="text-xs text-white">
        {story.user.name.split(' ')[0]}
      </p>
    </div>
  );
}

// Create story button
function CreateStoryButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex flex-shrink-0 flex-col items-center space-y-1 px-1">
      <motion.button
        className="group relative h-20 w-20 overflow-hidden rounded-full bg-gray-800 ring-2 ring-indigo-500"
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <FaPlus className="h-6 w-6 text-white" />
        </div>
      </motion.button>
      <p className="text-xs text-white">Add story</p>
    </div>
  );
}

// Main stories component
export default function StoriesPage() {
  const { data: session } = useSession();
  const [stories, setStories] = useState<Story[]>([
    {
      id: 'story1',
      user: {
        id: 'user1',
        name: 'Alex Johnson',
        username: 'alexj',
        image: '/placeholders/user.png',
        reputationScore: 87
      },
      items: [
        {
          id: 'item1',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e',
          caption: 'Exploring new dimensions with this holographic interface',
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
          duration: 5
        },
        {
          id: 'item2',
          type: 'video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-city-at-night-11748-large.mp4',
          caption: 'My new AI-powered cityscape generation',
          createdAt: new Date(Date.now() - 1000 * 60 * 28),
          duration: 8
        }
      ],
      viewed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 'story2',
      user: {
        id: 'user2',
        name: 'Maya Patel',
        username: 'mayap',
        image: '/placeholders/user.png',
        reputationScore: 93
      },
      items: [
        {
          id: 'item3',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1614729375290-3e0aeef2132c',
          createdAt: new Date(Date.now() - 1000 * 60 * 120),
          duration: 5
        }
      ],
      viewed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 120)
    },
    {
      id: 'story3',
      user: {
        id: 'user3',
        name: 'Jordan Ray',
        username: 'jray',
        image: '/placeholders/user.png',
        reputationScore: 79
      },
      items: [
        {
          id: 'item4',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca',
          caption: 'Testing the new neural interface',
          createdAt: new Date(Date.now() - 1000 * 60 * 180),
          duration: 5
        },
        {
          id: 'item5',
          type: '3d',
          url: '/3d-models/sample.glb',
          createdAt: new Date(Date.now() - 1000 * 60 * 178),
          duration: 10
        }
      ],
      viewed: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 180)
    },
    {
      id: 'story4',
      user: {
        id: 'user4',
        name: 'Robin Zhang',
        username: 'robinz',
        image: '/placeholders/user.png',
        reputationScore: 91
      },
      items: [
        {
          id: 'item6',
          type: 'video',
          url: 'https://assets.mixkit.co/videos/preview/mixkit-typing-on-smartphone-in-the-dark-8204-large.mp4',
          caption: 'Late night coding session - building something cool!',
          createdAt: new Date(Date.now() - 1000 * 60 * 300),
          duration: 8
        }
      ],
      viewed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 300)
    },
    {
      id: 'story5',
      user: {
        id: 'user5',
        name: 'Taylor Reed',
        username: 'treed',
        image: '/placeholders/user.png',
        reputationScore: 85
      },
      items: [
        {
          id: 'item7',
          type: 'image',
          url: 'https://images.unsplash.com/photo-1637940768609-e3fecc5d0a52',
          createdAt: new Date(Date.now() - 1000 * 60 * 400),
          duration: 5
        }
      ],
      viewed: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 400)
    }
  ]);
  
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showingStoryCreator, setShowingStoryCreator] = useState(false);
  
  return (
    <div className="min-h-screen bg-black text-white">
      <MainNav />
      
      <div className="sm:pl-64">
        <div className="pt-4">
          {/* Stories row */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-2 px-4">
              <CreateStoryButton onClick={() => setShowingStoryCreator(true)} />
              
              {stories.map((story, index) => (
                <StoryThumbnail 
                  key={story.id} 
                  story={story} 
                  onOpenStory={() => setActiveStoryIndex(index)}
                />
              ))}
            </div>
          </div>
          
          {/* Main content */}
          <div className="mt-4 px-4">
            <h1 className="text-xl font-bold">Stories</h1>
            <p className="text-sm text-gray-400">Share ephemeral moments with your connections</p>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <motion.div
                  key={story.id}
                  className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-gray-900 shadow-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <Image
                    src={story.items[0].url}
                    alt={story.user.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={story.user.image}
                          alt={story.user.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-white">{story.user.name}</p>
                        <p className="text-xs text-gray-300">
                          {new Date(story.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Story viewer overlay */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <StoryViewer
            stories={stories}
            initialStoryIndex={activeStoryIndex}
            initialItemIndex={0}
            onClose={() => setActiveStoryIndex(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Story creator overlay */}
      <AnimatePresence>
        {showingStoryCreator && (
          <StoryCreator onClose={() => setShowingStoryCreator(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
