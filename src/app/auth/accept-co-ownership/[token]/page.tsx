import type { Metadata } from 'next'
import { AcceptCoOwnershipClient } from './AcceptCoOwnershipClient'

export const metadata: Metadata = {
  title: 'Join the shared account · FUSE-ID',
  description: 'Accept your invitation and set a password.',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AcceptCoOwnershipPage({ params }: PageProps) {
  const { token } = await params
  return (
    <div className="min-h-screen bg-[#0f1120] flex items-center justify-center p-6">
      <AcceptCoOwnershipClient token={token} />
    </div>
  )
}
