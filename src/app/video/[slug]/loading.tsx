export default function PitchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="h-8 w-48 mx-auto bg-slate-800 rounded animate-pulse" />
          <div className="h-5 w-64 mx-auto mt-3 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="aspect-video bg-slate-800 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
