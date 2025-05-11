import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";

export const storyRouter = router({
  // Create a new story
  create: protectedProcedure
    .input(
      z.object({
        mediaUrl: z.string(),
        mediaType: z.enum(["image", "video"]),
        duration: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Set expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await ctx.db.story.create({
        data: {
          mediaUrl: input.mediaUrl,
          mediaType: input.mediaType,
          duration: input.duration,
          expiresAt,
          userId,
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

      return story;
    }),

  // Get stories from users the current user follows
  getFollowingStories: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get list of users that the current user follows
    const following = await ctx.db.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((follow) => follow.followingId);
    
    // Include current user's stories too
    followingIds.push(userId);

    // Get active stories (not expired) from these users
    const stories = await ctx.db.story.findMany({
      where: {
        userId: {
          in: followingIds,
        },
        expiresAt: {
          gt: new Date(),
        },
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
        views: {
          where: {
            viewerId: userId,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group stories by user
    const userStories = stories.reduce((grouped, story) => {
      const userId = story.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          user: story.user,
          stories: [],
          hasUnseenStories: false,
        };
      }
      
      const isViewed = story.views.length > 0;
      grouped[userId].stories.push({
        ...story,
        isViewed,
        views: undefined, // Remove the views array from response
      });
      
      if (!isViewed) {
        grouped[userId].hasUnseenStories = true;
      }
      
      return grouped;
    }, {} as Record<string, any>);

    // Convert to array and sort by unseen first, then recency
    return Object.values(userStories).sort((a, b) => {
      if (a.hasUnseenStories !== b.hasUnseenStories) {
        return a.hasUnseenStories ? -1 : 1;
      }
      return b.stories[0].createdAt.getTime() - a.stories[0].createdAt.getTime();
    });
  }),

  // Get stories by user ID
  getUserStories: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session?.user?.id;

      // Check if stories should be visible to the current user
      if (input.userId !== currentUserId) {
        // If not the user's own stories, check if the current user follows the target user
        if (currentUserId) {
          const followsUser = await ctx.db.follow.findFirst({
            where: {
              followerId: currentUserId,
              followingId: input.userId,
            },
          });

          if (!followsUser) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You must follow this user to view their stories",
            });
          }
        } else {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to view stories",
          });
        }
      }

      const stories = await ctx.db.story.findMany({
        where: {
          userId: input.userId,
          expiresAt: {
            gt: new Date(),
          },
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
          views: currentUserId
            ? {
                where: {
                  viewerId: currentUserId,
                },
              }
            : undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return stories.map((story) => ({
        ...story,
        isViewed: currentUserId ? story.views.length > 0 : false,
        views: undefined,
      }));
    }),

  // Mark a story as viewed
  viewStory: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const story = await ctx.db.story.findUnique({
        where: { id: input.storyId },
        include: {
          views: {
            where: {
              viewerId: userId,
            },
          },
        },
      });

      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Story not found",
        });
      }

      // Check if already viewed
      if (story.views.length === 0) {
        await ctx.db.storyView.create({
          data: {
            storyId: input.storyId,
            viewerId: userId,
          },
        });
      }

      return { success: true };
    }),

  // Delete a story
  delete: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const story = await ctx.db.story.findUnique({
        where: { id: input.storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Story not found",
        });
      }

      if (story.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this story",
        });
      }

      await ctx.db.story.delete({
        where: { id: input.storyId },
      });

      return { success: true };
    }),

  // Add reaction to a story
  addReaction: protectedProcedure
    .input(
      z.object({
        storyId: z.string(),
        type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const story = await ctx.db.story.findUnique({
        where: { id: input.storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Story not found",
        });
      }

      // Check if reaction already exists
      const existingReaction = await ctx.db.reaction.findFirst({
        where: {
          userId,
          storyId: input.storyId,
        },
      });

      if (existingReaction) {
        // Update existing reaction
        await ctx.db.reaction.update({
          where: { id: existingReaction.id },
          data: { type: input.type },
        });
      } else {
        // Create new reaction
        await ctx.db.reaction.create({
          data: {
            type: input.type,
            userId,
            storyId: input.storyId,
          },
        });

        // Create notification if the story is not by the current user
        if (story.userId !== userId) {
          await ctx.db.notification.create({
            data: {
              type: "reaction",
              content: `reacted with ${input.type} to your story`,
              senderId: userId,
              receiverId: story.userId,
            },
          });
        }
      }

      return { success: true };
    }),

  // Get story viewers with reactions
  getViewers: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const story = await ctx.db.story.findUnique({
        where: { id: input.storyId },
        select: { userId: true },
      });

      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Story not found",
        });
      }

      // Only the creator can see viewers
      if (story.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view this information",
        });
      }

      // Get all views with viewer information
      const views = await ctx.db.storyView.findMany({
        where: {
          storyId: input.storyId,
        },
        include: {
          story: {
            select: {
              reactions: {
                include: {
                  user: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          viewedAt: "desc",
        },
      });

      // Enrich with viewer details
      const viewers = await Promise.all(
        views.map(async (view) => {
          const viewer = await ctx.db.user.findUnique({
            where: { id: view.viewerId },
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          });

          // Find reaction from this viewer if any
          const reaction = view.story.reactions.find(
            (r) => r.user.id === view.viewerId
          );

          return {
            viewer,
            viewedAt: view.viewedAt,
            reaction: reaction ? reaction.type : null,
          };
        })
      );

      return viewers;
    }),
});
