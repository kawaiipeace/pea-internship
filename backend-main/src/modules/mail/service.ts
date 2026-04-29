import nodemailer from "nodemailer";
import {
  acceptTemplate,
  cancelTemplate,
  completeTemplate,
  positionFilledTemplate,
  rejectDocTemplate,
  rejectTemplate,
  resetPasswordTemplate,
} from "./templates";

const rawAppUrl = process.env.APP_URL;

if (!rawAppUrl) {
  throw new Error("APP_URL is not set in environment variables");
}

const APP_URL = `${rawAppUrl.replace(/\/+$/, "")}/`;

export async function sendResetPasswordCodeEmail(to: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject: "Reset Password Code",
    html: resetPasswordTemplate({ code }),
  });
}

export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendEmail(to: string, subject: string, html: string) {
    if (!to) {
      throw new Error("Email recipient is required");
    }

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  }

  buildAcceptedForInternshipEmail(params: {
    firstname: string;
    lastname: string;
    positionName: string;
    departmentName: string;
  }) {
    return {
      subject: "โปรดอัปโหลดเอกสารขอความอนุเคราะห์",
      html: acceptTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        position: params.positionName,
        department: params.departmentName,
        appUrl: APP_URL,
      }),
    };
  }

  buildInternshipCompletedEmail(params: {
    firstname: string;
    lastname: string;
    positionName: string;
    departmentName: string;
  }) {
    return {
      subject: "คุณผ่านเข้าฝึกงานแล้ว",
      html: completeTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        position: params.positionName,
        department: params.departmentName,
        appUrl: APP_URL,
      }),
    };
  }

  buildDocumentRejectedEmail(params: {
    firstname: string;
    lastname: string;
  }) {
    return {
      subject: "เอกสารถูกตีกลับ",
      html: rejectDocTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        appUrl: APP_URL,
      }),
    };
  }

  buildRejectedByOwnerEmail(params: {
    firstname: string;
    lastname: string;
    positionName: string;
    departmentName: string;
  }) {
    return {
      subject: "ผลการสมัครฝึกงาน",
      html: rejectTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        position: params.positionName,
        department: params.departmentName,
        appUrl: APP_URL,
      }),
    };
  }

  buildInternshipCanceledEmail(params: {
    firstname: string;
    lastname: string;
    positionName: string;
    departmentName: string;
  }) {
    return {
      subject: "การฝึกงานถูกยกเลิก",
      html: cancelTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        position: params.positionName,
        department: params.departmentName,
        appUrl: APP_URL,
      }),
    };
  }

  buildPositionFilledEmail(params: {
    firstname: string;
    lastname: string;
    positionName: string;
    departmentName: string;
  }) {
    return {
      subject: "การสมัครถูกยกเลิกเนื่องจากตำแหน่งเต็ม",
      html: positionFilledTemplate({
        firstName: params.firstname,
        lastName: params.lastname,
        position: params.positionName,
        department: params.departmentName,
        appUrl: APP_URL,
      }),
    };
  }
}