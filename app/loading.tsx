export default function DashboardLoading() {
  return (
    <main className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-full bg-slate-200" />
      </div>
      <div className="mb-2 h-6 w-32 rounded bg-slate-200" />
      <div className="mb-5 h-4 w-40 rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-16 rounded-2xl bg-slate-200" />
        <div className="h-16 rounded-2xl bg-slate-200" />
        <div className="h-16 rounded-2xl bg-slate-200" />
      </div>
    </main>
  );
}
