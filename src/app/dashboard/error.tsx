"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-20">
      <h2 className="text-xl font-semibold text-red-400 mb-2">
        Something went wrong
      </h2>
      <p className="text-slate-500 mb-6">{error.message}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
