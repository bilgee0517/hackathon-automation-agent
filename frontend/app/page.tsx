import {Suspense} from 'react'
import Link from 'next/link'
import {sanityFetch} from '@/sanity/lib/live'
import {allProjectsQuery} from '@/sanity/lib/queries'
import {ProjectCard} from '@/app/components/ProjectCard'
import {DashboardClient} from '@/app/components/DashboardClient'

export default async function DashboardPage() {
  const {data: projects} = await sanityFetch({
    query: allProjectsQuery,
  })

  return <DashboardClient projects={projects || []} />
}
