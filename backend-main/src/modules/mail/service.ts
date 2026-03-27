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
    <div style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center">

            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">

                <!-- Header -->
                <tr>
                <td style="background-color:#ad2c94;padding:20px;text-align:center;color:#ffffff;">
                    <h2 style="margin:0;">PEA Internship</h2>
                </td>
                </tr>

                <!-- Body -->
                <tr>
                <td style="padding:30px;color:#333333;">
                    <h3 style="margin-top:0;color:#ad2c94;">${title}</h3>

                    <p style="font-size:16px;">
                    เรียน ${studentName ?? "นักศึกษา"}
                    </p>

                    <p style="font-size:15px;line-height:1.6;">
                    ${message}
                    </p>

                    <p style="font-size:13px;color:#888888;">
                    หากคุณไม่ได้ทำรายการนี้ สามารถละเว้นอีเมลฉบับนี้ได้
                    </p>
                </td>
                </tr>

                <!-- Footer -->
                <tr>
                <td style="background-color:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#999999;">
                    © ${new Date().getFullYear()} PEA Internship System
                </td>
                </tr>

            </table>

            </td>
        </tr>
        </table>
    </div>
    `;
  }
}
