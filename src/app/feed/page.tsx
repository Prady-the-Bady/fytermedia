'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import { api } from '@/lib/trpc/client';

import MainNav from '@/components/layout/MainNav';
import { Suspense } from 'react';

// Lazy load 3D components to improve initial load performance
const FeedCard3D = dynamic(() => import('@/components/3d/FeedCard3D'), {
  loading: () => <FeedCardSkeleton />,
  ssr: false,
});

const ProfileCard3D = dynamic(() => import('@/components/3d/ProfileCard3D'), {
  loading: () => <ProfileCardSkeleton />,
  ssr: false,
});

// Loading skeleton for posts
function FeedCardSkeleton() {
  return (
    <div className="my-6 overflow-hidden rounded-xl bg-gradient-to-b from-gray-900/80 to-black/90 backdrop-blur-lg">
      <div className="animate-pulse">
        <div className="flex items-center p-4">
          <div className="h-10 w-10 rounded-full bg-gray-700"></div>
          <div className="ml-2 space-y-1">
            <div className="h-4 w-32 rounded bg-gray-700"></div>
            <div className="h-3 w-24 rounded bg-gray-700"></div>
          </div>
        </div>
        <div className="aspect-[4/3] w-full bg-gray-800"></div>
        <div className="p-4">
          <div className="flex justify-between">
            <div className="space-x-6">
              <span className="inline-block h-5 w-16 rounded bg-gray-700"></span>
              <span className="inline-block h-5 w-16 rounded bg-gray-700"></span>
            </div>
            <span className="inline-block h-5 w-8 rounded bg-gray-700"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton for profile cards
function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-gray-900/40 via-black/70 to-gray-900/40 p-4 backdrop-blur-lg">
      <div className="animate-pulse">
        <div className="mx-auto h-40 w-40 rounded-full bg-gray-800"></div>
        <div className="mt-4 flex flex-col items-center">
          <div className="h-6 w-36 rounded bg-gray-700"></div>
          <div className="mt-2 h-4 w-24 rounded bg-gray-700"></div>
          <div className="mt-2 h-4 w-full rounded bg-gray-700"></div>
          <div className="mt-4 grid w-full grid-cols-3 gap-2">
            <div className="h-14 rounded bg-gray-800"></div>
            <div className="h-14 rounded bg-gray-800"></div>
            <div className="h-14 rounded bg-gray-800"></div>
          </div>
          <div className="mt-4 h-10 w-full rounded bg-gray-700"></div>
        </div>
      </div>
    </div>
  );
}

// AI Assistant component with morphing UI
function AIAssistant() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Discover trending posts",
    "Find new people to follow",
    "Create a 3D post",
    "Summarize your feed"
  ]);

  return (
    <motion.div
      className={`fixed bottom-20 right-6 z-30 rounded-2xl bg-black/20 p-4 backdrop-blur-lg sm:bottom-6 ${
        isExpanded ? 'w-80' : 'w-12'
      }`}
      animate={{ width: isExpanded ? 320 : 48 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isExpanded ? 1 : 0 }}
          className="text-lg font-semibold text-white"
        >
          AI Assistant
        </motion.div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg"
        >
          {isExpanded ? "×" : "AI"}
        </button>
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 space-y-3"
        >
          <p className="text-sm text-gray-300">What would you like to do?</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                className="w-full rounded-lg bg-gray-800/50 px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-700/50"
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Story viewer component with 3D transitions
function StoryViewer() {
  const [activeStories, setActiveStories] = useState([
    { id: '1', user: { name: 'Alex Smith', username: 'alex', image: '/placeholders/user.png' } },
    { id: '2', user: { name: 'Jamie Lee', username: 'jamiel', image: '/placeholders/user.png' } },
    { id: '3', user: { name: 'Chris Wong', username: 'wongc', image: '/placeholders/user.png' } },
    { id: '4', user: { name: 'Taylor Kim', username: 'tkim', image: '/placeholders/user.png' } },
    { id: '5', user: { name: 'Jordan Ray', username: 'jray', image: '/placeholders/user.png' } },
  ]);

  return (
    <div className="hide-scrollbar flex space-x-4 overflow-x-auto p-4">
      {activeStories.map((story, index) => (
        <motion.div
          key={story.id}
          className="flex flex-shrink-0 flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <div className="group relative h-16 w-16 cursor-pointer rounded-full p-1 sm:h-20 sm:w-20">
            <div className="absolute inset-0 animate-spin-slow rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 opacity-75 blur-sm group-hover:animate-spin-slow-reverse group-hover:opacity-100"></div>
            <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500"></div>
            <div className="absolute inset-1 overflow-hidden rounded-full bg-black">
              <img 
                src={story.user.image} 
                alt={story.user.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <span className="mt-2 text-xs text-gray-300 sm:text-sm">{story.user.name.split(' ')[0]}</span>
        </motion.div>
      ))}
    </div>
  );
}

// 3D floating orbs background component
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute top-1/4 left-1/4 h-32 w-32 rounded-full bg-indigo-500 opacity-10 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-3/4 right-1/4 h-48 w-48 rounded-full bg-purple-500 opacity-10 blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-3/4 h-40 w-40 rounded-full bg-blue-500 opacity-10 blur-3xl"
        animate={{
          x: [0, -50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Mood-based UI theme component that changes based on feed content
function MoodMirror() {
  const moodColors = {
    happy: "from-yellow-500/30 via-orange-500/20 to-red-500/30",
    calm: "from-blue-500/30 via-cyan-500/20 to-teal-500/30",
    energetic: "from-pink-500/30 via-purple-500/20 to-indigo-500/30",
    creative: "from-green-500/30 via-emerald-500/20 to-teal-500/30",
  };

  // This would normally be determined by analyzing feed content
  const [currentMood, setCurrentMood] = useState<keyof typeof moodColors>("calm");

  useEffect(() => {
    // Simulate mood changes based on time
    const moodInterval = setInterval(() => {
      const moods = Object.keys(moodColors) as Array<keyof typeof moodColors>;
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      setCurrentMood(randomMood);
    }, 30000); // Change every 30 seconds for demo

    return () => clearInterval(moodInterval);
  }, []);

  return (
    <div className="fixed inset-0 -z-20">
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${moodColors[currentMood]} opacity-30`}
        animate={{ opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function FeedPage() {
  // Refs for the scrollable container and scroll tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  
  // Parallax effect values
  const headerY = useTransform(scrollY, [0, 300], [0, -50]);
  const opacityRange = useTransform(scrollY, [0, 100], [1, 0]);
  
  // State for feed data and loading
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // For infinite scroll functionality
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });
  
  // Mock feed data (would come from API in a real app)
  const [feedPosts, setFeedPosts] = useState<any[]>([
    {
      id: '1',
      caption: 'Just created this amazing 3D artwork! What do you think?',
      contentUrl: '/placeholders/post1.jpg',
      contentType: 'image',
      createdAt: new Date().toISOString(),
      user: {
        id: '1',
        name: 'Alex Smith',
        username: 'alex',
        image: '/placeholders/user.png',
      },
      isLiked: false,
      _count: {
        likes: 42,
        comments: 12,
      },
    },
    {
      id: '2',
      caption: 'Exploring new technologies for our upcoming project. The future is now!',
      contentUrl: '/placeholders/post2.jpg',
      contentType: 'image',
      createdAt: new Date().toISOString(),
      user: {
        id: '2',
        name: 'Jamie Lee',
        username: 'jamiel',
        image: '/placeholders/user.png',
      },
      isLiked: true,
      _count: {
        likes: 89,
        comments: 24,
      },
    },
    {
      id: '3',
      caption: 'This is why I love AR interfaces - the blend between digital and physical is incredible.',
      contentType: '3d',
      createdAt: new Date().toISOString(),
      user: {
        id: '3',
        name: 'Chris Wong',
        username: 'wongc',
        image: '/placeholders/user.png',
      },
      isLiked: false,
      _count: {
        likes: 156,
        comments: 37,
      },
    },
  ]);

  // Mock suggested users
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([
    {
      id: '4',
      name: 'Taylor Kim',
      username: 'tkim',
      image: '/placeholders/user.png',
      bio: 'Digital artist and UI designer',
      isFollowing: false,
      _count: {
        followers: 1289,
        following: 352,
        posts: 47,
      },
    },
    {
      id: '5',
      name: 'Jordan Ray',
      username: 'jray',
      image: '/placeholders/user.png',
      bio: '3D modeling enthusiast & animation expert',
      isFollowing: false,
      _count: {
        followers: 4521,
        following: 231,
        posts: 86,
      },
    },
  ]);

  // Mock function to simulate loading more posts
  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add more mock posts
    const newPosts = [
      {
        id: `new-${Date.now()}`,
        caption: 'Just discovered this incredible new technology!',
        contentUrl: '/placeholders/post3.jpg',
        contentType: 'image',
        createdAt: new Date().toISOString(),
        user: suggestedUsers[Math.floor(Math.random() * suggestedUsers.length)],
        isLiked: false,
        _count: {
          likes: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 50),
        },
      },
    ];
    
    setFeedPosts(prev => [...prev, ...newPosts]);
    setLoadingMore(false);
    
    // Stop loading after certain number of posts for this demo
    if (feedPosts.length > 10) {
      setHasMore(false);
    }
  };

  // Handle like/unlike post
  const handlePostLike = (postId: string) => {
    setFeedPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, _count: { ...post._count, likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1 } }
          : post
      )
    );
  };

  // Handle follow/unfollow user
  const handleFollow = (userId: string) => {
    setSuggestedUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, isFollowing: !user.isFollowing, _count: { ...user._count, followers: user.isFollowing ? user._count.followers - 1 : user._count.followers + 1 } }
          : user
      )
    );
  };

  // Load more posts when bottom of feed is visible
  useEffect(() => {
    if (inView) {
      loadMorePosts();
    }
  }, [inView]);

  return (
    <div className="relative min-h-screen bg-black text-white">
      <MainNav />
      
      {/* Animated backgrounds */}
      <FloatingOrbs />
      <MoodMirror />
      
      <div className="sm:pl-64">
        {/* Header with parallax effect */}
        <motion.div
          className="sticky top-0 z-20 bg-black/80 backdrop-blur-lg"
          style={{ y: headerY }}
        >
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Feed
              </span>
            </h1>
            
            <motion.div className="relative">
              <button className="rounded-full bg-gray-800 p-2 hover:bg-gray-700">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </motion.div>
          </div>
          
          {/* Story viewer - visible on small/medium scroll position */}
          <motion.div style={{ opacity: opacityRange }}>
            <StoryViewer />
          </motion.div>
        </motion.div>
        
        {/* Main content area with feed and sidebar */}
        <div className="relative pt-4">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main feed column */}
              <div className="lg:col-span-2">
                <div ref={containerRef} className="hide-scrollbar space-y-1 overflow-y-auto pb-20">
                  {/* Feed posts */}
                  {feedPosts.map((post) => (
                    <Suspense key={post.id} fallback={<FeedCardSkeleton />}>
                      <FeedCard3D
                        post={post}
                        onLike={handlePostLike}
                        onComment={() => {}}
                        onShare={() => {}}
                      />
                    </Suspense>
                  ))}
                  
                  {/* Load more trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="py-8 text-center">
                      {loadingMore ? (
                        <div className="flex justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Scroll for more</p>
                      )}
                    </div>
                  )}
                  
                  {/* End of feed message */}
                  {!hasMore && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-gray-400">You've reached the end of your feed</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Sidebar column (only visible on larger screens) */}
              <div className="hidden lg:block">
                <div className="sticky top-20 space-y-6">
                  {/* User profile overview */}
                  <div className="rounded-xl bg-gray-900/30 p-4 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold">Profile Overview</h3>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-700">
                        {/* User avatar would go here */}
                      </div>
                      <div>
                        <p className="font-medium">Current User</p>
                        <p className="text-sm text-gray-400">@username</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 divide-x divide-gray-800 text-center">
                      <div className="px-2">
                        <p className="text-lg font-semibold">0</p>
                        <p className="text-xs text-gray-400">Posts</p>
                      </div>
                      <div className="px-2">
                        <p className="text-lg font-semibold">0</p>
                        <p className="text-xs text-gray-400">Followers</p>
                      </div>
                      <div className="px-2">
                        <p className="text-lg font-semibold">0</p>
                        <p className="text-xs text-gray-400">Following</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Suggested users */}
                  <div className="rounded-xl bg-gray-900/30 p-4 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold">Suggested for You</h3>
                    <div className="space-y-4">
                      {suggestedUsers.map((user) => (
                        <Suspense key={user.id} fallback={<ProfileCardSkeleton />}>
                          <ProfileCard3D
                            user={user}
                            onFollow={handleFollow}
                          />
                        </Suspense>
                      ))}
                    </div>
                  </div>
                  
                  {/* Trending topics */}
                  <div className="rounded-xl bg-gray-900/30 p-4 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold">Trending Topics</h3>
                    <div className="space-y-3">
                      {['#ArtificialIntelligence', '#3DDesign', '#FutureTech', '#DigitalArt', '#VR'].map((tag) => (
                        <motion.div
                          key={tag}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-800/40"
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-sm font-medium text-indigo-400">{tag}</span>
                          <span className="text-xs text-gray-500">{Math.floor(Math.random() * 10000)} posts</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
