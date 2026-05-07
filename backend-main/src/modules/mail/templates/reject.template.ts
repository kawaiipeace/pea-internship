export type RejectTemplateParams = {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  appUrl: string;
};

export function rejectTemplate({
  firstName,
  lastName,
  position,
  department,
  appUrl,
}: RejectTemplateParams) {
  return `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" lang="th" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
    <head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
    <meta name="x-apple-disable-message-reformatting">
    <meta content="IE=edge" http-equiv="X-UA-Compatible">
    <meta content="telephone=no" name="format-detection">
    <title>ไม่ผ่านการสมัครฝึกงาน</title><!--[if (mso 16)]>
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
    @media only screen and (max-width:600px) {.bj { padding-bottom:20px!important }.bi { padding-right:20px!important }.bh { padding-left:20px!important }*[class="gmail-fix"] { display:none!important }p, a { line-height:150%!important }h1, h1 a { line-height:120%!important }h2, h2 a { line-height:120%!important }h3, h3 a { line-height:120%!important }h4, h4 a { line-height:120%!important }h5, h5 a { line-height:120%!important }h6, h6 a { line-height:120%!important }.be p { }.bd p { }h1 { font-size:40px!important; text-align:left }h2 { font-size:32px!important; text-align:left }h3 { font-size:28px!important; text-align:left }h4 { font-size:24px!important; text-align:left }h5 { font-size:20px!important; text-align:left }h6 { font-size:16px!important; text-align:left }.bf p, .bf a { font-size:14px!important }.be p, .be a { font-size:18px!important }.bd p, .bd a { font-size:12px!important }.h, .h h1, .h h2, .h h3, .h h4, .h h5, .h h6 { text-align:center!important }.e .rollover:hover .rollover-second, .h .rollover:hover .rollover-second, .g .rollover:hover .rollover-second { display:inline!important }a.v, button.v { display:inline-block!important; font-size:18px!important; padding:10px 20px 10px 20px!important; line-height:120%!important }.z { display:inline-block!important }.r table, .s, .t { width:100%!important; border-collapse:separate!important }.o table, .p table, .q table, .o, .q, .p { width:100%!important; max-width:600px!important }.adapt-img { width:100%!important; height:auto!important }.h-auto { height:auto!important }.a .c, .a .c * { font-size:36px!important }.a .b, .a .b * { font-size:26px!important } }
    @media screen and (max-width:384px) {.mail-message-content { width:414px!important } }
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
    a.es-button {
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
    .es-desk-hidden {
    display:none;
    float:left;
    overflow:hidden;
    width:0;
    max-height:0;
    line-height:0;
    mso-hide:all;
    }
    @media only screen and (max-width:600px) {.es-p-default { padding-top:20px!important; padding-right:20px!important; padding-bottom:20px!important; padding-left:20px!important } *[class="gmail-fix"] { display:none!important } p, a { line-height:150%!important } h1, h1 a { line-height:120%!important } h2, h2 a { line-height:120%!important } h3, h3 a { line-height:120%!important } h4, h4 a { line-height:120%!important } h5, h5 a { line-height:120%!important } h6, h6 a { line-height:120%!important } .es-header-body p { } .es-content-body p { } .es-footer-body p { } .es-infoblock p { } h1 { font-size:40px!important; text-align:left } h2 { font-size:32px!important; text-align:left } h3 { font-size:28px!important; text-align:left } h4 { font-size:24px!important; text-align:left } h5 { font-size:20px!important; text-align:left } h6 { font-size:16px!important; text-align:left } .es-header-body h1 a, .es-content-body h1 a, .es-footer-body h1 a { font-size:40px!important } .es-header-body h2 a, .es-content-body h2 a, .es-footer-body h2 a { font-size:32px!important } .es-header-body h3 a, .es-content-body h3 a, .es-footer-body h3 a { font-size:28px!important } .es-header-body h4 a, .es-content-body h4 a, .es-footer-body h4 a { font-size:24px!important } .es-header-body h5 a, .es-content-body h5 a, .es-footer-body h5 a { font-size:20px!important } .es-header-body h6 a, .es-content-body h6 a, .es-footer-body h6 a { font-size:16px!important } .es-menu td a { font-size:14px!important } .es-header-body p, .es-header-body a { font-size:14px!important } .es-content-body p, .es-content-body a { font-size:18px!important } .es-footer-body p, .es-footer-body a { font-size:12px!important } .es-infoblock p, .es-infoblock a { font-size:12px!important } .es-m-txt-c, .es-m-txt-c h1, .es-m-txt-c h2, .es-m-txt-c h3, .es-m-txt-c h4, .es-m-txt-c h5, .es-m-txt-c h6 { text-align:center!important } .es-m-txt-r, .es-m-txt-r h1, .es-m-txt-r h2, .es-m-txt-r h3, .es-m-txt-r h4, .es-m-txt-r h5, .es-m-txt-r h6 { text-align:right!important } .es-m-txt-j, .es-m-txt-j h1, .es-m-txt-j h2, .es-m-txt-j h3, .es-m-txt-j h4, .es-m-txt-j h5, .es-m-txt-j h6 { text-align:justify!important } .es-m-txt-l, .es-m-txt-l h1, .es-m-txt-l h2, .es-m-txt-l h3, .es-m-txt-l h4, .es-m-txt-l h5, .es-m-txt-l h6 { text-align:left!important } .es-m-txt-r img, .es-m-txt-c img, .es-m-txt-l img { display:inline!important } .es-m-txt-r .rollover:hover .rollover-second, .es-m-txt-c .rollover:hover .rollover-second, .es-m-txt-l .rollover:hover .rollover-second { display:inline!important } .es-m-txt-r .rollover span, .es-m-txt-c .rollover span, .es-m-txt-l .rollover span { line-height:0!important; font-size:0!important; display:block } .es-m-txt-r .es-menu td { float:right!important } .es-m-txt-l .es-menu td { float:left!important } .es-m-txt-c .es-menu td { display:inline-block!important } .es-spacer { display:inline-table } a.es-button, button.es-button { display:inline-block!important; font-size:18px!important; padding:10px 20px 10px 20px!important; line-height:120%!important } .es-button-border { display:inline-block!important } .es-m-fw, .es-m-fw.es-fw, .es-m-fw .es-button { display:block!important } .es-m-il, .es-m-il .es-button, .es-social, .es-social td, .es-menu.es-table-not-adapt { display:inline-block!important } .es-adaptive table, .es-left, .es-right { width:100%!important; border-collapse:separate!important } .es-content table, .es-header table, .es-footer table, .es-content, .es-footer, .es-header { width:100%!important; max-width:600px!important } .adapt-img { width:100%!important; height:auto!important } .es-adapt-td { display:block!important; width:100%!important } .es-mobile-hidden, .es-hidden { display:none!important } .es-container-hidden { display:none!important } .es-desk-hidden { width:auto!important; overflow:visible!important; float:none!important; max-height:inherit!important; line-height:inherit!important } tr.es-desk-hidden { display:table-row!important } table.es-desk-hidden { display:table!important } td.es-desk-hidden { display:table-cell!important } td.es-desk-menu-hidden { display:table-cell!important } .es-menu td { width:1%!important } table.es-table-not-adapt, .esd-block-html table, .es-m-txt-r .es-menu td, .es-m-txt-l .es-menu td, .es-m-txt-c .es-menu td { width:auto!important } .h-auto { height:auto!important } .es-menu-6862.es-menu td a { font-size:12px!important } }
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
                <td align="left" bgcolor="#fffafe" style="padding:20px 20px 20px 30px;Margin:0;background-color:#fffafe;border-radius:24px 24px 0 0"><!--[if mso]><table style="width:550px" cellpadding="0" cellspacing="0"><tr><td style="width:64px" valign="top"><![endif]-->
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
                <td align="left" bgcolor="#ffffff" class="bh bi" style="padding:25px 35px 30px;Margin:0;background-color:#ffffff">
                <table cellpadding="0" cellspacing="0" role="none" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                    <tr>
                    <td align="center" valign="top" style="padding:0;Margin:0;width:530px">
                    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-spacing:0px">
                        <tr>
                        <td align="center" style="padding:0;Margin:0;font-size:0"><img alt="" src="https://ezpuenw.stripocdn.email/content/guids/CABINET_a51d63625523c5ece1d3e4d5438f70635a90ec31e17757815eb4107a39cf4662/images/cancel_240dp_f04438_fill1_wght400_grad0_opsz48.png" width="120" style="display:block;font-size:16px;border:0;outline:none;text-decoration:none;margin:0"></td>
                        </tr>
                        <tr>
                        <td align="center" class="a" style="padding:15px 0;Margin:0"><h1 class="h c" style="Margin:0;font-family:Inter, Arial, sans-serif;mso-line-height-rule:exactly;letter-spacing:0;font-size:36px;font-style:normal;font-weight:bold;line-height:43.2px;color:#333333">คุณไม่ผ่านเข้าฝึกงาน</h1></td>
                        </tr>
                        <tr>
                        <td align="center" style="padding:0 0 15px;Margin:0"><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:24px;letter-spacing:0;color:#333333;font-size:16px">ขอแสดงความเสียใจ คุณ ${firstName} ${lastName} ไม่ผ่านตำแหน่ง ${position} ของ ${department} การไฟฟ้าส่วนภูมิภาค สำนักงานใหญ่&nbsp;</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:24px;letter-spacing:0;color:#333333;font-size:16px">​</p><p style="Margin:0;mso-line-height-rule:exactly;font-family:Inter, Arial, sans-serif;line-height:24px;letter-spacing:0;color:#333333;font-size:16px">ถ้ายังสนใจในการฝึกงานที่นี่อยู่ สามารถสมัครฝึกงานในตำแหน่งอื่น &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;หรือ หน่วยงานอื่นได้</p></td>
                        </tr>
                        <tr>
                        </tr>
                        <tr>
                        <td align="center" style="padding:30px 0 0;Margin:0"><!--[if mso]><a href="${appUrl}" target="_blank" hidden>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" esdevVmlButton href="${appUrl}" style="height:54px; v-text-anchor:middle; width:365px" arcsize="15%" stroke="f"  fillcolor="#a80689">
            <w:anchorlock></w:anchorlock>
            <center style='color:#ffffff; font-family:Inter, Arial, sans-serif; font-size:20px; font-weight:400; line-height:20px;  mso-text-raise:1px'>อัพโหลดเอกสารขอความอนุเคราะห์</center>
        </v:roundrect></a>
    <![endif]--><!--[if !mso]><!-- --><span class="z msohide" style="mso-hide:all;border-style:solid;border-color:#2CB543;background:#a80689;border-width:0px;display:inline-block;border-radius:8px;width:auto"><a href="${appUrl}" target="_blank" class="v" style="mso-line-height-rule:exactly;text-decoration:none !important;mso-style-priority:100 !important;color:#FFFFFF;font-size:20px;padding:15px 30px;display:inline-block;background:#a80689;border-radius:8px;font-family:Inter, Arial, sans-serif;font-weight:normal;font-style:normal;line-height:24px;width:auto;text-align:center;letter-spacing:0;mso-padding-alt:0;mso-border-alt:10px solid #a80689">ดูงานอื่นที่เปิดรับ</a></span><!--<![endif]--></td>
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
                <td align="left" bgcolor="#eae9e9" class="bi bh" style="padding:15px;Margin:0;background-color:#eae9e9;border-radius:0 0 24px 24px">
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
