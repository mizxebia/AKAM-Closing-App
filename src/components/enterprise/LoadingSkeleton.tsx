export function LoadingSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="h-28 animate-pulse border border-[#D5CBB8] bg-[#E2DAD0]" style={{ borderRadius: '12px' }} />
      <div className="grid gap-3 border border-[#D5CBB8] bg-white p-5" style={{ borderRadius: '12px' }}>
        <div className="h-4 w-40 animate-pulse bg-[#E2DAD0]" style={{ borderRadius: '2px' }} />
        <div className="h-10 animate-pulse bg-[#EDE8E0]" style={{ borderRadius: '2px' }} />
        <div className="h-10 animate-pulse bg-[#EDE8E0]" style={{ borderRadius: '2px' }} />
      </div>
    </div>
  )
}
