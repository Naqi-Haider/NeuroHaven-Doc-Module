# Graph Report - D:\NeuroHaven FYP\NEUROHAVEN\neurohaven-doctor-dashboard\src  (2026-07-13)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 257 nodes · 639 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 101 edges
2. `Button()` - 20 edges
3. `useAuth()` - 18 edges
4. `PatientWithLink` - 18 edges
5. `Avatar()` - 11 edges
6. `AvatarFallback()` - 11 edges
7. `Card()` - 10 edges
8. `CardContent()` - 9 edges
9. `Alert` - 9 edges
10. `CardHeader()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `OverviewPage()` --calls--> `useAuth()`  [EXTRACTED]
  app/(dashboard)/overview/page.tsx → hooks/useAuth.ts
- `PatientDetailsPage()` --calls--> `cn()`  [EXTRACTED]
  app/(dashboard)/patients/[patientId]/page.tsx → lib/utils.ts
- `TemporalContext()` --calls--> `cn()`  [EXTRACTED]
  components/overview/TemporalContext.tsx → lib/utils.ts
- `PatientDetailDrawer()` --calls--> `cn()`  [EXTRACTED]
  components/patients/PatientDetailDrawer.tsx → lib/utils.ts
- `AlertAction()` --calls--> `cn()`  [EXTRACTED]
  components/ui/alert.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (33): AlertsPage(), initialAlerts, cn(), PatientFiltersProps, DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (20): Topbar(), TopbarProps, ActiveCarePathwaysProps, FilterType, patientDetailsMap, AlertPanelProps, initialAlerts, initialPatients (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (21): CognitiveTrendChartProps, CustomTooltipProps, MetricCardProps, RecentPatientsTableProps, TemporalContextProps, PatientCardProps, RiskBadge(), RiskBadgeProps (+13 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (19): LoginForm(), RegisterForm(), DashboardLayout(), useAuth(), DashboardShell(), DashboardShellProps, Sidebar(), supabase (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (18): loginSchema, LoginValues, registerSchema, RegisterValues, metadata, metadata, FormControl(), FormDescription() (+10 more)

### Community 5 - "Community 5"
Cohesion: 0.15
Nodes (17): patientDatabase, PatientDetailsPage(), PatientDetailsPageProps, connectedPatients, historicalReports, CognitiveTrend, GameSession, GameType (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.18
Nodes (13): SidebarProps, TemporalContext(), trendData, TrendPoint, PatientDetailDrawer(), PatientDetailDrawerProps, patientMetrics, Avatar() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (7): Alert(), AlertAction(), AlertDescription(), AlertTitle(), alertVariants, Badge(), badgeVariants

### Community 8 - "Community 8"
Cohesion: 0.39
Nodes (6): Label(), Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (5): dmSans, inter, jetbrainsMono, metadata, Toaster()

## Knowledge Gaps
- **47 isolated node(s):** `metadata`, `metadata`, `initialAlerts`, `initialPatients`, `initialAlerts` (+42 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.396) - this node is a cross-community bridge._
- **Why does `Button()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`, `Community 6`, `Community 8`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `initialAlerts` to the rest of the system?**
  _47 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07653061224489796 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1268939393939394 - nodes in this community are weakly interconnected._