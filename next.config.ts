import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  serverExternalPackages: ["libsql", "@libsql/client"],
  outputFileTracingExcludes: {
    "/api/health": ["./next.config.ts", "./next.config.js"],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["promptide.us.ci", "localhost:3000"],
    },
  },
}

export default withNextIntl(nextConfig)
