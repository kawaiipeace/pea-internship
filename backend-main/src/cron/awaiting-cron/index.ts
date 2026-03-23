import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { AwaitingCronService } from "./service";

const service = new AwaitingCronService();

export const awaitingCron = new Elysia().use(
  cron({
    name: "activate-awaiting-internships",
    pattern: "0 00 * * *", // everyday at 12am
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.updateAwaitingToActive();
    },
  })
);
