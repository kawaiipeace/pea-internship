export type CompleteTemplateParams = {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  appUrl: string;
};

export function completeTemplate({
  firstName,
  lastName,
  position,
  department,
  appUrl,
}: CompleteTemplateParams) {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="th" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta content="IE=edge" http-equiv="X-UA-Compatible">
    <meta content="telephone=no" name="format-detection">
    <title>สมัครฝึกงานสำเรจ</title><!--[if (mso 16)]>
        <style type="text/css">
        a {text-decoration: none;}
        </style>
        <![endif]--><!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]--><!--[if gte mso 9]>
    <noscript>
            <xml>
            <o:OfficeDocumentSettings>
            <o:AllowPNG></o:AllowPNG>
            <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
            </xml>
        </noscript>
    <![endif]--><!--[if mso]><xml>
        <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
        <w:DontUseAdvancedTypographyReadingMail/>
        </w:WordDocument>
        </xml><![endif]--><!--[if !mso]><!-- -->
    <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet"><!--<![endif]-->
    <style type="text/css">
    .rollover:hover .rollover-first {
    max-height:0px!important;
    display:none!important;
    }
    .rollover:hover .rollover-second {
    max-height:none!important;
    display:block!important;
    }
    .rollover span {
    font-size:0px;
    }
    u + .body img ~ div div {
    display:none;
    }
    #outlook a {
    padding:0;
    }
    span.MsoHyperlink,
    span.MsoHyperlinkFollowed {
    color:inherit;
    mso-style-priority:99;
    }
    a.v {
    mso-style-priority:100!important;
    text-decoration:none!important;
    }
    a[x-apple-data-detectors],
    #MessageViewBody a {
    color:inherit!important;
    text-decoration:none!important;
    font-size:inherit!important;
    font-family:inherit!important;
    font-weight:inherit!important;
    line-height:inherit!important;
    }
    .j {
    display:none;
    float:left;
    overflow:hidden;
    width:0;
    max-height:0;
    line-height:0;
    mso-hide:all;
    }
    @media only screen and (max-width:600px) {.bj { padding-bottom:20px!important }.bi { padding-right:20px!important }.bh { padding-left:20px!important }*[class="gmail-fix"] { display:none!important }p, a { line-height:150%!important }h1, h1 a { line-height:120%!important }h2, h2 a { line-height:120%!important }h3, h3 a { line-height:120%!important }h4, h4 a { line-height:120%!important }h5, h5 a { line-height:120%!important }h6, h6 a { line-height:120%!important }.be p { }.bd p { }h1 { font-size:40px!important; text-align:left }h2 { font-size:32px!important; text-align:left }h3 { font-size:28px!important; text-align:left }h4 { font-size:24px!important; text-align:left }h5 { font-size:20px!important; text-align:left }h6 { font-size:16px!important; text-align:left }.bf p, .bf a { font-size:14px!important }.be p, .be a { font-size:18px!important }.bd p, .bd a { font-size:12px!important }.h, .h h1, .h h2, .h h3, .h h4, .h h5, .h h6 { text-align:center!important }.e .rollover:hover .rollover-second, .h .rollover:hover .rollover-second, .g .rollover:hover .rollover-second { display:inline!important }.r table, .s, .t { width:100%!important; border-collapse:separate!important }.o table, .p table, .q table, .o, .q, .p { width:100%!important; max-width:600px!important }.adapt-img { width:100%!important; height:auto!important }.h-auto { height:auto!important }.a .c, .a .c * { font-size:36px!important }.a .b, .a .b * { font-size:26px!important } }
    @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    .es-p-default {
    }
    .es-p-default {
        padding-top:20px;
        padding-right:20px;
        padding-left:20px;
    }
    @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
    </style>
    </head>
    <body class="body" style="width:100%;height:100%;font-family:Inter, Arial, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
    <div dir="ltr" lang="th" class="es-wrapper-color" style="background-color:#F6F6F6"><!--[if gte mso 9]>
                <v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
                    <v:fill type="tile" color="#f6f6f6"></v:fill>
                </v:background>
            <![endif]-->
    <table cellpadding="0" cellspacing="0" role="none" width="100%" class="es-wrapper" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%">
        <tr>
        <td valign="top" style="padding:0;Margin:0">
        <table align="center" background cellpadding="0" cellspacing="0" role="none" class="p" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent">
            <tr>
            <td align="center" style="padding:0;Margin:0;background-position:0% top">
            <table align="center" cellpadding="0" cellspacing="0" role="none" class="bf" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:transparent;border-top:30px solid transparent;width:600px;border-collapse:separate">
                <tr>
                <td align="left" bgcolor="#fffafe" style="Margin:0;padding:20px 20px 20px 30px;background-color:#fffafe;border-radius:24px 24px 0 0"><!--[if mso]><table style="width:550px" cellpadding="0" cellspacing="0"><tr><td style="width:64px" valign="top"><![endif]-->
                <table align="left" cellpadding="0" cellspacing="0" role="none" class="s bj" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;float:left">
                    <tr>
                    <td align="left" style="padding:0;Margin:0;width:64px">
                    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                        <tr>
                        <td align="left" style="padding:0;Margin:0;font-size:0"><a href="https://viewstripo.email" target="_blank" style="mso-line-height-rule:exactly;text-decoration:underline;color:#113F37;font-size:14px"><img alt="" src="https://ezpuenw.stripocdn.email/content/guids/CABINET_873f307a11bdd01c976f099f26c7494bb58bb20cb7eb120602ec346ffa307adf/images/internshiplogo.png" width="64" style="display:block;font-size:16px;border:0;outline:none;text-decoration:none;margin:0"></a></td>
                        </tr>
                    </table></td>
                    </tr>
                </table><!--[if mso]></td><td style="width:20px"></td><td style="width:466px" valign="top"><![endif]-->
                <table align="right" cellpadding="0" cellspacing="0" role="none" class="t" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;float:right">
                    <tr>
                    <td align="left" style="padding:0;Margin:0;width:466px">
                    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                        <tr>
                        <td align="left" class="a" style="padding:5px 0 0;Margin:0"><h3 class="b" style="Margin:0;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:26px;font-style:normal;font-weight:normal;line-height:36.4px;color:#a80689"><strong style="font-weight:700 !important">PEA Internship</strong></h3></td>
                        </tr>
                    </table></td>
                    </tr>
                </table><!--[if mso]></td></tr></table><![endif]--></td>
                </tr>
            </table></td>
            </tr>
        </table>
        <table align="center" cellpadding="0" cellspacing="0" role="none" class="o" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important">
            <tr>
            <td align="center" bgcolor="transparent" style="padding:0;Margin:0">
            <table align="center" cellpadding="0" cellspacing="0" role="none" class="be" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:transparent;width:600px">
                <tr>
                <td align="left" bgcolor="#ffffff" class="bh bi" style="Margin:0;padding:25px 35px;background-color:#ffffff">
                <table cellpadding="0" cellspacing="0" role="none" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                    <tr>
                    <td align="center" valign="top" style="padding:0;Margin:0;width:530px">
                    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                        <tr>
                        <td align="center" style="padding:0;Margin:0;font-size:0"><img alt="" src="https://ezpuenw.stripocdn.email/content/guids/CABINET_873f307a11bdd01c976f099f26c7494bb58bb20cb7eb120602ec346ffa307adf/images/check_circle_240dp_17b26a_fill1_wght300_grad0_opsz48.png" width="120" style="display:block;font-size:16px;border:0;outline:none;text-decoration:none;margin:0"></td>
                        </tr>
                        <tr>
                        <td align="center" class="a" style="padding:15px 0;Margin:0"><h1 class="h c" style="Margin:0;font-family:Inter, Arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:bold;line-height:43.2px;color:#333333">สมัครเข้าฝึกงานเสร็จสมบูรณ์</h1></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:0 0 15px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:24px;letter-spacing:0;color:#333333;font-size:16px">เอกสารของคุณ ${firstName} ${lastName} ผ่านการตรวจสอบครบเรียบร้อยแล้ว ยินดีต้อนรับเข้าฝึกงานในตำแหน่ง ${position} ของ ${department} การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่</p></td>
                        </tr>
                        <tr>
                        <td align="left" bgcolor="#fffafe" style="padding-top:20px;padding-bottom:20px"><p style="color:#a80689"><strong>ในวันที่เริ่มฝึกงาน กรุณานำ เอกสารรักษาความลับ 2 ฉบับ ที่มีลายเซ็นจริง มารายงานตัวที่ตึก 4 (LED) ชั้น 18 เวลา 08:30น. และใบส่งตัวจากมหาวิทยาลัยมาที่หน่วยงานที่ฝึกงาน</strong></p></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:20px;font-size:0">
                        <table border="0" width="100%" height="100%" cellpadding="0" cellspacing="0" class="es-spacer" role="none">
                            <tr>
                            <td style="border-bottom:1px solid #cccccc;background:none;height:0px;width:100%;margin:0px"></td>
                            </tr>
                        </table></td>
                        </tr>
                        <tr>
                        <td align="center"><span class="es-button-border" style="background:#a80689;border-radius:8px;border-color:#ffffff"><a href="${appUrl}" target="_blank" class="es-button" style="background:#a80689;mso-border-alt:10px solid #a80689;padding:10px;color:#ffffff;font-weight:bold;font-size:24px;font-style:normal;font-family:helvetica, 'helvetica neue', arial, verdana, sans-serif;border-radius:8px">ดูเอกสารที่ต้องเตรียมมา</a></span></td>
                        </tr>
                    </table></td>
                    </tr>
                </table></td>
                </tr>
            </table></td>
            </tr>
        </table>
        <table align="center" cellpadding="0" cellspacing="0" role="none" class="q" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;width:100%;table-layout:fixed !important;background-color:transparent">
            <tr>
            <td align="center" style="padding:0;Margin:0">
            <table align="center" bgcolor="#ffffff" cellpadding="0" cellspacing="0" role="none" class="bd" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;background-color:#E5FBF6;width:600px">
                <tr>
                <td align="left" bgcolor="#eae9e9" class="bh bi" style="padding:15px;Margin:0;background-color:#eae9e9;border-radius:0 0 24px 24px">
                <table align="right" cellpadding="0" cellspacing="0" role="none" class="t" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px;float:right">
                    <tr>
                    <td align="left" style="padding:0;Margin:0;width:570px">
                    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                        <tr>
                        <td align="center" style="padding:5px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:28px;letter-spacing:0;color:#113F37;font-size:14px">© 2026 PEA Internship</p></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:5px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:28px;letter-spacing:0;color:#113F37;font-size:14px">200 Ngamwongwan Rd, Lat Yao, Chatuchak, Bangkok 10900</p></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:5px 0;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:28px;letter-spacing:0;color:#113F37;font-size:14px">Contact Admin: 02-590-5858, 02-590-5866</p></td>
                        </tr>
                    </table></td>
                    </tr>
                </table></td>
                </tr>
            </table></td>
            </tr>
        </table></td>
        </tr>
    </table>
    </div>
    </body>
    </html>
  `;
}