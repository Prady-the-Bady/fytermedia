import { router } from "@/lib/trpc/server";
import { userRouter } from "./routers/user";
import { postRouter } from "./routers/post";
import { messageRouter } from "./routers/message";
import { storyRouter } from "./routers/story";
import { reelRouter } from "./routers/reel";
import { notificationRouter } from "./routers/notification";

export const appRouter = router({
  user: userRouter,
  post: postRouter,
  message: messageRouter,
  story: storyRouter,
  reel: reelRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
