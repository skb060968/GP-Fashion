/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // @react-pdf/renderer runs as a plain Node dependency against the project's React
  // (19.x) rather than being bundled into the RSC layer, whose React build lacks the
  // client internals the PDF reconciler needs.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Make sure the PDF route's fonts and logo are shipped with the serverless function.
  outputFileTracingIncludes: {
    "/api/invoice/[orderId]": ["./lib/pdf/fonts/**", "./public/images/brand/logo-mark.png"],
  },
}

module.exports = nextConfig
