import { router } from "@/lib/trpc/server";
import { userRouter } from "@/server/api/routers/user";
import { postRouter } from "@/server/api/routers/post";
import { messageRouter } from "@/server/api/routers/message";
import { storyRouter } from "@/server/api/routers/story";
import { reelRouter } from "@/server/api/routers/reel";
import { notificationRouter } from "@/server/api/routers/notification";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  message: messageRouter,
  story: storyRouter,
  reel: reelRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
