import { Elysia } from "elysia";
import * as model from "./model";
import { AuthService } from "./service";

const authService = new AuthService();

export const auth = new Elysia({ prefix: "/auth", tags: ["Authentication"] })
  .post(
    "/sign-up/intern",
    async ({ body, set }) => {
      const response = authService.registerIntern(body);

      set.status = 201;
      return response;
    },
    {
      body: model.RegisterInternBody,
    }
  )

  .post(
    "/sign-in/intern",
    async ({ body, set }) => {
      const response = authService.login(body);

      set.status = 200;
      return response;
    },
    {
      body: model.LoginInternBody,
    }
  )

  .post(
    "/sign-in/intern/itt",
    async ({ body, set }) => {
      const response = authService.login_itt(body);

      set.status = 200;
      return response;
    },
    {
      body: model.LoginInternBody,
    }
  )

  .get("/sign-in/keycloak", async ({ request }) => {
    const authResponse = await authService.loginWithKeycloak(request.headers);
    // Better Auth returns JSON {url, redirect: true} as 200 - need to issue proper 302
    // while preserving Set-Cookie headers (state cookie for OAuth verification)
    const body = await authResponse
      .clone()
      .json()
      .catch(() => null);
    if (body?.url) {
      const headers = new Headers(authResponse.headers);
      headers.set("Location", body.url);
      return new Response(null, { status: 302, headers });
    }
    return authResponse;
  })

  .post("/sign-out", async ({ request, set }) => {
    const response = await authService.logout(request.headers);

    set.status = 200;
    return response;
  });
