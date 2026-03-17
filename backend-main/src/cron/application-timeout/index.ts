import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ApplicationTimeoutService } from "./service";

const service = new ApplicationTimeoutService();

export const applicationTimeoutCron = new Elysia().use(
  cron({
    name: "cancel-pending-document",
    pattern: "0 01 * * *", // everyday at 1am
    // pattern: "*/1 * * * * *", // test
    async run() {
      await service.cancelExpiredApplications();
    },
  })
);
