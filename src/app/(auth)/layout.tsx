import { brand } from '@/lib/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050e1c] via-[#0c1e38] to-[#1A3A5C] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* Plain img bypasses Next.js image optimizer cache — correct for SVGs */}
          <img
            src={brand.logo.stackedTransparent}
            alt={brand.appName}
            width={180}
            height={168}
            style={{ height: '168px', width: 'auto' }}
          />
        </div>
        {children}
      </div>
    </div>
  )
}
