import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Node.js runtime by default — no Edge runtime unless specifically required
  // Turbopack for dev
  turbopack: {},
  images: {
    // Supabase Storage CDN domains — update with actual project URL
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // External manufacturer press imagery (approved, per media_assets table)
      {
        protocol: 'https',
        hostname: 'traxxas.com',
      },
      {
        protocol: 'https',
        hostname: 'teamxray.com',
      },
      {
        protocol: 'https',
        hostname: 'www.mugenshop.eu',
      },
      {
        protocol: 'https',
        hostname: 'mugenshop.eu',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Focal point support via custom loader in future
  },
  // Transpile workspace packages
  transpilePackages: ['@halo-rc/ui', '@halo-rc/db', '@halo-rc/types'],
}

export default nextConfig
