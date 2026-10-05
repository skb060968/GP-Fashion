// lib/emails/loginCode.ts
import { escapeHtml, heading, paragraph, shell } from "./layout"

export function loginCodeEmail(code: string, minutes: number) {
  const digits = escapeHtml(code)
  const html = shell({
    preheader: `Your sign-in code is ${code}. It expires in ${minutes} minutes.`,
    sections: [
      heading("Your sign-in code") +
        paragraph(`Enter this code on the sign-in page to continue. It expires in ${minutes} minutes.`),
      `<p style="margin:0;font:700 36px/1.2 Georgia,'Times New Roman',serif;letter-spacing:10px;color:#000;text-align:center;">${digits}</p>`,
      paragraph(
        `If you did not request this code, you can ignore this email. Nobody can sign in without it.`,
        { muted: true }
      ),
    ],
  })
  return { subject: `${code} is your Piyush Bholla sign-in code`, html }
}
