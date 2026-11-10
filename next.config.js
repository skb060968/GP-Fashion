const isDevelopment = process.env.NODE_ENV !== "production"

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' https://api.web3forms.com${isDevelopment ? " ws:" : ""}`,
  "form-action 'self' https://api.web3forms.com",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const measureAppPolicy = contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'")

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["@react-pdf/renderer"],

  outputFileTracingIncludes: {
    "/api/invoice/[orderId]": ["./lib/pdf/fonts/**", "./public/images/brand/logo-mark.png"],
    "/admin/measure-app": ["./measureapp/index.html"],
  },

  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin-login", headers: [{ key: "Cache-Control", value: "no-store" }] },
      {
        source: "/admin/measure-app",
        headers: [
          { key: "Content-Security-Policy", value: measureAppPolicy },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ]
  },
}

module.exports = nextConfig
