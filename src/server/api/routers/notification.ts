import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";

// Define SessionUser type to handle user ID properly
declare module "next-auth" {
  interface User {
    id: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export const notificationRouter = router({
  // Get all notifications for the current user
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        onlyUnread: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, onlyUnread } = input;
      // Access the user ID directly from the session
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const notifications = await ctx.db.notification.findMany({
        where: {
          receiverId: userId,
          ...(onlyUnread ? { isRead: false } : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          post: {
            select: {
              id: true,
              caption: true,
              contentUrl: true,
              contentType: true,
            },
          },
          comment: {
            select: {
              id: true,
              content: true,
            },
          },
          story: {
            select: {
              id: true,
              mediaUrl: true,
              mediaType: true,
            },
          },
          reel: {
            select: {
              id: true,
              videoUrl: true,
              caption: true,
            },
          },
          message: {
            select: {
              id: true,
              content: true,
              contentType: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: notifications,
        nextCursor,
      };
    }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const notification = await ctx.db.notification.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.receiverId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have permission to mark this notification as read",
        });
      }

      return ctx.db.notification.update({
        where: {
          id: input.id,
        },
        data: {
          isRead: true,
        },
      });
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    return ctx.db.notification.updateMany({
      where: {
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }),

  // Create a notification
  create: protectedProcedure
    .input(
      z.object({
        receiverId: z.string(),
        type: z.enum([
          "LIKE",
          "COMMENT",
          "FOLLOW",
          "MENTION",
          "STORY_VIEW",
          "REEL_VIEW",
          "NEW_POST",
          "NEW_STORY",
          "NEW_REEL",
          "SYSTEM",
        ]),
        content: z.string(),
        postId: z.string().optional(),
        commentId: z.string().optional(),
        storyId: z.string().optional(),
        reelId: z.string().optional(),
        messageId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Access the user ID directly from the session
      const senderId = ctx.session.user.id;

      if (!senderId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      return ctx.db.notification.create({
        data: {
          type: input.type,
          content: input.content,
          receiverId: input.receiverId,
          senderId,
          postId: input.postId,
          commentId: input.commentId,
          storyId: input.storyId,
          reelId: input.reelId,
          messageId: input.messageId,
        },
      });
    }),

  // Delete notification
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      const notification = await ctx.db.notification.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Notification not found",
        });
      }

      if (notification.receiverId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this notification",
        });
      }

      return ctx.db.notification.delete({
        where: {
          id: input.id,
        },
      });
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    if (!userId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated",
      });
    }

    return ctx.db.notification.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }),
});
