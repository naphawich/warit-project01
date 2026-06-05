export default function CourseDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-muted rounded-2xl animate-pulse" />
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-5 w-full bg-muted rounded animate-pulse" />
              <div className="h-5 w-5/6 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="h-7 w-24 bg-muted rounded animate-pulse" />
              <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
