import { useState, useEffect } from 'react';
import React from 'react';
import { api } from '@/lib/trpc/client';
import { toast } from 'react-hot-toast';

// Define our own NotificationType enum since we don't want to rely directly on Prisma client
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  STORY_VIEW = 'STORY_VIEW',
  REEL_VIEW = 'REEL_VIEW',
  NEW_POST = 'NEW_POST',
  NEW_STORY = 'NEW_STORY',
  NEW_REEL = 'NEW_REEL',
  SYSTEM = 'SYSTEM'
}

export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender?: {
    id: string;
    name: string | null;
    image: string | null;
    username: string | null;
  } | null;
  post?: {
    id: string;
    caption: string | null;
    contentUrl: string | null;
    contentType: string;
  } | null;
  comment?: {
    id: string;
    content: string;
  } | null;
  story?: {
    id: string;
    mediaUrl: string;
    mediaType: string;
  } | null;
  reel?: {
    id: string;
    videoUrl: string;
    caption: string | null;
  } | null;
  message?: {
    id: string;
    content: string;
    contentType: string;
  } | null;
}

export type NotificationsResponse = {
  items: Notification[];
  nextCursor?: string;
};

/**
 * Hook for fetching and managing notifications
 */
export function useNotifications(limit = 20, onlyUnread = false) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = api.notification.getAll.useInfiniteQuery(
    {
      limit,
      onlyUnread,
    },
    {
      getNextPageParam: (lastPage: NotificationsResponse) => lastPage.nextCursor,
    }
  );
  
  // Process data when it changes
  React.useEffect(() => {
    if (data) {
      const flatNotifications = data.pages.flatMap(page => page.items);
      setNotifications(flatNotifications);
      setHasMore(!!data.pages[data.pages.length - 1]?.nextCursor);
    }
  }, [data]);

  // Function to load more notifications
  const loadMore = async () => {
    if (isFetchingNextPage || !hasMore) return;
    await fetchNextPage();
  };

  // Mark notification as read
  const { mutate: markAsRead } = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });

  // Mark all notifications as read
  const { mutate: markAllAsRead } = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('All notifications marked as read');
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    },
  });

  return {
    notifications,
    isLoading,
    error,
    hasMore,
    loadMore,
    isFetchingMore: isFetchingNextPage,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}

/**
 * Hook for getting unread notification count
 */
export function useUnreadNotificationCount() {
  const { data, isLoading, error, refetch } = api.notification.getUnreadCount.useQuery(
    undefined, {
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    count: data || 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for creating notifications
 */
export function useCreateNotification() {
  const utils = api.useUtils();
  
  const mutation = api.notification.create.useMutation({
    onSuccess: () => {
      // Invalidate relevant queries
      utils.notification.getAll.invalidate();
      utils.notification.getUnreadCount.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create notification: ${error.message}`);
    },
  });

  return {
    createNotification: mutation.mutate,
    isLoading: !!mutation.isPending,
    error: mutation.error
  };
}
