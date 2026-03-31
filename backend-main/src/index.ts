import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { logger } from "elysia-logger";
import swagger from "@/config/swagger";
import { auth } from "@/lib/auth";
import { errorMiddleware } from "@/middlewares/error.middleware";
import modules from "@/modules";
import { applicationInterviewTimeoutCron } from "./cron/application-interview-timeout";
import { applicationRequestTimeoutCron } from "./cron/application-request-timeout";
import { applicationTranscriptTimeoutCron } from "./cron/application-transcript-timeout";
import { awaitingCron } from "./cron/awaiting-cron";

const PORT = Bun.env.PORT ? parseInt(Bun.env.PORT, 10) : 8080;
const app = new Elysia()
  .use(
    cors({
      origin: ["http://localhost:2700", "http://localhost:2701", "https://pea-internship-main.vercel.app", "https://pea-internship-itt.vercel.app"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  )
  .use(logger())
  .use(swagger)
  .use(errorMiddleware)
  .use(modules)
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .use(applicationTranscriptTimeoutCron)
  .use(applicationRequestTimeoutCron)
  .use(awaitingCron)
  .use(applicationInterviewTimeoutCron)
  .listen(PORT);

console.log(
  `🦊 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation is running at http://${app.server?.hostname}:${app.server?.port}/docs`
);
