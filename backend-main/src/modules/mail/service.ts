import nodemailer from "nodemailer";

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

  buildStudentNotificationEmail(params: {
    title: string;
    studentName?: string | null;
    message: string;
  }) {
    const { title, studentName, message } = params;

    return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2 style="margin-bottom: 16px;">${title}</h2>
        <p>เรียน ${studentName?.trim() || "นักศึกษา"}</p>
        <p>${message}</p>
        <br />
        <p>ระบบ PEA Internship</p>
      </div>
    `;
  }
}