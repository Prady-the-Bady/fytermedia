'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment, useTexture, MeshDistortMaterial } from '@react-three/drei';
import { User } from '@prisma/client';
import { FaUserPlus, FaCheck } from 'react-icons/fa';

// 3D Avatar component
function Avatar3D({ imageUrl, isHovered }: { imageUrl: string; isHovered: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  
  // Load the user avatar as a texture
  const texture = useTexture(imageUrl || '/placeholders/user.png');
  
  // Animate the avatar on hover
  useFrame((state) => {
    if (!mesh.current) return;
    
    mesh.current.rotation.y = isHovered 
      ? mesh.current.rotation.y + 0.01 
      : state.clock.getElapsedTime() * 0.1;
      
    if (isHovered) {
      mesh.current.scale.set(1.1, 1.1, 1.1);
    } else {
      mesh.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime()) * 0.05);
    }
  });

  return (
    <>
      <Environment preset="studio" />
      <mesh ref={mesh} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          map={texture}
          distort={isHovered ? 0.2 : 0.1}
          speed={isHovered ? 2 : 1}
          color="white"
          metalness={0.2}
          roughness={0.7}
        />
      </mesh>
    </>
  );
}

interface ProfileCard3DProps {
  user: User & {
    _count?: {
      followers: number;
      following: number;
      posts: number;
    };
    isFollowing?: boolean;
  };
  onFollow?: (userId: string) => void;
}

export default function ProfileCard3D({ user, onFollow }: ProfileCard3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // For the tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseY, [-100, 100], [10, -10]);
  const rotateY = useTransform(mouseX, [-100, 100], [-10, 10]);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      className="flex flex-col overflow-hidden rounded-2xl"
      style={{
        rotateX,
        rotateY,
        perspective: 1000,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Holographic card */}
      <div className="relative transform-gpu overflow-hidden bg-gradient-to-br from-gray-900/40 via-black/70 to-gray-900/40 p-4 backdrop-blur-lg transition-all duration-300 hover:from-indigo-900/20 hover:to-purple-900/20">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-pink-500/10 opacity-50" />
          <motion.div
            className="absolute -top-40 -left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-40 -right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"
            animate={{
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="flex flex-col items-center justify-center">
          {/* 3D Avatar container */}
          <div className="relative h-40 w-40">
            <Canvas camera={{ position: [0, 0, 3], fov: 30 }}>
              <Avatar3D imageUrl={user.image || '/placeholders/user.png'} isHovered={isHovered} />
            </Canvas>
          </div>
          
          {/* User info */}
          <div className="mt-4 text-center">
            <h3 className="text-xl font-semibold text-white">{user.name}</h3>
            <Link href={`/profile/${user.username}`} className="text-sm text-indigo-400 hover:text-indigo-300">
              @{user.username}
            </Link>
            
            {user.bio && (
              <p className="mt-2 text-sm text-gray-300">{user.bio}</p>
            )}
            
            {/* Stats */}
            {user._count && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{user._count.posts}</div>
                  <div className="text-xs text-gray-400">Posts</div>
                </div>
                <div className="rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{user._count.followers}</div>
                  <div className="text-xs text-gray-400">Followers</div>
                </div>
                <div className="rounded-lg p-2">
                  <div className="text-lg font-bold text-white">{user._count.following}</div>
                  <div className="text-xs text-gray-400">Following</div>
                </div>
              </div>
            )}
            
            {/* Follow button */}
            {onFollow && user.id !== 'currentUserId' && (
              <motion.button
                className={`mt-4 flex w-full items-center justify-center space-x-2 rounded-lg py-2 px-4 font-medium ${
                  user.isFollowing
                    ? 'bg-gray-800 text-gray-200'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                }`}
                onClick={() => onFollow(user.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {user.isFollowing ? (
                  <>
                    <FaCheck className="h-4 w-4" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <FaUserPlus className="h-4 w-4" />
                    <span>Follow</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
