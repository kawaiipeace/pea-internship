import { Elysia } from "elysia";
import { application } from "./application";
import { applicationStatusActionsModule } from "./application_status_actions";
import { applicationCompleteModal } from "./application-complete-modal";
import { ApplicationDocuments } from "./application-documents";
import { auth } from "./auth";
import { checkTime } from "./check-time";
import { department } from "./department";
import { favorite } from "./favorite";
import { file } from "./file";
import { institution } from "./institution";
import { institutionTicketRoutes } from "./institution-ticket/route";
import { leave } from "./leave-requests";
import { ownerStudents } from "./manualEndInternships";
import { notification } from "./notification";
import { offsiteTasks } from "./outside";
import { position } from "./positions";
import { role } from "./role";
import { staffLogs } from "./staff-logs";
import { user } from "./user";

const modules = new Elysia({ prefix: "/api" })
  .use(department)
  .use(role)
  .use(auth)
  .use(position)
  .use(user)
  .use(institution)
  .use(favorite)
  .use(institutionTicketRoutes)
  .use(application)
  .use(notification)
  .use(ApplicationDocuments)
  .use(ownerStudents)
  .use(staffLogs)
  .use(offsiteTasks)
  .use(checkTime)
  .use(leave)
  .use(file)
  .use(applicationStatusActionsModule)
  .use(applicationCompleteModal);
export default modules;
