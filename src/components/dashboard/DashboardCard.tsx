interface DashboardCardProps {
  label: string
  value: string | number
  sub: string
  icon: React.ComponentType<{ className?: string }>
  tint: 'blue' | 'violet' | 'emerald'
}

export function DashboardCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
}: DashboardCardProps) {
  return (
    <article className="dashboard-card">
      <div>
        <span className="dashboard-card-label">
          {label}
        </span>
        <strong className="dashboard-card-value">
          {value}
        </strong>
        <span className="dashboard-card-sub">
          {sub}
        </span>
      </div>
      <div className={`dashboard-card-icon icon-${tint}`}>
        <Icon className="icon-size-md" />
      </div>
    </article>
  )
}
