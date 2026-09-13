export default function SessionLoading() {
  return (
    <main className="animate-pulse">
      <div className="mb-8 flex items-center justify-between">
        <div className="h-6 w-28 rounded bg-slate-200" />
        <div className="h-9 w-9 rounded-full bg-slate-200" />
      </div>
      <div className="mb-6 h-24 rounded-lg bg-slate-200" />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="h-11 rounded-lg bg-slate-200" />
        <div className="h-11 rounded-lg bg-slate-200" />
        <div className="h-11 rounded-lg bg-slate-200" />
      </div>
      <div className="h-40 rounded-lg bg-slate-200" />
    </main>
  );
}
