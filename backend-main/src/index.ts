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
import { dailyAttendanceSyncCron } from "./cron/daily-attendance-sync";

const PORT = Bun.env.PORT ? parseInt(Bun.env.PORT, 10) : 8080;

// Parse extra allowed origins from env (comma-separated)
const extraOrigins = Bun.env.ALLOWED_ORIGINS
  ? Bun.env.ALLOWED_ORIGINS.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [
  "http://localhost:2700",
  "http://localhost:2701",
  "https://pea-internship-main.vercel.app",
  "https://pea-internship-itt.vercel.app",
  ...extraOrigins,
];

// Elysia's CORS plugin does NOT merge set.headers into native Response objects returned
// from handlers. Better Auth's auth.handler() returns native Responses, so we must
// manually inject CORS headers to allow cross-domain credential requests from the frontend.
function withCorsHeaders(
  response: Response,
  requestOrigin: string | null
): Response {
  const headers = new Headers(response.headers);
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
    headers.set("Access-Control-Allow-Origin", requestOrigin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const app = new Elysia()
  .use(
    cors({
      origin: ALLOWED_ORIGINS,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  )
  .use(logger())
  .use(swagger)
  .use(errorMiddleware)
  .use(modules)
  .all("/api/auth/*", async ({ request }) => {
    const response = await auth.handler(request);
    return withCorsHeaders(response, request.headers.get("origin"));
  })
  .use(applicationTranscriptTimeoutCron)
  .use(applicationRequestTimeoutCron)
  .use(awaitingCron)
  .use(dailyAttendanceSyncCron)
  .use(applicationInterviewTimeoutCron)
  .listen(PORT);

console.log(
  `🦊 Server is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation is running at http://${app.server?.hostname}:${app.server?.port}/docs`
);
