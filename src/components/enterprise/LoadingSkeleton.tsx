export function LoadingSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      {/* Top summary bar */}
      <div
        className="animate-pulse bg-[#E2DAD0]"
        style={{ height: '112px', borderRadius: '12px', border: '1px solid #D5CBB8' }}
      />
      {/* Form-like content block */}
      <div
        className="grid gap-3 bg-white p-5"
        style={{ borderRadius: '12px', border: '1px solid #D5CBB8' }}
      >
        <div className="animate-pulse bg-[#EDE8E0]" style={{ height: '14px', width: '35%', borderRadius: '6px' }} />
        <div className="grid grid-cols-2 gap-3">
          <div className="animate-pulse bg-[#EDE8E0]" style={{ height: '38px', borderRadius: '8px' }} />
          <div className="animate-pulse bg-[#EDE8E0]" style={{ height: '38px', borderRadius: '8px' }} />
          <div className="animate-pulse bg-[#EDE8E0]" style={{ height: '38px', borderRadius: '8px' }} />
          <div className="animate-pulse bg-[#EDE8E0]" style={{ height: '38px', borderRadius: '8px' }} />
        </div>
      </div>
    </div>
  )
}
