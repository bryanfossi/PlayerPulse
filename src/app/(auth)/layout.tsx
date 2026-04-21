export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
              <span className="text-green-950 font-bold text-sm">PP</span>
            </div>
            <span className="text-white font-bold text-xl">PlayerPulse</span>
          </div>
          <p className="text-green-300 text-sm">Promoted Soccer Consultants</p>
        </div>
        {children}
      </div>
    </div>
  )
}
