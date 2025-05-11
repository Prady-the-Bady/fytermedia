'use client';

import { useCallback } from 'react';
import { api } from '@/lib/trpc/client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Type definitions for API responses
export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | '3d';
  caption?: string;
  duration: number;
  expiresAt: Date;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
    reputationScore?: number;
  };
  viewed?: boolean;
  items?: StoryItem[];
}

export interface StoryItem {
  id: string;
  type: 'image' | 'video' | '3d';
  url: string;
  caption?: string;
  createdAt: Date;
  duration: number;
}

export interface Reel {
  id: string;
  videoUrl: string;
  caption?: string;
  soundName?: string;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
    reputationScore?: number;
    isFollowing?: boolean;
  };
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    username: string;
    image: string;
  };
  likes: number;
  comments: number;
  liked: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
}

// ===== Story Hooks =====
export function useStories() {
  const { data, isLoading, error } = api.story.getFollowingStories.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minute
  });

  return {
    stories: data || [] as Story[],
    isLoading,
    error: error?.message,
  };
}

export function useCreateStory() {
  const utils = api.useUtils();
  const mutation = api.story.create.useMutation({
    onSuccess: () => {
      // Invalidate the stories query to refetch the stories
      utils.story.getFollowingStories.invalidate();
      toast.success('Story created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create story: ${error.message}`);
    },
  });

  return {
    createStory: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
  };
}

export function useViewStory() {
  const utils = api.useUtils();
  const mutation = api.story.viewStory.useMutation({
    onSuccess: () => {
      utils.story.getFollowingStories.invalidate();
    },
  });

  return {
    viewStory: mutation.mutate,
    isLoading: mutation.isPending,
  };
}

// ===== Reel Hooks =====
export function useReels(limit = 10) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, error, fetchNextPage, isFetchingNextPage } = 
    api.reel.getFeed.useInfiniteQuery(
      { limit },
      {
        getNextPageParam: (lastPage: PaginatedResponse<Post>) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
        staleTime: 60000, // 1 minute
      }
    );

  // Update allReels when data changes
  useEffect(() => {
    if (data) {
      const newReels = data.pages.flatMap((page: PaginatedResponse<Reel>) => page.items);
      setAllReels(newReels);
      setHasMore(!!data.pages[data.pages.length - 1].nextCursor);
    }
  }, [data]);

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasMore) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasMore, isFetchingNextPage]);

  return {
    reels: allReels,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    error: error?.message,
    loadMore,
    hasMore,
  };
}

export function useLikeReel() {
  const utils = api.useUtils();
  const mutation = api.reel.toggleLike.useMutation({
    onSuccess: () => {
      utils.reel.getFeed.invalidate();
    },
  });

  return {
    likeReel: mutation.mutate,
    isLoading: mutation.isPending,
  };
}

export function useCreateReel() {
  const utils = api.useUtils();
  const mutation = api.reel.create.useMutation({
    onSuccess: () => {
      utils.reel.getFeed.invalidate();
      toast.success('Reel created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create reel: ${error.message}`);
    },
  });

  return {
    createReel: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
  };
}

// ===== Post Hooks =====
export function usePosts(limit = 10) {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, error, fetchNextPage, isFetchingNextPage } = 
    api.post.getAll.useInfiniteQuery(
      { limit },
      {
        getNextPageParam: (lastPage: PaginatedResponse<Post>) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
        staleTime: 60000, // 1 minute
      }
    );

  // Update allPosts when data changes
  useEffect(() => {
    if (data) {
      const newPosts = data.pages.flatMap((page: PaginatedResponse<Post>) => page.items);
      setAllPosts(newPosts);
      setHasMore(!!data.pages[data.pages.length - 1].nextCursor);
    }
  }, [data]);

  const loadMore = useCallback(() => {
    if (!isFetchingNextPage && hasMore) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasMore, isFetchingNextPage]);

  return {
    posts: allPosts,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    error: error?.message,
    loadMore,
    hasMore,
  };
}

export function useCreatePost() {
  const utils = api.useUtils();
  const mutation = api.post.create.useMutation({
    onSuccess: () => {
      utils.post.getAll.invalidate();
      toast.success('Post created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });

  return {
    createPost: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error?.message,
  };
}

export function useLikePost() {
  const utils = api.useUtils();
  const mutation = api.post.toggleLike.useMutation({
    onSuccess: () => {
      utils.post.getAll.invalidate();
    },
  });

  return {
    likePost: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
