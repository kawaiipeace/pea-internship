# PEA Internship API Documentation - Mentor Module

This document lists the API endpoints used across the `/mentor/*` pages in the `frontend-itt` application.

## 1. Attendance Approval & History
**Pages:** `/mentor/approve`, `/mentor/approve/history`

- **`GET /leave/mentor/requests`**
  - **Description**: Fetches leave requests for the mentor.
  - **Params**: `page`, `limit`, `status` (PENDING, APPROVED, REJECTED), `viewType` (MINE, ALL).
- **`GET /check-time/mentor/corrections`**
  - **Description**: Fetches time correction requests.
  - **Params**: `page`, `limit`, `status` (PENDING, APPROVED, REJECTED), `viewType` (MINE, ALL).
- **`GET /check-time/file`**
  - **Description**: Downloads/Views attachment files for leave or time corrections.
  - **Params**: `key` (file path).
- **`POST /leave/bulk-reject`**
  - **Description**: Rejects one or more leave requests.
  - **Body**: `{ ids: number[], reason: string }`
- **`POST /leave/bulk-approve`**
  - **Description**: Approves one or more leave requests.
  - **Body**: `{ ids: number[] }`
- **`POST /check-time/mentor/corrections/${id}/reject`**
  - **Description**: Rejects a specific time correction request.
  - **Body**: `{ reason: string }`
- **`POST /check-time/mentor/corrections/${id}/approve`**
  - **Description**: Approves a specific time correction request.

---

## 2. Student Management
**Pages:** `/mentor/students`

- **`GET /mentor/students`**
  - **Description**: Lists students currently under the mentor's supervision.
- **`GET /mentor/students/${id}`**
  - **Description**: Fetches summary data and specific profile details for a student to populate the list table.

---

## 3. Student Details
**Pages:** `/mentor/students/[id]`

- **`GET /mentor/students/${id}`**
  - **Description**: Fetches full student profile, internship progress (hours), and detailed attendance logs.
- **`GET /leave/mentor/requests`**
  - **Description**: Used to fetch leave history and merge reason/status data into the attendance list.
- **`GET /files/${key}`**
  - **Description**: Fetches attachments (PDFs or images) related to attendance evidence.

---

## 4. Remote Work (Off-site Tasks)
**Pages:** `/mentor/remote-work`, `/admin/mentor/remote-work/[id]`, `/admin/mentor/remote-work/form`

- **`GET /offsite-tasks/mentor`**
  - **Description**: Lists offsite tasks assigned to students.
  - **Params**: `month`, `year`, `page`, `limit`, `sortBy`, `sortOrder`, `viewMode` (mine, all), `targetMentorId`.
- **`GET /offsite-tasks/${id}`**
  - **Description**: Fetches full details for a specific offsite task.
- **`POST /offsite-tasks`**
  - **Description**: Creates a new offsite task assignment.
  - **Body**: `{ workDate, locationName, taskDetail, note, studentIds: string[] }`
- **`PATCH /offsite-tasks/${id}`**
  - **Description**: Updates an existing offsite task.
  - **Body**: Same as POST.
- **`DELETE /offsite-tasks/${id}`**
  - **Description**: Deletes an offsite task.
- **`GET /user/profile`**
  - **Description**: Fetches current user detail to filter or default department-related choices.
- **`GET /user/staff`**
  - **Description**: Lists staff members (mentors/admins) in the same department for filtering task assigners.
- **`GET /user/student`**
  - **Description**: Lists available students in the department to be assigned to offsite tasks.