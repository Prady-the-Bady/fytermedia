import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "@/lib/trpc/server";
import { hash } from "bcrypt";

export const userRouter = router({
  // Get current user
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return user;
  }),

  // Get user by username
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          username: input.username,
        },
        include: {
          _count: {
            select: {
              followers: true,
              following: true,
              posts: true,
            },
          },
        },
      });

      return user;
    }),

  // Create new user
  register: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        username: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await ctx.db.user.findFirst({
        where: {
          OR: [
            { email: input.email },
            { username: input.username },
          ],
        },
      });

      if (existingUser) {
        throw new Error("User with this email or username already exists");
      }

      const hashedPassword = await hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          username: input.username,
          hashedPassword,
        },
      });

      return { success: true, userId: user.id };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        image: z.string().optional(),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: input,
      });

      return updatedUser;
    }),

  // Follow user
  followUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;
      
      if (input.userId === currentUserId) {
        throw new Error("You cannot follow yourself");
      }

      const existingFollow = await ctx.db.follow.findFirst({
        where: {
          followerId: currentUserId,
          followingId: input.userId,
        },
      });

      if (existingFollow) {
        throw new Error("Already following this user");
      }

      await ctx.db.follow.create({
        data: {
          followerId: currentUserId,
          followingId: input.userId,
        },
      });

      // Create notification
      await ctx.db.notification.create({
        data: {
          type: "follow",
          senderId: currentUserId,
          receiverId: input.userId,
        },
      });

      return { success: true };
    }),

  // Unfollow user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUserId = ctx.session.user.id;

      await ctx.db.follow.deleteMany({
        where: {
          followerId: currentUserId,
          followingId: input.userId,
        },
      });

      return { success: true };
    }),

  // Get user followers
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string(), limit: z.number().default(10), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const followers = await ctx.db.follow.findMany({
        where: {
          followingId: input.userId,
        },
        include: {
          follower: true,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | undefined = undefined;
      if (followers.length > input.limit) {
        const nextItem = followers.pop();
        nextCursor = nextItem?.id;
      }

      return {
        followers: followers.map((follow) => follow.follower),
        nextCursor,
      };
    }),

  // Get user following
  getFollowing: publicProcedure
    .input(z.object({ userId: z.string(), limit: z.number().default(10), cursor: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const following = await ctx.db.follow.findMany({
        where: {
          followerId: input.userId,
        },
        include: {
          following: true,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor: string | undefined = undefined;
      if (following.length > input.limit) {
        const nextItem = following.pop();
        nextCursor = nextItem?.id;
      }

      return {
        following: following.map((follow) => follow.following),
        nextCursor,
      };
    }),

  // Get user reputation score
  getReputationScore: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          reputationScore: true,
        },
      });

      return user?.reputationScore || 0;
    }),
});
