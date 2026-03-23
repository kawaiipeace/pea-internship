import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ApplicationRequestTimeoutService } from "./service";

const service = new ApplicationRequestTimeoutService();

export const applicationRequestTimeoutCron = new Elysia().use(
  cron({
    name: "abort-expired-pending-request",
    pattern: "0 00 * * *", // everyday at 1am
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.abortExpiredPendingRequests();
    },
  })
);