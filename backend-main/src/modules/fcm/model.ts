import { type Static, t } from "elysia";

export const RegisterTokenRequest = t.Object({
  token: t.String(),
});

export type RegisterTokenRequest = Static<typeof RegisterTokenRequest>;
