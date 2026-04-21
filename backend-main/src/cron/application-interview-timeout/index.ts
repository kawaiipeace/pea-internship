import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { ApplicationInterviewTimeoutService } from "./service";

const service = new ApplicationInterviewTimeoutService();

export const applicationInterviewTimeoutCron = new Elysia({
  tags: ["Cronjobs"],
}).use(
  cron({
    name: "abort-pending-interview",
    pattern: "0 00 * * *", // everyday at 12am
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.abortExpiredPendingInterviewApplications();
    },
  })
);
