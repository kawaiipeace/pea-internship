import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { InternshipCompleteCronService } from "./service";

const service = new InternshipCompleteCronService();

export const internshipCompleteCron = new Elysia().use(
  cron({
    name: "internship-complete-cron",
    pattern: "0 0 0 * * *",
    // pattern: "*/10 * * * * *", // test
    async run() {
      await service.updateToComplete();
    },
  })
);