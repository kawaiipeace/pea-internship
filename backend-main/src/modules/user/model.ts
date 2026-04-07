import { type Static, t } from "elysia";

export const createProfile = t.Object({
  image: t.Optional(
    t.File({
      maxSize: 5 * 1024 * 1024,
      error: "File is required (key: 'image') and must be less than 5MB",
    })
  ),
  nickname: t.Optional(t.String()),
});

export type createProfile = Static<typeof createProfile>;
