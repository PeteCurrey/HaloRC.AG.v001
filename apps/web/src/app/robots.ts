import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/machines',
          '/machines/*',
          '/race',
          '/race/*',
          '/brands',
          '/brands/*',
          '/build',
          '/find',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/garage',
          '/garage/*',
          '/search',
          '/api/*',
          '/cart',
          '/checkout',
          '/checkout/*',
          '/account',
          '/account/*',
        ],
      },
    ],
    sitemap: 'https://halo-rc.com/sitemap.xml',
  }
}
