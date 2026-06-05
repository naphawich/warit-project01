export default function MyCoursesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="h-40 bg-muted animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-9 w-full bg-muted rounded-xl animate-pulse mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
