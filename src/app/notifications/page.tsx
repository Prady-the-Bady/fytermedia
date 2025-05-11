'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaCheck, FaExclamationCircle, FaFilter } from 'react-icons/fa';
import { useNotifications } from '@/hooks/useNotifications';
import { useInView } from 'react-intersection-observer';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { NotificationType } from '@/hooks/useNotifications';
import MainNav from '@/components/layout/MainNav';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [filterType, setFilterType] = useState<NotificationType | 'ALL'>('ALL');
  const {
    notifications,
    isLoading,
    error,
    hasMore,
    loadMore,
    isFetchingMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications(20);

  // Set up intersection observer for infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
  });

  // Load more notifications when scrolling to the bottom
  if (inView && hasMore && !isLoading && !isFetchingMore) {
    loadMore();
  }

  // Get filtered notifications
  const filteredNotifications = filterType === 'ALL'
    ? notifications
    : notifications.filter(notification => notification.type === filterType);

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markAsRead({ id });
  };

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

  // Filter options
  const filterOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'LIKE', label: 'Likes' },
    { value: 'COMMENT', label: 'Comments' },
    { value: 'FOLLOW', label: 'Follows' },
    { value: 'MENTION', label: 'Mentions' },
    { value: 'STORY_VIEW', label: 'Story Views' },
    { value: 'NEW_POST', label: 'New Posts' },
    { value: 'NEW_STORY', label: 'New Stories' },
    { value: 'NEW_REEL', label: 'New Reels' },
    { value: 'SYSTEM', label: 'System' },
  ];

  // Get notification link based on type
  const getNotificationLink = (notification: any) => {
    if (notification.post) return `/post/${notification.post.id}`;
    if (notification.story) return `/stories?id=${notification.story.id}`;
    if (notification.reel) return `/reels?id=${notification.reel.id}`;
    if (notification.sender) return `/profile/${notification.sender.username}`;
    return '#';
  };

  return (
    <div className="bg-black min-h-screen">
      <MainNav />
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:py-8 sm:pl-64">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-gray-400">
              Stay up to date with your interactions
            </p>
          </div>
          <button
            onClick={() => markAllAsRead()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <FaCheck className="h-4 w-4" />
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Filter toolbar */}
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2">
            <div className="flex h-9 items-center rounded-lg bg-gray-800 px-3 text-sm text-gray-400">
              <FaFilter className="mr-2 h-4 w-4" />
              <span>Filter by:</span>
            </div>
            {filterOptions.map((option) => (
              <button
                key={option.value}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filterType === option.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setFilterType(option.value as NotificationType | 'ALL')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-gray-900 shadow-xl">
          {isLoading && notifications.length === 0 ? (
            <div className="flex h-60 items-center justify-center">
              <FaSpinner className="h-8 w-8 animate-spin text-indigo-500" />
              <span className="ml-3 text-lg text-gray-400">Loading notifications...</span>
            </div>
          ) : error ? (
            <div className="flex h-60 flex-col items-center justify-center">
              <FaExclamationCircle className="h-8 w-8 text-red-500" />
              <span className="mt-4 text-center text-lg text-gray-400">
                Error loading notifications
              </span>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex h-60 flex-col items-center justify-center p-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-gray-500">
                <span className="text-2xl">{filterType === 'ALL' ? '🔔' : getNotificationIcon(filterType as NotificationType)}</span>
              </div>
              <span className="mt-4 text-center text-lg text-gray-400">
                {filterType === 'ALL'
                  ? 'You have no notifications yet'
                  : `You have no ${filterOptions.find(o => o.value === filterType)?.label.toLowerCase()} notifications`}
              </span>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-800">
                <AnimatePresence initial={false}>
                  {filteredNotifications.map((notification) => (
                    <motion.li
                      key={notification.id}
                      className={`relative ${
                        !notification.isRead ? 'bg-gray-800/40' : ''
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    >
                      <Link
                        href={getNotificationLink(notification)}
                        onClick={() => {
                          if (!notification.isRead) handleMarkAsRead(notification.id);
                        }}
                        className="flex gap-4 p-5 transition-colors hover:bg-gray-800/70"
                      >
                        {/* Notification icon or sender avatar */}
                        <div className="flex-shrink-0">
                          {notification.sender?.image ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded-full">
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
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600/20 text-xl text-indigo-500">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>

                        {/* Notification content */}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-base text-white">
                            {notification.content}
                          </p>
                          <p className="mt-1 text-sm text-gray-400">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>

                          {/* Content preview */}
                          {notification.post?.contentUrl && (
                            <div className="mt-3 h-16 w-16 overflow-hidden rounded-md">
                              <img
                                src={notification.post.contentUrl}
                                alt="Post content"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="absolute right-5 top-5 h-3 w-3 rounded-full bg-indigo-500"></div>
                        )}
                      </Link>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {/* Load more trigger */}
              {hasMore && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center p-6 border-t border-gray-800"
                >
                  {isFetchingMore ? (
                    <FaSpinner className="h-6 w-6 animate-spin text-indigo-500" />
                  ) : (
                    <button
                      onClick={loadMore}
                      className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
                    >
                      Load more notifications
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
