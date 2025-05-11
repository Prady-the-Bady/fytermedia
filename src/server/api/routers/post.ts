import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";

export const postRouter = router({
  // Get feed posts with infinite pagination
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      const userId = ctx.session?.user?.id;

      const posts = await ctx.db.post.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(userId
            ? {
                likes: {
                  where: {
                    userId,
                  },
                  take: 1,
                },
              }
            : {}),
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: posts.map((post) => ({
          ...post,
          isLiked: userId ? post.likes && post.likes.length > 0 : false,
          likes: undefined,
        })),
        nextCursor,
      };
    }),

  // Create a new post
  create: protectedProcedure
    .input(
      z.object({
        caption: z.string().optional(),
        contentUrl: z.string().optional(),
        contentType: z.enum(["image", "video", "text", "3d", "mixed"]),
        ipfsHash: z.string().optional(),
        visibility: z.enum(["public", "friends", "private"]).default("public"),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tags, ...postData } = input;
      const userId = ctx.session.user.id;

      // Generate an integrity hash if needed
      const integrityHash = input.contentUrl 
        ? Buffer.from(input.contentUrl).toString('base64')
        : undefined;

      // Create the post
      const post = await ctx.db.post.create({
        data: {
          ...postData,
          integrityHash,
          userId,
          ...(tags && tags.length > 0
            ? {
                tags: {
                  connectOrCreate: tags.map((tag) => ({
                    where: { name: tag },
                    create: { name: tag },
                  })),
                },
              }
            : {}),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          tags: true,
        },
      });

      return post;
    }),

  // Get post by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                },
              },
              ...(userId
                ? {
                    likes: {
                      where: {
                        userId,
                      },
                      take: 1,
                    },
                  }
                : {}),
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          tags: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(userId
            ? {
                likes: {
                  where: {
                    userId,
                  },
                  take: 1,
                },
              }
            : {}),
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Transform the post to include isLiked
      return {
        ...post,
        isLiked: userId ? post.likes && post.likes.length > 0 : false,
        likes: undefined,
        comments: post.comments.map((comment) => ({
          ...comment,
          isLiked: userId ? comment.likes && comment.likes.length > 0 : false,
          likes: undefined,
        })),
      };
    }),

  // Like a post
  like: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if already liked
      const existingLike = await ctx.db.like.findFirst({
        where: {
          userId,
          postId: input.postId,
        },
      });

      if (existingLike) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Post already liked",
        });
      }

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Create the like
      await ctx.db.like.create({
        data: {
          userId,
          postId: input.postId,
        },
      });

      // Create notification if the post is not by the current user
      if (post.userId !== userId) {
        await ctx.db.notification.create({
          data: {
            type: "like",
            content: "liked your post",
            senderId: userId,
            receiverId: post.userId,
          },
        });
      }

      return { success: true };
    }),

  // Unlike a post
  unlike: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.like.deleteMany({
        where: {
          userId,
          postId: input.postId,
        },
      });

      return { success: true };
    }),

  // Add comment to a post
  comment: protectedProcedure
    .input(z.object({ postId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const comment = await ctx.db.comment.create({
        data: {
          content: input.content,
          userId,
          postId: input.postId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      // Create notification if the post is not by the current user
      if (post.userId !== userId) {
        await ctx.db.notification.create({
          data: {
            type: "comment",
            content: "commented on your post",
            senderId: userId,
            receiverId: post.userId,
          },
        });
      }

      return comment;
    }),

  // Delete a post (only by the owner)
  delete: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this post",
        });
      }

      await ctx.db.post.delete({
        where: { id: input.postId },
      });

      return { success: true };
    }),

  // Get user posts
  getUserPosts: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, limit, cursor } = input;
      const currentUserId = ctx.session?.user?.id;

      const posts = await ctx.db.post.findMany({
        where: {
          userId,
          OR: [
            { visibility: "public" },
            ...(currentUserId
              ? [
                  { visibility: "friends" },
                  { userId: currentUserId, visibility: "private" },
                ]
              : []),
          ],
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(currentUserId
            ? {
                likes: {
                  where: {
                    userId: currentUserId,
                  },
                  take: 1,
                },
              }
            : {}),
        },
      });

      let nextCursor: string | undefined = undefined;
      if (posts.length > limit) {
        const nextItem = posts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: posts.map((post) => ({
          ...post,
          isLiked: currentUserId ? post.likes && post.likes.length > 0 : false,
          likes: undefined,
        })),
        nextCursor,
      };
    }),

  // Add reaction to a post
  addReaction: protectedProcedure
    .input(z.object({ 
      postId: z.string(), 
      type: z.string() 
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      // Check if reaction already exists and remove it
      const existingReaction = await ctx.db.reaction.findFirst({
        where: {
          userId,
          postId: input.postId,
        },
      });

      if (existingReaction && existingReaction.type === input.type) {
        // Remove if same reaction type
        await ctx.db.reaction.delete({
          where: { id: existingReaction.id },
        });
        return { success: true, action: "removed" };
      } else if (existingReaction) {
        // Update if different reaction type
        await ctx.db.reaction.update({
          where: { id: existingReaction.id },
          data: { type: input.type },
        });
        return { success: true, action: "updated" };
      }

      // Create new reaction
      await ctx.db.reaction.create({
        data: {
          type: input.type,
          userId,
          postId: input.postId,
        },
      });

      // Create notification if the post is not by the current user
      if (post.userId !== userId) {
        await ctx.db.notification.create({
          data: {
            type: "reaction",
            content: `reacted with ${input.type} to your post`,
            senderId: userId,
            receiverId: post.userId,
          },
        });
      }

      return { success: true, action: "added" };
    }),

  // Convert post type (PostMorph feature)
  convertPostType: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        targetType: z.enum(["image", "video", "text", "3d", "audio"]),
        newContentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const post = await ctx.db.post.findUnique({
        where: { id: input.postId },
        select: { userId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      if (post.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to modify this post",
        });
      }

      // Update the post with new content type
      const updatedPost = await ctx.db.post.update({
        where: { id: input.postId },
        data: {
          contentType: input.targetType,
          contentUrl: input.newContentUrl,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      return updatedPost;
    }),
});
