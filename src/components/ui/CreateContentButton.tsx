'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaImage, FaVideo, FaFeather } from 'react-icons/fa';
import CreateContentModal, { ContentType } from './upload/CreateContentModal';

export default function CreateContentButton() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<ContentType | null>(null);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleContentTypeSelect = (type: ContentType) => {
    setModalType(type);
    setIsMenuOpen(false);
  };
  
  const closeModal = () => {
    setModalType(null);
  };
  
  // Menu items for content creation
  const menuItems = [
    {
      type: 'post' as ContentType,
      label: 'Post',
      icon: <FaFeather />,
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      type: 'story' as ContentType,
      label: 'Story',
      icon: <FaImage />,
      color: 'bg-pink-600 hover:bg-pink-700',
    },
    {
      type: 'reel' as ContentType,
      label: 'Reel',
      icon: <FaVideo />,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ];
  
  return (
    <>
      <div className="fixed bottom-20 right-6 z-40 sm:bottom-10 sm:right-10">
        {/* Floating Action Button */}
        <motion.button
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMenu}
        >
          <motion.div
            animate={{ rotate: isMenuOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FaPlus className="h-6 w-6" />
          </motion.div>
        </motion.button>
        
        {/* Content type menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <div className="absolute bottom-16 right-0 mb-2 space-y-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.type}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ${item.color}`}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{
                    duration: 0.2,
                    delay: 0.05 * (menuItems.length - index),
                  }}
                  onClick={() => handleContentTypeSelect(item.type)}
                >
                  {item.icon}
                  
                  {/* Label */}
                  <span className="absolute -left-20 -translate-x-full whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-sm opacity-0 transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content creation modals */}
      {modalType && (
        <CreateContentModal
          isOpen={!!modalType}
          onClose={closeModal}
          contentType={modalType}
        />
      )}
    </>
  );
}
