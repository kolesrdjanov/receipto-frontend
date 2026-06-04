export interface WidgetDefinition {
  id: string
  nameKey: string       // i18n key for display name
  defaultSize: number   // default col-span out of 12
  defaultVisible: boolean
  defaultOrder: number
}

// Available size options (out of 12 grid columns)
export const WIDGET_SIZE_OPTIONS = [
  { value: 4,  label: '1/3' },
  { value: 6,  label: '1/2' },
  { value: 8,  label: '2/3' },
  { value: 12, label: 'Full' },
] as const

export type WidgetSize = typeof WIDGET_SIZE_OPTIONS[number]['value']

// Layout mirrors the Glass redesign's 6-column grid (spans are out of 12 → ×2):
// stats full · daily(8)+category(4) · trend(8)+forecast(4) · coach(6)+upcoming(6) ·
// budget(6)+rank(6). Recent activity is de-prioritized (hidden by default, still
// available via the customize/edit mode).
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  { id: 'stats-cards',        nameKey: 'dashboard.widgets.statsCards',        defaultSize: 12, defaultVisible: true,  defaultOrder: 0 },
  { id: 'daily-bar-chart',    nameKey: 'dashboard.widgets.dailyBarChart',    defaultSize: 8,  defaultVisible: true,  defaultOrder: 1 },
  { id: 'category-pie-chart', nameKey: 'dashboard.widgets.categoryPieChart', defaultSize: 4,  defaultVisible: true,  defaultOrder: 2 },
  { id: 'monthly-trend',      nameKey: 'dashboard.widgets.monthlyTrend',     defaultSize: 8,  defaultVisible: true,  defaultOrder: 3 },
  { id: 'monthly-forecast',   nameKey: 'dashboard.widgets.monthlyForecast',  defaultSize: 4,  defaultVisible: true,  defaultOrder: 4 },
  { id: 'coach-card',         nameKey: 'dashboard.widgets.coachCard',        defaultSize: 6,  defaultVisible: true,  defaultOrder: 5 },
  { id: 'upcoming-recurring', nameKey: 'dashboard.widgets.upcomingRecurring', defaultSize: 6,  defaultVisible: true,  defaultOrder: 6 },
  { id: 'budget-tracker',     nameKey: 'dashboard.widgets.budgetTracker',    defaultSize: 6,  defaultVisible: true,  defaultOrder: 7 },
  { id: 'rank-card',          nameKey: 'dashboard.widgets.rankCard',         defaultSize: 6,  defaultVisible: true,  defaultOrder: 8 },
  { id: 'recent-activity',    nameKey: 'dashboard.widgets.recentActivity',   defaultSize: 12, defaultVisible: false, defaultOrder: 9 },
]

export const DEFAULT_WIDGET_ORDER = WIDGET_DEFINITIONS.map(w => w.id)

export const DEFAULT_WIDGET_VISIBILITY = Object.fromEntries(
  WIDGET_DEFINITIONS.map(w => [w.id, w.defaultVisible])
)

export const DEFAULT_WIDGET_SIZES = Object.fromEntries(
  WIDGET_DEFINITIONS.map(w => [w.id, w.defaultSize])
)

export function getWidgetDefinition(id: string): WidgetDefinition | undefined {
  return WIDGET_DEFINITIONS.find(w => w.id === id)
}
