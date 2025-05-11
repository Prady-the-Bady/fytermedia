'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { FaImage, FaVideo, FaFont, FaCube, FaVolumeUp, FaExpand, FaCompress, FaPlay, FaPause } from 'react-icons/fa';
import { BsMusicNoteBeamed } from 'react-icons/bs';

type ContentType = 'image' | 'video' | 'text' | '3d' | 'audio';

interface PostContent {
  type: ContentType;
  data: {
    url?: string;
    text?: string;
    modelUrl?: string;
    audioUrl?: string;
    audioVisualizer?: boolean;
    caption?: string;
  };
}

interface MorphingPostProps {
  contents: PostContent[];
  userId: string;
  userName: string;
  userImage: string;
  initialType?: ContentType;
  className?: string;
}

// 3D model loader component for Three.js
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const { camera } = useThree();
  
  // Position camera better for viewing models
  useEffect(() => {
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  // Rotate model slowly
  useFrame((state) => {
    scene.rotation.y += 0.005;
  });
  
  // Clone the scene to prevent issues with concurrent use
  return <primitive object={scene.clone()} dispose={null} />;
}

// Audio visualizer component
function AudioVisualizer({ audioUrl }: { audioUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;
    
    // Initialize audio context and analyzer
    const initializeAudio = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      const source = audioContext.createMediaElementSource(audioRef.current!);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    };
    
    // Draw visualization
    const draw = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      // Request next animation frame
      const animationId = requestAnimationFrame(draw);
      
      // Reset canvas
      ctx.clearRect(0, 0, width, height);
      
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      
      // Calculate bar width based on canvas size and data length
      const barWidth = width / dataArrayRef.current.length;
      let barHeight;
      let x = 0;
      
      // Draw bars
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = dataArrayRef.current[i] / 255 * height;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#4F46E5'); // indigo
        gradient.addColorStop(0.5, '#8B5CF6'); // purple
        gradient.addColorStop(1, '#EC4899'); // pink
        
        ctx.fillStyle = gradient;
        
        // Draw a bar for each frequency
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        x += barWidth;
      }
      
      // Stop animation if audio is not playing
      if (!isPlaying) {
        cancelAnimationFrame(animationId);
      }
    };
    
    // Initialize and start visualization when audio plays
    const handlePlay = () => {
      setIsPlaying(true);
      
      if (!audioContextRef.current) {
        initializeAudio();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      draw();
    };
    
    // Handle pause
    const handlePause = () => {
      setIsPlaying(false);
    };
    
    // Add event listeners
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  return (
    <div className="relative aspect-video w-full bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={800}
        height={400}
      />
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" loop />
      
      <div className="absolute inset-0 flex items-center justify-center">
        <button 
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <FaPause className="h-6 w-6 text-white" />
          ) : (
            <FaPlay className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

// Main component
export default function MorphingPost({
  contents,
  userId,
  userName,
  userImage,
  initialType = 'image',
  className = '',
}: MorphingPostProps) {
  const [activeType, setActiveType] = useState<ContentType>(initialType);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find current content based on active type
  const currentContent = contents.find(content => content.type === activeType) || contents[0];
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Update fullscreen state based on document state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Render content based on type
  const renderContent = () => {
    switch (currentContent.type) {
      case 'image':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            {currentContent.data.url && (
              <Image
                src={currentContent.data.url}
                alt={currentContent.data.caption || 'Post image'}
                fill
                className="object-cover"
              />
            )}
          </div>
        );
        
      case 'video':
        return (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            {currentContent.data.url && (
              <video
                src={currentContent.data.url}
                className="h-full w-full object-cover"
                controls
                loop
                playsInline
              />
            )}
          </div>
        );
        
      case 'text':
        return (
          <div className="aspect-video w-full overflow-auto rounded-lg bg-gradient-to-br from-gray-900 to-indigo-900 p-6">
            <div className="h-full overflow-y-auto">
              {currentContent.data.text && (
                <p className="text-lg text-white">{currentContent.data.text}</p>
              )}
            </div>
          </div>
        );
        
      case '3d':
        return (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            <Canvas shadows>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              {currentContent.data.modelUrl && (
                <Model url={currentContent.data.modelUrl} />
              )}
              <OrbitControls enableZoom={true} autoRotate={false} />
              <Environment preset="city" />
            </Canvas>
          </div>
        );
        
      case 'audio':
        return (
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-900">
            {currentContent.data.audioUrl && currentContent.data.audioVisualizer ? (
              <AudioVisualizer audioUrl={currentContent.data.audioUrl} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8">
                <BsMusicNoteBeamed className="h-16 w-16 text-white opacity-80" />
                <audio
                  src={currentContent.data.audioUrl}
                  className="mt-6 w-full"
                  controls
                />
                {currentContent.data.caption && (
                  <p className="mt-4 text-center text-white opacity-80">{currentContent.data.caption}</p>
                )}
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-900 p-4">
            <p className="text-gray-400">No content available</p>
          </div>
        );
    }
  };
  
  // Content type tabs
  const tabs = [
    { type: 'image', icon: FaImage, available: contents.some(c => c.type === 'image') },
    { type: 'video', icon: FaVideo, available: contents.some(c => c.type === 'video') },
    { type: 'text', icon: FaFont, available: contents.some(c => c.type === 'text') },
    { type: '3d', icon: FaCube, available: contents.some(c => c.type === '3d') },
    { type: 'audio', icon: FaVolumeUp, available: contents.some(c => c.type === 'audio') },
  ];

  return (
    <div 
      ref={containerRef}
      className={`morphing-post relative rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 p-1 shadow-xl ${className}`}
    >
      {/* Post Content */}
      <div className="overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Control bar */}
      <div className="mt-2 flex items-center justify-between rounded-lg bg-gray-800/70 p-2 backdrop-blur-sm">
        {/* Content type tabs */}
        <div className="flex space-x-1">
          {tabs.map(({ type, icon: Icon, available }) => (
            available && (
              <motion.button
                key={type}
                className={`flex items-center justify-center rounded-md px-3 py-2 text-sm transition-colors ${
                  activeType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                onClick={() => setActiveType(type as ContentType)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline capitalize">{type}</span>
              </motion.button>
            )
          ))}
        </div>
        
        {/* Fullscreen toggle */}
        <button
          className="rounded-md bg-gray-700/50 p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <FaCompress className="h-4 w-4" />
          ) : (
            <FaExpand className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Caption (if available) */}
      {currentContent.data.caption && (
        <div className="mt-2 px-2">
          <p className="text-sm text-gray-300">{currentContent.data.caption}</p>
        </div>
      )}
    </div>
  );
}
