export default function CommunicationsLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-muted rounded-lg" />
        <div className="space-y-1.5">
          <div className="h-6 w-44 bg-muted rounded" />
          <div className="h-3.5 w-64 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-muted rounded-md" />)}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
      </div>
    </div>
  )
}
