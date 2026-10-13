import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  /* The archive lives inside the site's repository. Without these, Next.js takes the repository
     root (where the site's lockfile is) as the workspace root and tries to build the site's
     middleware.ts. The archive is always built from inside its own folder. */
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig
