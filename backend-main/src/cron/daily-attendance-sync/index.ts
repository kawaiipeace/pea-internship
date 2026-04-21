import { cron } from "@elysiajs/cron";
import { Elysia } from "elysia";
import { CheckTimeService } from "../daily-attendance-sync/service";

const checkTimeService = new CheckTimeService();

export const dailyAttendanceSyncCron = new Elysia({
  tags: ["Cronjobs"],
}).use(
  cron({
    name: "daily-attendance-sync",
    pattern: "30 19 * * 1-5",
    timezone: "Asia/Bangkok",
    async run() {
      console.log("⏰ [CRON] Starting Daily Attendance Sync...");
      try {
        await checkTimeService.syncDailyAttendance();
      } catch (error) {
        console.error("❌ [CRON] Daily Attendance Sync Failed:", error);
      }
    },
  })
);
