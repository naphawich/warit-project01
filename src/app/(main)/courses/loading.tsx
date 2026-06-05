export default function CoursesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header skeleton */}
        <div className="mb-8 space-y-3">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-72 bg-muted rounded animate-pulse" />
        </div>
        {/* Search bar skeleton */}
        <div className="h-10 w-full max-w-md bg-muted rounded-lg animate-pulse mb-8" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="h-40 bg-muted animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                <div className="flex gap-2 pt-2">
                  <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
