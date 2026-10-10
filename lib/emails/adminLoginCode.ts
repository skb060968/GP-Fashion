import { button, escapeHtml, heading, paragraph, shell, siteUrl } from "./layout"

export function adminLoginCodeEmail(code: string, minutes: number, challengeId: string) {
  const digits = escapeHtml(code)
  const verifyUrl = new URL("/admin-login", siteUrl())
  verifyUrl.searchParams.set("challenge", challengeId)

  const html = shell({
    preheader: `A verification code was requested for the admin dashboard. It expires in ${minutes} minutes.`,
    sections: [
      heading("Admin verification") + paragraph(`Copy this code, then use Continue verification to reopen the code-entry screen. It expires in ${minutes} minutes.`),
      `<p style="margin:0;font:700 36px/1.2 Georgia,'Times New Roman',serif;letter-spacing:10px;color:#000;text-align:center;">${digits}</p>`,
      button("Continue verification", verifyUrl.toString()),
      paragraph("If you did not attempt to sign in, change the admin password immediately and review the dashboard sessions.", { muted: true }),
    ],
  })
  return { subject: "Your Piyush Bholla admin verification code", html }
}
