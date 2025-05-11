'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaCheck } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import NotificationPanel from '@/components/ui/NotificationPanel';

export default function NotificationBadge() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { count, isLoading } = useUnreadNotificationCount();

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // If not logged in, don't show anything
  if (!session) return null;

  return (
    <div className="relative">
      {/* Notification Bell with Badge */}
      <button
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 p-2 text-white transition-colors hover:bg-gray-700"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell className="h-5 w-5" />
        
        {/* Unread badge */}
        {!isLoading && count > 0 && (
          <motion.div
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {count > 9 ? '9+' : count}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl bg-gray-900 shadow-2xl ring-1 ring-gray-700 sm:w-96"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
