import {MetadataRoute} from 'next'
import {sanityFetch} from '@/sanity/lib/live'
import {projectSlugsQuery} from '@/sanity/lib/queries'
import {headers} from 'next/headers'

/**
 * This file creates a sitemap (sitemap.xml) for the application. Learn more about sitemaps in Next.js here: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 * Be sure to update the `changeFrequency` and `priority` values to match your application's content.
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const {data: projects} = await sanityFetch({
    query: projectSlugsQuery,
  })
  const headersList = await headers()
  const sitemap: MetadataRoute.Sitemap = []
  const domain: String = headersList.get('host') as string
  
  // Add homepage
  sitemap.push({
    url: domain as string,
    lastModified: new Date(),
    priority: 1,
    changeFrequency: 'daily',
  })

  // Add project pages
  if (projects && projects.length > 0) {
    for (const project of projects) {
      sitemap.push({
        url: `${domain}/projects/${project.slug}`,
        lastModified: new Date(),
        priority: 0.8,
        changeFrequency: 'weekly',
      })
    }
  }

  return sitemap
}
