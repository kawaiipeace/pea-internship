import { t } from "elysia";

export const GetStudentsUnderCareQuery = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 10 })),
  search: t.Optional(t.String()),
  startDate: t.Optional(t.String({ description: "YYYY-MM-DD" })),
  endDate: t.Optional(t.String({ description: "YYYY-MM-DD" })),
  viewType: t.Optional(
    t.Union([t.Literal("MINE"), t.Literal("ALL")], {
      default: "MINE",
    })
  ),
});

export type GetStudentsUnderCareQueryType =
  typeof GetStudentsUnderCareQuery.static;

export const GetStudentDetailParams = t.Object({
  studentId: t.String({ description: "User ID ของนักศึกษา" }),
});

export const GetStudentDetailQuery = t.Object({
  page: t.Optional(t.Numeric({ default: 1 })),
  limit: t.Optional(t.Numeric({ default: 10 })),
});

export type GetStudentDetailParamsType = typeof GetStudentDetailParams.static;
export type GetStudentDetailQueryType = typeof GetStudentDetailQuery.static;
