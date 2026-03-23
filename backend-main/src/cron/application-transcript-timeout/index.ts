import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ApplicationTimeoutService } from "./service";

const service = new ApplicationTimeoutService();

export const applicationTranscriptTimeoutCron = new Elysia().use(
  cron({
    name: "cancel-pending-document",
    pattern: "0 00 * * *", // everyday at 1am
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.cancelExpiredApplications();
    },
  })
);
