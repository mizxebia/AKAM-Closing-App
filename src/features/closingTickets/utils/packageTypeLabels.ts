const PACKAGE_TYPE_LABELS: Record<string, string> = {
  condo_sale: 'Condo Sale',
  coop_sale: 'Co-op Sale',
  Sponser: 'Sponsor',
  Sponsor: 'Sponsor',
  'Tranfer New T Code': 'Transfer New T-Code',
  'Transfer New T Code': 'Transfer New T-Code',
  'Coop Tranfer': 'Co-op Transfer',
  'Coop Transfer': 'Co-op Transfer',
}

export function formatPackageTypeLabel(label: string): string {
  return PACKAGE_TYPE_LABELS[label] ?? label
}
