import { t } from "elysia";

export const params = t.Object({
  id: t.Numeric(),
});

export const GetPositionsQuery = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 10 })),
  search: t.Optional(t.String()),
  department: t.Optional(t.Numeric()),
  office: t.Optional(t.Numeric()),
});

export const CreatePositionBody = t.Object({
  name: t.String(),
  location: t.Optional(t.Nullable(t.String())),
  positionCount: t.Optional(t.Nullable(t.Numeric())),
  major: t.Optional(t.Nullable(t.String())),

  recruitStart: t.Optional(t.Nullable(t.String())),
  recruitEnd: t.Optional(t.Nullable(t.String())),
  applyStart: t.Optional(t.Nullable(t.String())),
  applyEnd: t.Optional(t.Nullable(t.String())),

  resumeRq: t.Optional(t.Boolean()),
  portfolioRq: t.Optional(t.Boolean()),

  jobDetails: t.Optional(t.Nullable(t.String())),
  requirement: t.Optional(t.Nullable(t.String())),
  benefits: t.Optional(t.Nullable(t.String())),

  recruitmentStatus: t.Union([
    t.Literal("NOT_OPEN_YET"),
    t.Literal("OPEN"),
    t.Literal("CLOSE"),
    t.Literal("EXPIRED"),
  ]),

  mentorStaffIds: t.Optional(t.Array(t.Numeric())),
});

export const UpdatePositionBody = t.Object({
  name: t.Optional(t.String()),
  location: t.Optional(t.Nullable(t.String())),
  positionCount: t.Optional(t.Nullable(t.Numeric())),
  major: t.Optional(t.Nullable(t.String())),

  recruitStart: t.Optional(t.Nullable(t.String())),
  recruitEnd: t.Optional(t.Nullable(t.String())),
  applyStart: t.Optional(t.Nullable(t.String())),
  applyEnd: t.Optional(t.Nullable(t.String())),

  resumeRq: t.Optional(t.Boolean()),
  portfolioRq: t.Optional(t.Boolean()),

  jobDetails: t.Optional(t.Nullable(t.String())),
  requirement: t.Optional(t.Nullable(t.String())),
  benefits: t.Optional(t.Nullable(t.String())),

  recruitmentStatus: t.Optional(
    t.Union([
      t.Literal("NOT_OPEN_YET"),
      t.Literal("OPEN"),
      t.Literal("CLOSE"),
      t.Literal("EXPIRED"),
    ])
  ),

  mentorStaffIds: t.Optional(t.Array(t.Numeric())),
  positionOwner: t.Optional(t.String()),
});

export type GetPositionsQueryType = typeof GetPositionsQuery.static;
export type CreatePositionBodyType = typeof CreatePositionBody.static;
export type UpdatePositionBodyType = typeof UpdatePositionBody.static;
export type ParamsType = typeof params.static;