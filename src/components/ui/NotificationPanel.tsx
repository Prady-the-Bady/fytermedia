'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaSpinner, FaExclamationCircle, FaArrowRight, FaBell } from 'react-icons/fa';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import Link from 'next/link';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const {
    notifications,
    isLoading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications(10);

  // Set up intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // Load more notifications when scrolling to the bottom
  useEffect(() => {
    if (inView && hasMore && !isLoading && !isFetchingMore) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, isFetchingMore, loadMore]);

  // Icons for different notification types
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LIKE':
        return '❤️';
      case 'COMMENT':
        return '💬';
      case 'FOLLOW':
        return '👤';
      case 'MENTION':
        return '@️';
      case 'STORY_VIEW':
        return '👁️';
      case 'REEL_VIEW':
        return '🎬';
      case 'NEW_POST':
        return '📱';
      case 'NEW_STORY':
        return '📸';
      case 'NEW_REEL':
        return '🎥';
      case 'SYSTEM':
        return '🔔';
      default:
        return '🔔';
    }
  };

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead({ id });
  };

  // Get notification link based on type
  const getNotificationLink = (notification: any) => {
    if (notification.post) return `/post/${notification.post.id}`;
    if (notification.story) return `/stories?id=${notification.story.id}`;
    if (notification.reel) return `/reels?id=${notification.reel.id}`;
    if (notification.sender) return `/profile/${notification.sender.username}`;
    return '#';
  };

  return (
    <div className="max-h-[80vh] overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between border-b border-gray-800 bg-gray-900 p-4">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <button
          onClick={() => markAllAsRead()}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <FaCheck className="h-3 w-3" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[60vh] overflow-y-auto px-1 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-700">
        {isLoading && notifications.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <FaSpinner className="h-6 w-6 animate-spin text-indigo-500" />
            <span className="ml-2 text-gray-400">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="flex h-40 flex-col items-center justify-center">
            <FaExclamationCircle className="h-6 w-6 text-red-500" />
            <span className="mt-2 text-gray-400">Error loading notifications</span>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 rounded-lg bg-indigo-600 px-3 py-1 text-xs text-white"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center p-4">
            <div className="h-12 w-12 rounded-full bg-gray-800 p-3 text-gray-500">
              🔔
            </div>
            <span className="mt-2 text-center text-gray-400">
              You have no notifications yet
            </span>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <motion.li
                  key={notification.id}
                  className={`relative ${
                    !notification.isRead ? 'bg-gray-800/40' : ''
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={getNotificationLink(notification)}
                    onClick={() => {
                      if (!notification.isRead) handleMarkAsRead(notification.id);
                      if (onClose) onClose();
                    }}
                    className="flex gap-3 p-4 transition-colors hover:bg-gray-800/70"
                  >
                    {/* Notification icon or sender avatar */}
                    <div className="flex-shrink-0">
                      {notification.sender?.image ? (
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={notification.sender.image}
                            alt={notification.sender.name || 'User'}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-xs">
                            {getNotificationIcon(notification.type)}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600/20 text-xl text-indigo-500">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 overflow-hidden">
                      <p className="pr-6 text-sm text-white">
                        {notification.content}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-indigo-500"></div>
                    )}
                  </Link>
                </motion.li>
              ))}
            </ul>

            {/* Load more trigger */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="flex justify-center p-4"
              >
                {isFetchingMore ? (
                  <FaSpinner className="h-5 w-5 animate-spin text-indigo-500" />
                ) : (
                  <button
                    onClick={loadMore}
                    className="text-sm text-indigo-500 hover:text-indigo-400"
                  >
                    Load more
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 p-3">
        <Link
          href="/notifications"
          className="flex items-center justify-center gap-2 rounded-lg bg-gray-800 p-2 text-sm text-white transition-colors hover:bg-gray-700"
          onClick={() => {
            if (onClose) onClose();
          }}
        >
          <span>See all notifications</span>
          <FaArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
