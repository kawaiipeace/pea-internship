import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { PositionStatusCronService } from "./service";

const service = new PositionStatusCronService();

export const positionStatusCron = new Elysia().use(
  cron({
    name: "position-status-cron",
    pattern: "0 0 0 * * *",
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.updatePositionStatuses();
    },
  })
);
