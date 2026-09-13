export default function GroupLoading() {
  return (
    <main className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-full bg-slate-200" />
      </div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-slate-200" />
        <div>
          <div className="mb-2 h-5 w-40 rounded bg-slate-200" />
          <div className="h-3 w-24 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mb-4 flex gap-4 border-b border-slate-200 pb-3">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-200" />
      </div>
      <div className="space-y-3">
        <div className="h-16 rounded-lg bg-slate-200" />
        <div className="h-16 rounded-lg bg-slate-200" />
      </div>
    </main>
  );
}
