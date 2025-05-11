'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaShieldAlt, FaCheckCircle, FaMedal, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

interface ReputationScoreProps {
  score: number;
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

// ReputationScore™ component that displays a user's trust and visibility score
export default function ReputationScore({ score, userId, size = 'md', showTooltip = true }: ReputationScoreProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [scoreClass, setScoreClass] = useState('');
  const [scoreLabel, setScoreLabel] = useState('');
  const [scoreIcon, setScoreIcon] = useState<any>(FaStar);
  
  // Calculate the circular progress fill
  const circumference = 2 * Math.PI * 18; // 18 is the circle radius
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'w-8 h-8',
      text: 'text-xs',
      padding: 'p-0.5',
      circle: { radius: 12, strokeWidth: 2 },
    },
    md: {
      container: 'w-12 h-12',
      text: 'text-sm',
      padding: 'p-1',
      circle: { radius: 18, strokeWidth: 3 },
    },
    lg: {
      container: 'w-16 h-16',
      text: 'text-base',
      padding: 'p-1.5',
      circle: { radius: 22, strokeWidth: 4 },
    },
  };
  
  // Set score color and label based on value
  useEffect(() => {
    if (score >= 90) {
      setScoreClass('text-emerald-400 from-emerald-500 to-teal-500');
      setScoreLabel('Verified Elite');
      setScoreIcon(FaShieldAlt);
    } else if (score >= 70) {
      setScoreClass('text-blue-400 from-blue-500 to-indigo-500');
      setScoreLabel('Trusted');
      setScoreIcon(FaCheckCircle);
    } else if (score >= 50) {
      setScoreClass('text-indigo-400 from-indigo-500 to-purple-500');
      setScoreLabel('Established');
      setScoreIcon(FaMedal);
    } else if (score >= 30) {
      setScoreClass('text-amber-400 from-amber-500 to-orange-500');
      setScoreLabel('Developing');
      setScoreIcon(FaInfoCircle);
    } else {
      setScoreClass('text-red-400 from-red-500 to-pink-500');
      setScoreLabel('New');
      setScoreIcon(FaExclamationTriangle);
    }
  }, [score]);

  const handleMouseEnter = () => {
    if (showTooltip) {
      setTooltipVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (showTooltip) {
      setTooltipVisible(false);
    }
  };

  const selectedSize = sizeMap[size];
  const { radius, strokeWidth } = selectedSize.circle;

  return (
    <div className="relative inline-block">
      <motion.div
        className={`relative flex items-center justify-center ${selectedSize.container} rounded-full ${selectedSize.padding} bg-gradient-to-r bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 ${scoreClass}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.1 }}
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`}>
            <circle
              cx={radius + strokeWidth / 2}
              cy={radius + strokeWidth / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ opacity: 0.3 }}
              transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
            />
          </svg>
        </div>
        
        <div className={`z-10 flex items-center justify-center ${selectedSize.text} font-semibold text-white`}>
          {score}
        </div>
      </motion.div>
      
      {tooltipVisible && (
        <motion.div
          className="absolute left-full ml-2 w-48 rounded-md bg-black/80 p-3 text-sm text-white shadow-lg backdrop-blur-lg"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          style={{ zIndex: 50 }}
        >
          <div className="flex items-center space-x-2">
            {scoreIcon && <scoreIcon.type className={`h-4 w-4 ${scoreClass}`} />}
            <h4 className={`font-semibold ${scoreClass}`}>
              {scoreLabel} ({score}/100)
            </h4>
          </div>
          
          <p className="mt-1 text-xs text-gray-300">
            ReputationScore™ measures trust based on community verification, content quality, and engagement history.
          </p>
          
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>
              <span>Quality: {Math.floor(score * 0.4)}/40</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Trust: {Math.floor(score * 0.35)}/35</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-500"></span>
              <span>Engagement: {Math.floor(score * 0.25)}/25</span>
            </div>
          </div>
          
          <div className="absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-black/80"></div>
        </motion.div>
      )}
    </div>
  );
}
