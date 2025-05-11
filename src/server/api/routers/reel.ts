import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";

export const reelRouter = router({
  // Create a new reel
  create: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        caption: z.string().optional(),
        soundName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const reel = await ctx.db.reel.create({
        data: {
          videoUrl: input.videoUrl,
          caption: input.caption,
          soundName: input.soundName,
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

      return reel;
    }),

  // Get reel feed with pagination
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const reels = await ctx.db.reel.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: [
          {
            createdAt: "desc",
          },
        ],
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
              reactions: true,
            },
          },
          ...(userId
            ? {
                reactions: {
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
      if (reels.length > input.limit) {
        const nextItem = reels.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reels: reels.map((reel) => ({
          ...reel,
          userReaction: reel.reactions && reel.reactions.length > 0 
            ? reel.reactions[0].type 
            : null,
          reactions: undefined,
        })),
        nextCursor,
      };
    }),

  // Get user reels
  getUserReels: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session?.user?.id;

      const reels = await ctx.db.reel.findMany({
        where: {
          userId: input.userId,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
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
              reactions: true,
            },
          },
          ...(currentUserId
            ? {
                reactions: {
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
      if (reels.length > input.limit) {
        const nextItem = reels.pop();
        nextCursor = nextItem?.id;
      }

      return {
        reels: reels.map((reel) => ({
          ...reel,
          userReaction: reel.reactions && reel.reactions.length > 0 
            ? reel.reactions[0].type 
            : null,
          reactions: undefined,
        })),
        nextCursor,
      };
    }),

  // Get reel by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;

      const reel = await ctx.db.reel.findUnique({
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
          reactions: {
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
            take: 50,
            orderBy: {
              createdAt: "desc",
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
      });

      if (!reel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reel not found",
        });
      }

      // Find the user's reaction if logged in
      const userReaction = userId
        ? reel.reactions.find((r) => r.user.id === userId)?.type || null
        : null;

      return {
        ...reel,
        userReaction,
      };
    }),

  // React to a reel
  addReaction: protectedProcedure
    .input(
      z.object({
        reelId: z.string(),
        type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const reel = await ctx.db.reel.findUnique({
        where: { id: input.reelId },
        select: { userId: true },
      });

      if (!reel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reel not found",
        });
      }

      // Check if reaction already exists
      const existingReaction = await ctx.db.reaction.findFirst({
        where: {
          userId,
          reelId: input.reelId,
        },
      });

      if (existingReaction) {
        if (existingReaction.type === input.type) {
          // Remove reaction if clicking the same reaction
          await ctx.db.reaction.delete({
            where: { id: existingReaction.id },
          });
          return { success: true, action: "removed" };
        } else {
          // Update existing reaction
          await ctx.db.reaction.update({
            where: { id: existingReaction.id },
            data: { type: input.type },
          });
          return { success: true, action: "updated" };
        }
      } else {
        // Create new reaction
        await ctx.db.reaction.create({
          data: {
            type: input.type,
            userId,
            reelId: input.reelId,
          },
        });

        // Create notification if the reel is not by the current user
        if (reel.userId !== userId) {
          await ctx.db.notification.create({
            data: {
              type: "reaction",
              content: `reacted with ${input.type} to your reel`,
              senderId: userId,
              receiverId: reel.userId,
            },
          });
        }

        return { success: true, action: "added" };
      }
    }),

  // Delete a reel
  delete: protectedProcedure
    .input(z.object({ reelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const reel = await ctx.db.reel.findUnique({
        where: { id: input.reelId },
        select: { userId: true },
      });

      if (!reel) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Reel not found",
        });
      }

      if (reel.userId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to delete this reel",
        });
      }

      await ctx.db.reel.delete({
        where: { id: input.reelId },
      });

      return { success: true };
    }),

  // Get trending reels based on reactions
  getTrending: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        timeframe: z.enum(["day", "week", "month"]).default("week"),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      
      // Calculate start date based on timeframe
      const startDate = new Date();
      if (input.timeframe === "day") {
        startDate.setDate(startDate.getDate() - 1);
      } else if (input.timeframe === "week") {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // First get the most reacted reels
      const trendingReelIds = await ctx.db.reaction.groupBy({
        by: ["reelId"],
        where: {
          reelId: { not: null },
          createdAt: { gte: startDate },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: input.limit,
      });

      if (trendingReelIds.length === 0) {
        return { reels: [] };
      }

      // Then fetch the full reel data
      const reelIds = trendingReelIds
        .filter((item) => item.reelId !== null)
        .map((item) => item.reelId as string);

      const reels = await ctx.db.reel.findMany({
        where: {
          id: { in: reelIds },
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
              reactions: true,
            },
          },
          ...(userId
            ? {
                reactions: {
                  where: {
                    userId,
                  },
                  take: 1,
                },
              }
            : {}),
        },
      });

      // Sort the reels in the same order as the trending IDs
      const sortedReels = reelIds
        .map((id) => reels.find((reel) => reel.id === id))
        .filter((reel): reel is (typeof reels)[0] => reel !== undefined);

      return {
        reels: sortedReels.map((reel) => ({
          ...reel,
          userReaction: reel.reactions && reel.reactions.length > 0 
            ? reel.reactions[0].type 
            : null,
          reactions: undefined,
        })),
      };
    }),
});
