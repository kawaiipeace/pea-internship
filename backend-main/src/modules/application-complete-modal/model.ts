import { t } from "elysia";

export const ApplicationCompleteModalResponse = t.Object({
  shouldShow: t.Boolean(),
  applicationStatusId: t.Nullable(t.Number()),
  title: t.Nullable(t.String()),
  message: t.Nullable(t.String()),
});

export type ApplicationCompleteModalResponseType =
  typeof ApplicationCompleteModalResponse.static;

export const AcknowledgeApplicationCompleteModalResponse = t.Object({
  message: t.String(),
});

export type AcknowledgeApplicationCompleteModalResponseType =
  typeof AcknowledgeApplicationCompleteModalResponse.static;
