import { Elysia } from "elysia";
import { isAuthenticated } from "@/middlewares/auth.middleware";
import { CheckTimeService } from "./service";

const checkTimeService = new CheckTimeService();

export const checkTime = new Elysia({
  prefix: "/check-time",
  tags: ["check-time"],
})
  .use(isAuthenticated)
  .post(
    "/in",
    async ({ body, set, headers, user }) => {
      const userId = user.id;
      const ipAddress =
        headers["x-forwarded-for"] || headers["x-real-ip"] || "unknown";
      const result = checkTimeService.in();

      set.status = 201;
      return result;
    },
    {
      role: [1],
    }
  );
