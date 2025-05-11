'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Box, RoundedBox, useCursor, Environment } from '@react-three/drei';
import { FaHeart, FaComment, FaShare, FaBookmark, FaEllipsisH } from 'react-icons/fa';
import { type Post, type User } from '@prisma/client';

// Define the post type with user included
type PostWithUser = Post & {
  user: User;
  isLiked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
};

interface FeedCard3DProps {
  post: PostWithUser;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

// 3D Card component using React Three Fiber
function Card3D({ isHovered, imageUrl }: { isHovered: boolean; imageUrl: string }) {
  const { viewport } = useThree();
  const mesh = useRef<THREE.Mesh>(null);
  const textRef = useRef<any>(null);
  
  // Animate the card on hover
  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = isHovered ? Math.sin(state.clock.getElapsedTime()) * 0.1 : 0;
    mesh.current.position.z = isHovered ? Math.sin(state.clock.getElapsedTime() * 2) * 0.1 : 0;
    
    if (textRef.current) {
      textRef.current.position.z = isHovered ? 0.2 + Math.sin(state.clock.getElapsedTime() * 3) * 0.05 : 0.2;
    }
  });

  return (
    <>
      <Environment preset="city" />
      <RoundedBox
        ref={mesh}
        args={[viewport.width * 0.8, viewport.height * 0.4, 0.1]}
        radius={0.05}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#333"
          metalness={0.7}
          roughness={0.3}
          envMapIntensity={isHovered ? 1 : 0.5}
        />
      </RoundedBox>
      <Text
        ref={textRef}
        position={[0, 0, 0.2]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Interactive 3D Card
      </Text>
    </>
  );
}

export default function FeedCard3D({ post, onLike, onComment, onShare }: FeedCard3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Create spring animations for hover effect
  const { scale, rotateX, shadow } = useSpring({
    scale: isHovered ? 1.02 : 1,
    rotateX: isHovered ? 2 : 0,
    shadow: isHovered ? 20 : 8,
    config: { tension: 300, friction: 40 },
  });

  // Use framer motion variants for like animation
  const heartVariants = {
    liked: {
      scale: [1, 1.5, 1],
      color: '#ef4444',
      transition: { duration: 0.3 },
    },
    unliked: {
      scale: 1,
      color: '#a1a1aa',
      transition: { duration: 0.3 },
    },
  };

  const handleLike = () => {
    onLike(post.id);
  };

  const contentAspectRatio = post.contentType === 'image' ? 'aspect-[4/3]' : 'aspect-[16/9]';

  return (
    <animated.div
      className="my-6 overflow-hidden rounded-xl"
      style={{
        transform: isHovered ? scale.to((s) => `scale(${s})`) : 'scale(1)',
        boxShadow: shadow.to((s) => `0 ${s}px ${s * 2}px rgba(0, 0, 0, 0.2)`),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className="relative bg-gradient-to-b from-gray-900/80 to-black/90 backdrop-blur-lg"
        layoutId={`post-${post.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        {/* User info header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={post.user?.image || '/placeholders/user.png'}
                alt={post.user?.name || 'User'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium text-white">{post.user?.name}</h3>
              <p className="text-xs text-gray-400">@{post.user?.username}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-white">
            <FaEllipsisH />
          </button>
        </div>

        {/* Post caption */}
        {post.caption && (
          <div className="px-4 pb-3">
            <p className="text-sm text-gray-200">{post.caption}</p>
          </div>
        )}

        {/* Post content */}
        <div className={`w-full ${contentAspectRatio} bg-gray-800`}>
          {post.contentType === 'image' && post.contentUrl && (
            <Image
              src={post.contentUrl}
              alt="Post content"
              fill
              className="object-cover"
            />
          )}
          
          {post.contentType === 'video' && post.contentUrl && (
            <video
              src={post.contentUrl}
              controls
              className="h-full w-full object-cover"
            />
          )}
          
          {post.contentType === '3d' && (
            <div className="relative h-full w-full">
              <Canvas camera={{ position: [0, 0, 3], fov: 30 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Card3D isHovered={isHovered} imageUrl={post.contentUrl || ''} />
              </Canvas>
            </div>
          )}
          
          {post.contentType === 'text' && (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 p-6">
              <p className="text-center text-xl font-bold text-white">{post.caption}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between p-4">
          <div className="flex space-x-6">
            <motion.button 
              onClick={handleLike}
              className="flex items-center space-x-1"
              variants={heartVariants}
              animate={post.isLiked ? 'liked' : 'unliked'}
            >
              <FaHeart className={post.isLiked ? 'text-red-500' : 'text-gray-400'} />
              <span className="text-sm text-gray-300">{post._count.likes}</span>
            </motion.button>
            
            <button 
              onClick={() => onComment(post.id)}
              className="flex items-center space-x-1 text-gray-400 hover:text-gray-200"
            >
              <FaComment />
              <span className="text-sm text-gray-300">{post._count.comments}</span>
            </button>
            
            <button 
              onClick={() => onShare(post.id)}
              className="text-gray-400 hover:text-gray-200"
            >
              <FaShare />
            </button>
          </div>
          
          <button className="text-gray-400 hover:text-gray-200">
            <FaBookmark />
          </button>
        </div>
        
        {/* Show more details button */}
        <div className="p-2 text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            {showDetails ? 'Show less' : 'Show more details'}
          </button>
        </div>
        
        {/* Details section */}
        {showDetails && (
          <motion.div
            className="border-t border-gray-800 p-4"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <p className="text-xs text-gray-400">Posted on {new Date(post.createdAt).toLocaleDateString()}</p>
            {post.tags && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.tags.map((tag: any) => (
                  <span key={tag.id} className="rounded-full bg-gray-800 px-2 py-1 text-xs text-gray-300">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </animated.div>
  );
}
