import { brand } from '@/lib/brand'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F1120] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img
            src={brand.logo.full}
            alt={brand.appName}
            style={{ height: '48px', width: 'auto' }}
          />
        </div>
        {children}
      </div>
    </div>
  )
}
