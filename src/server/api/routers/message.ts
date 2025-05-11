import { z } from "zod";
import { protectedProcedure, router } from "@/lib/trpc/server";
import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";

export const messageRouter = router({
  // Send a message to another user
  send: protectedProcedure
    .input(
      z.object({
        receiverId: z.string(),
        content: z.string(),
        contentType: z.enum(["text", "image", "video", "audio"]).default("text"),
        encrypted: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;
      
      if (senderId === input.receiverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send message to yourself",
        });
      }

      // Check if receiver exists
      const receiver = await ctx.db.user.findUnique({
        where: { id: input.receiverId },
      });

      if (!receiver) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Receiver not found",
        });
      }

      // Handle encryption if needed
      let encryptedContent;
      let encryptionKey;

      if (input.encrypted) {
        // Generate a random encryption key
        encryptionKey = crypto.randomBytes(32).toString('hex');
        
        // Encrypt the content using AES-256-GCM
        const cipher = crypto.createCipheriv(
          'aes-256-gcm', 
          Buffer.from(encryptionKey, 'hex'),
          crypto.randomBytes(16) // IV
        );
        
        encryptedContent = 
          cipher.update(input.content, 'utf8', 'hex') + 
          cipher.final('hex');
      }

      // Create and save the message
      const message = await ctx.db.message.create({
        data: {
          content: input.encrypted ? "" : input.content, // Clear text content only if not encrypted
          encryptedContent: encryptedContent,
          encryptionKey: encryptionKey,
          contentType: input.contentType,
          senderId,
          receiverId: input.receiverId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      return message;
    }),

  // Get conversation with another user
  getConversation: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      
      // Get messages (sent and received) between the two users
      const messages = await ctx.db.message.findMany({
        where: {
          OR: [
            {
              senderId: currentUserId,
              receiverId: input.userId,
            },
            {
              senderId: input.userId,
              receiverId: currentUserId,
            },
          ],
          groupId: null, // Only direct messages, not group messages
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
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
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      // Mark messages as read
      await ctx.db.message.updateMany({
        where: {
          senderId: input.userId,
          receiverId: currentUserId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return {
        messages: messages.reverse(), // Return in ascending order by time
        nextCursor,
      };
    }),

  // Get recent conversations (chat list)
  getRecentConversations: protectedProcedure.query(async ({ ctx }) => {
    const currentUserId = ctx.session.user.id;

    // Get users with whom the current user has exchanged messages
    const conversationUsers = await ctx.db.$queryRaw`
      SELECT 
        DISTINCT 
        CASE 
          WHEN m.senderId = ${currentUserId} THEN m.receiverId 
          ELSE m.senderId 
        END as userId,
        MAX(m.createdAt) as lastMessageAt
      FROM Message m
      WHERE 
        (m.senderId = ${currentUserId} OR m.receiverId = ${currentUserId})
        AND m.groupId IS NULL
      GROUP BY userId
      ORDER BY lastMessageAt DESC
      LIMIT 20
    `;

    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      (conversationUsers as { userId: string; lastMessageAt: Date }[]).map(
        async ({ userId }) => {
          const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          });

          const lastMessage = await ctx.db.message.findFirst({
            where: {
              OR: [
                {
                  senderId: currentUserId,
                  receiverId: userId,
                },
                {
                  senderId: userId,
                  receiverId: currentUserId,
                },
              ],
              groupId: null,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              content: true,
              encryptedContent: true,
              contentType: true,
              createdAt: true,
              senderId: true,
              readAt: true,
            },
          });

          const unreadCount = await ctx.db.message.count({
            where: {
              senderId: userId,
              receiverId: currentUserId,
              readAt: null,
              groupId: null,
            },
          });

          return {
            user,
            lastMessage,
            unreadCount,
          };
        }
      )
    );

    return conversations;
  }),

  // Create a group
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        memberIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      
      // Create the group
      const group = await ctx.db.group.create({
        data: {
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          members: {
            create: [
              // Add current user as admin
              {
                userId: currentUserId,
                role: "admin",
              },
              // Add other members
              ...input.memberIds.map((memberId) => ({
                userId: memberId,
                role: "member",
              })),
            ],
          },
        },
        include: {
          members: {
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
          },
        },
      });

      return group;
    }),

  // Send a message to a group
  sendToGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        content: z.string(),
        contentType: z.enum(["text", "image", "video", "audio"]).default("text"),
        encrypted: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const senderId = ctx.session.user.id;
      
      // Check if user is a member of the group
      const membership = await ctx.db.groupMember.findFirst({
        where: {
          userId: senderId,
          groupId: input.groupId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      // Handle encryption if needed
      let encryptedContent;
      let encryptionKey;

      if (input.encrypted) {
        // Generate a random encryption key
        encryptionKey = crypto.randomBytes(32).toString('hex');
        
        // Encrypt the content
        const cipher = crypto.createCipheriv(
          'aes-256-gcm', 
          Buffer.from(encryptionKey, 'hex'),
          crypto.randomBytes(16) // IV
        );
        
        encryptedContent = 
          cipher.update(input.content, 'utf8', 'hex') + 
          cipher.final('hex');
      }

      // Create the message
      const message = await ctx.db.message.create({
        data: {
          content: input.encrypted ? "" : input.content,
          encryptedContent: encryptedContent,
          encryptionKey: encryptionKey,
          contentType: input.contentType,
          senderId,
          receiverId: senderId, // Placeholder for group messages
          groupId: input.groupId,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          group: true,
        },
      });

      return message;
    }),

  // Get group messages
  getGroupMessages: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      
      // Check if user is a member of the group
      const membership = await ctx.db.groupMember.findFirst({
        where: {
          userId: currentUserId,
          groupId: input.groupId,
        },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }

      // Get messages for the group
      const messages = await ctx.db.message.findMany({
        where: {
          groupId: input.groupId,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          sender: {
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
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages: messages.reverse(), // Return in ascending order by time
        nextCursor,
      };
    }),

  // Add reaction to a message
  addMessageReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        type: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if message exists
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
      });

      if (!message) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Message not found",
        });
      }

      // Check if reaction already exists
      const existingReaction = await ctx.db.reaction.findFirst({
        where: {
          userId,
          messageId: input.messageId,
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
            messageId: input.messageId,
          },
        });
      }

      return { success: true };
    }),

  // Remove reaction from a message
  removeMessageReaction: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.db.reaction.deleteMany({
        where: {
          userId,
          messageId: input.messageId,
        },
      });

      return { success: true };
    }),
});
