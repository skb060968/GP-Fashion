
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },

  serverExternalPackages: ["@react-pdf/renderer"],

  outputFileTracingIncludes: {
    "/api/invoice/[orderId]": ["./lib/pdf/fonts/**", "./public/images/brand/logo-mark.png"],
  },
}

module.exports = nextConfig
