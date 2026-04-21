export default function SchoolsLoading() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-muted rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-6 w-36 bg-muted rounded" />
            <div className="h-3.5 w-52 bg-muted rounded" />
          </div>
        </div>
        <div className="h-9 w-32 bg-muted rounded-md" />
      </div>
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 flex-1 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="space-y-3">
            <div className="h-8 bg-muted rounded" />
            {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-muted rounded-xl" />)}
          </div>
        ))}
      </div>
    </div>
  )
}
