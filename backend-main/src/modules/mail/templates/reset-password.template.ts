export type ResetPasswordTemplateParams = {
  code: string;
};

export function resetPasswordTemplate({ code }: ResetPasswordTemplateParams) {
  return `
    <!DOCTYPE html>
    <html lang="th">
        <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>รีเซ็ตรหัสผ่าน</title>
        </head>
        <body style="width:100%;height:100%;font-family:Inter, Arial, sans-serif;padding:0;margin:0;background-color:#F6F6F6;">
        <div style="background-color:#F6F6F6;padding:30px 0;">
            <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;">
            <tr>
                <td align="center">
                <table width="600" cellspacing="0" cellpadding="0" style="background-color:#fffafe;border-radius:24px 24px 0 0;width:600px;">
                    <tr>
                    <td style="padding:20px 20px 20px 30px;">
                        <table width="100%">
                        <tr>
                            <td width="64">
                            <img src="https://abfipk.stripocdn.email/content/guids/CABINET_873f307a11bdd01c976f099f26c7494bb58bb20cb7eb120602ec346ffa307adf/images/internshiplogo.png" width="64" style="display:block;border:0;" alt="PEA Internship" />
                            </td>
                            <td style="padding-left:20px;">
                            <h3 style="margin:0;font-size:26px;line-height:36px;color:#a80689;">
                                <strong>PEA Internship</strong>
                            </h3>
                            </td>
                        </tr>
                        </table>
                    </td>
                    </tr>
                </table>

                <table width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;width:600px;">
                    <tr>
                    <td align="center" style="padding:35px;">
                        <h1 style="margin:0 0 15px;font-size:36px;line-height:43px;color:#333333;">
                        รีเซ็ตรหัสผ่าน
                        </h1>

                        <p style="margin:0 0 20px;font-size:16px;line-height:24px;color:#333333;">
                        กรุณานำรหัสด้านล่างไปกรอกในหน้ารีเซ็ตรหัสผ่านของระบบ PEA Internship
                        </p>

                        <div style="background:#fffafe;border:2px dashed #a80689;border-radius:12px;padding:20px 30px;margin:20px 0;">
                        <div style="font-size:42px;line-height:52px;letter-spacing:8px;font-weight:bold;color:#a80689;">
                            ${code}
                        </div>
                        </div>

                        <p style="margin:0;font-size:16px;line-height:24px;color:#333333;">
                        รหัสนี้จะหมดอายุภายใน <strong>10 นาที</strong>
                        </p>

                        <p style="margin:15px 0 0;font-size:14px;line-height:22px;color:#666666;">
                        หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้
                        </p>
                    </td>
                    </tr>
                </table>

                <table width="600" cellspacing="0" cellpadding="0" style="background-color:#eae9e9;border-radius:0 0 24px 24px;width:600px;">
                    <tr>
                    <td align="center" style="padding:15px;">
                        <p style="margin:0;font-size:14px;line-height:28px;color:#113F37;">
                        © 2026 PEA Internship
                        </p>
                        <p style="margin:0;font-size:14px;line-height:28px;color:#113F37;">
                        200 Ngamwongwan Rd, Lat Yao, Chatuchak, Bangkok 10900
                        </p>
                    </td>
                    </tr>
                </table>
                </td>
            </tr>
            </table>
        </div>
        </body>
    </html>
    `;
}
