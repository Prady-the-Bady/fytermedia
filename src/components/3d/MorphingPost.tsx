'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, Text3D, PresentationControls } from '@react-three/drei';
import { FaImage, FaVideo, FaFont, FaCube, FaVolumeUp } from 'react-icons/fa';
import gsap from 'gsap';

type ContentType = 'image' | 'video' | 'text' | '3d' | 'audio';

interface MorphingPostProps {
  initialContent: {
    type: ContentType;
    url?: string;
    text?: string;
  };
  postId: string;
  onMorphComplete?: (newType: ContentType) => void;
}

// 3D content component
function Content3D({ text }: { text: string }) {
  return (
    <PresentationControls
      global
      rotation={[0, 0, 0]}
      polar={[-Math.PI / 4, Math.PI / 4]}
      azimuth={[-Math.PI / 4, Math.PI / 4]}
      config={{ mass: 2, tension: 400 }}
      snap={{ mass: 4, tension: 400 }}
    >
      <Float rotationIntensity={0.4}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} />
        <Text3D
          curveSegments={32}
          bevelEnabled
          bevelSize={0.04}
          bevelThickness={0.1}
          height={0.5}
          lineHeight={0.5}
          letterSpacing={0.05}
          size={0.3}
          font="/fonts/Roboto_Regular.json"
        >
          {text || '3D Content'}
          <meshNormalMaterial />
        </Text3D>
      </Float>
    </PresentationControls>
  );
}

// Audio visualization component
function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Mock audio visualization with GSAP
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bars = 60;
    const barWidth = canvas.width / bars;
    const heights: number[] = [];
    
    // Initialize bar heights
    for (let i = 0; i < bars; i++) {
      heights[i] = Math.random() * 50 + 10;
    }
    
    // Animation with GSAP
    if (isPlaying) {
      gsap.ticker.add(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < bars; i++) {
          // Animate heights for audio visualization effect
          heights[i] += (Math.random() * 10 - 5);
          heights[i] = Math.max(5, Math.min(100, heights[i]));
          
          const x = i * barWidth;
          const height = heights[i];
          const hue = (i / bars) * 240 + 170; // Blue to purple gradient
          
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
          ctx.fillRect(x, canvas.height - height, barWidth - 1, height);
        }
      });
    }
    
    return () => {
      gsap.ticker.remove(() => {});
    };
  }, [isPlaying]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-indigo-900/70 to-purple-900/70 p-4">
      <button
        className="mb-6 rounded-full bg-white/10 p-4 backdrop-blur-sm"
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isPlaying ? (
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
      
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="w-full"
      />
      
      <div className="mt-4 flex w-full items-center justify-between text-white">
        <span>0:00</span>
        <div className="h-1 flex-1 rounded-full bg-white/20 mx-2">
          <div className={`h-full w-0 rounded-full bg-indigo-500 transition-all duration-300 ${isPlaying ? 'animate-progress' : ''}`}></div>
        </div>
        <span>3:45</span>
      </div>
    </div>
  );
}

export default function MorphingPost({ initialContent, postId, onMorphComplete }: MorphingPostProps) {
  const [currentType, setCurrentType] = useState<ContentType>(initialContent.type);
  const [content, setContent] = useState(initialContent);
  const [isMorphing, setIsMorphing] = useState(false);
  
  // Handle content type change with morphing animation
  const handleTypeChange = (newType: ContentType) => {
    if (newType === currentType) return;
    
    setIsMorphing(true);
    
    // After morphing animation completes, change the content
    setTimeout(() => {
      setCurrentType(newType);
      
      // Update content based on type
      setContent({
        type: newType,
        text: newType === 'text' ? 'Transformed text content' : content.text,
        url: newType !== 'text' ? content.url : undefined,
      });
      
      setTimeout(() => {
        setIsMorphing(false);
        if (onMorphComplete) onMorphComplete(newType);
      }, 500);
    }, 500);
  };
  
  const contentVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 1.2, transition: { duration: 0.5 } },
  };

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black/90 p-4 shadow-xl">
      <h3 className="mb-4 text-center text-lg font-semibold text-white">PostMorph™</h3>
      
      <div className="mb-4 flex justify-center space-x-2">
        <motion.button
          className={`flex flex-col items-center p-2 rounded-lg ${currentType === 'image' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => handleTypeChange('image')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaImage className="h-5 w-5 text-white" />
          <span className="mt-1 text-xs text-white">Image</span>
        </motion.button>
        
        <motion.button
          className={`flex flex-col items-center p-2 rounded-lg ${currentType === 'video' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => handleTypeChange('video')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaVideo className="h-5 w-5 text-white" />
          <span className="mt-1 text-xs text-white">Video</span>
        </motion.button>
        
        <motion.button
          className={`flex flex-col items-center p-2 rounded-lg ${currentType === 'text' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => handleTypeChange('text')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaFont className="h-5 w-5 text-white" />
          <span className="mt-1 text-xs text-white">Text</span>
        </motion.button>
        
        <motion.button
          className={`flex flex-col items-center p-2 rounded-lg ${currentType === '3d' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => handleTypeChange('3d')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaCube className="h-5 w-5 text-white" />
          <span className="mt-1 text-xs text-white">3D</span>
        </motion.button>
        
        <motion.button
          className={`flex flex-col items-center p-2 rounded-lg ${currentType === 'audio' ? 'bg-indigo-600' : 'bg-gray-800 hover:bg-gray-700'}`}
          onClick={() => handleTypeChange('audio')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <FaVolumeUp className="h-5 w-5 text-white" />
          <span className="mt-1 text-xs text-white">Audio</span>
        </motion.button>
      </div>
      
      <div className="relative h-64 w-full overflow-hidden rounded-lg bg-gray-800">
        <AnimatePresence mode="wait">
          {isMorphing && (
            <motion.div
              key="morph-transition"
              className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </motion.div>
          )}
          
          {!isMorphing && (
            <motion.div
              key={`content-${currentType}`}
              className="h-full w-full"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {currentType === 'image' && (
                <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${content.url || '/placeholders/post1.jpg'})` }}></div>
              )}
              
              {currentType === 'video' && (
                <div className="flex h-full w-full items-center justify-center bg-black">
                  <svg className="h-16 w-16 text-white opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              
              {currentType === 'text' && (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-indigo-900 to-purple-900 p-6">
                  <p className="text-center text-xl font-bold text-white">{content.text || 'Transformed text content'}</p>
                </div>
              )}
              
              {currentType === '3d' && (
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <Content3D text={content.text || 'Hello 3D'} />
                  <Environment preset="sunset" />
                </Canvas>
              )}
              
              {currentType === 'audio' && (
                <AudioVisualizer />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-400">
        <p>Morphing technology powered by AI</p>
        <p className="text-xs mt-1">Content transformation may vary based on input quality</p>
      </div>
    </div>
  );
}
