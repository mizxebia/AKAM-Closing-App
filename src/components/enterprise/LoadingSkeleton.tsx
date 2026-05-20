export function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="h-10 animate-pulse rounded bg-slate-100" />
        <div className="h-10 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  )
}
