import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Player Profile',
}

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
