export default function DashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-10 w-36 bg-slate-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-800 rounded-xl overflow-hidden">
            <div className="aspect-video bg-slate-900 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-32 bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-full bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
