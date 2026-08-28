"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { Loader2, BarChart3, TrendingUp, Globe, FolderKanban, Users, CalendarPlus, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { VisitFrequencyChart } from "@/components/admin/charts/visit-frequency-chart"
import { CategoryDistributionChart } from "@/components/admin/charts/category-distribution-chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VisitStats {
  topSites: Array<{
    id: string
    name: string
    url: string
    description: string
    iconUrl: string | null
    visitCount: number
    category: {
      name: string
    }
  }>
  totalVisits: number
}

interface FrequencyData {
  frequency: Array<{
    date: string
    count: number
  }>
}

interface TodayStats {
  today: number
  yesterday: number
  growthRate: number | null
}

interface CategoryDistribution {
  data: Array<{
    category: string
    count: number
    share: number
  }>
  total: number
}

type TimeRange = 0 | 7 | 30 | 90
type TopCount = 5 | 10 | 30 | 0

// 统计卡片标题的消息 key 集合
type StatTitleKey =
  | "statSites"
  | "statCategories"
  | "statVisitors"
  | "statTotalVisits"
  | "statTodayVisits"
  | "statWeekNew"
  | "statMissingIcons"

interface StatItem {
  titleKey: StatTitleKey
  value: number
  loading: boolean
  icon: typeof Globe
  href?: string
  badge?: number | null
}

const formatNumber = (value: number) => value.toLocaleString()

export default function AdminDashboardPage() {
  const t = useTranslations("admin.dashboard")
  const [loading, setLoading] = useState(true)
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null)
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null)
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const [topCount, setTopCount] = useState<TopCount>(5)
  const [siteStats, setSiteStats] = useState<StatItem[]>([
    { titleKey: "statSites", value: 0, loading: true, icon: Globe },
    { titleKey: "statCategories", value: 0, loading: true, icon: FolderKanban },
    { titleKey: "statVisitors", value: 0, loading: true, icon: Users },
    { titleKey: "statTotalVisits", value: 0, loading: true, icon: TrendingUp },
    { titleKey: "statTodayVisits", value: 0, loading: true, icon: CalendarPlus, badge: null as number | null },
    { titleKey: "statWeekNew", value: 0, loading: true, icon: Sparkles, href: "/admin/sites" },
    { titleKey: "statMissingIcons", value: 0, loading: true, icon: Globe, href: "/admin/sites" },
  ])

  // 获取时间范围描述
  const getTimeRangeLabel = (days: TimeRange) => {
    if (days === 0) return t("rangeAll")
    if (days === 90) return t("range3months")
    if (days === 30) return t("range30days")
    return t("rangeDays", { days })
  }

  // 解析响应 body，失败时返回 null（用于网络层 HTML 错误页等异常情况）
  // 非 2xx（如统计接口 500）一律返回 null，交由调用方回退默认值。
  // 仅解析失败还不够：错误响应体 {error} 是合法 JSON，直接透传会让
  // 后续对缺失字段（如 topSites.length）的访问抛出客户端异常
  async function safeJson(res: Response): Promise<unknown> {
    if (!res.ok) return null
    const ctype = res.headers.get("content-type") || ""
    if (!ctype.includes("application/json")) return null
    return res.json().catch(() => null)
  }

  // 加载统计数据
  useEffect(() => {
    async function loadStats() {
      try {
        const [
          sitesRes,
          categoriesRes,
          usersRes,
          visitsRes,
          frequencyRes,
          todayRes,
          contentRes,
          distributionRes,
        ] = await Promise.all([
          fetch("/api/admin/stats/sites"),
          fetch("/api/admin/stats/categories"),
          fetch("/api/admin/stats/users"),
          fetch(`/api/admin/stats/visits?days=${timeRange}&limit=${topCount}`),
          fetch(`/api/admin/stats/frequency?days=${timeRange}`),
          fetch("/api/admin/stats/today"),
          fetch("/api/admin/stats/content"),
          fetch("/api/admin/stats/category-distribution"),
        ])

        // 规范化各响应：字段缺失或类型不符时回退默认值，保证渲染层拿到的结构完整
        const sitesData = ((await safeJson(sitesRes)) ?? {}) as { total?: number }
        const categoriesData = ((await safeJson(categoriesRes)) ?? {}) as { total?: number }
        const usersData = ((await safeJson(usersRes)) ?? {}) as { total?: number }
        const visitsRaw = (await safeJson(visitsRes)) as { totalVisits?: number; topSites?: unknown[] } | null
        const visitsData = {
          totalVisits: visitsRaw?.totalVisits ?? 0,
          topSites: Array.isArray(visitsRaw?.topSites) ? visitsRaw.topSites : [],
        }
        const frequencyRaw = (await safeJson(frequencyRes)) as { frequency?: Array<{ date: string; count: number }> } | null
        const frequencyData = {
          frequency: Array.isArray(frequencyRaw?.frequency) ? frequencyRaw.frequency : [],
        }
        const todayData = ((await safeJson(todayRes)) ?? { today: 0, growthRate: null }) as { today: number; growthRate: number | null }
        const contentData = ((await safeJson(contentRes)) ?? { weekNewSites: 0, missingIcons: 0 }) as { weekNewSites: number; missingIcons: number }
        const distributionRaw = (await safeJson(distributionRes)) as { data?: Array<{ category: string; count: number; share: number }>; total?: number } | null
        const distributionData = {
          data: Array.isArray(distributionRaw?.data) ? distributionRaw.data : [],
          total: distributionRaw?.total ?? 0,
        }

        setSiteStats([
          { titleKey: "statSites", value: sitesData.total || 0, loading: false, icon: Globe },
          { titleKey: "statCategories", value: categoriesData.total || 0, loading: false, icon: FolderKanban },
          { titleKey: "statVisitors", value: usersData.total || 0, loading: false, icon: Users },
          { titleKey: "statTotalVisits", value: visitsData.totalVisits || 0, loading: false, icon: TrendingUp },
          { titleKey: "statTodayVisits", value: todayData.today || 0, loading: false, icon: CalendarPlus, badge: todayData.growthRate ?? null },
          { titleKey: "statWeekNew", value: contentData.weekNewSites || 0, loading: false, icon: Sparkles, href: "/admin/sites" },
          { titleKey: "statMissingIcons", value: contentData.missingIcons || 0, loading: false, icon: Globe, href: "/admin/sites" },
        ])

        setVisitStats(visitsData as unknown as Parameters<typeof setVisitStats>[0])
        setFrequencyData(frequencyData as unknown as Parameters<typeof setFrequencyData>[0])
        setTodayStats(todayData as unknown as Parameters<typeof setTodayStats>[0])
        setCategoryDistribution(distributionData as unknown as Parameters<typeof setCategoryDistribution>[0])
      } catch (error) {
        console.error("Failed to load stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [timeRange, topCount])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片：全站口径由顶栏切换器的「全局」禁用态示意 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {siteStats.map((stat) => (
          <Card key={stat.titleKey} className="@container/card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t(stat.titleKey)}</CardTitle>
              <CardAction>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
                  {stat.loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(stat.value)
                  )}
                </div>
                {"badge" in stat && stat.badge !== null && stat.badge !== undefined && (
                  <Badge
                    variant="outline"
                    className={
                      stat.badge >= 0
                        ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : "text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10"
                    }
                  >
                    {stat.badge >= 0 ? "+" : ""}
                    {stat.badge}%
                  </Badge>
                )}
              </div>
              {stat.titleKey === "statTodayVisits" && todayStats && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("yesterday", { count: formatNumber(todayStats.yesterday) })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 排行 + 分类分布 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("rankTitle")}
            </CardTitle>
            <CardDescription>
              {t("rankDesc", { range: getTimeRangeLabel(timeRange) })}
              {topCount > 5 || topCount === 0 ? t("rankDescScrollHint") : ""}
            </CardDescription>
            <CardAction>
              <ToggleGroup
                type="single"
                value={topCount.toString()}
                onValueChange={(value) => value && setTopCount(Number(value) as 5 | 10 | 30 | 0)}
                variant="outline"
                className="hidden md:flex"
              >
                <ToggleGroupItem value="5" className="rounded-r-none">Top 5</ToggleGroupItem>
                <ToggleGroupItem value="10" className="rounded-none border-l-0">Top 10</ToggleGroupItem>
                <ToggleGroupItem value="30" className="rounded-none border-l-0">Top 30</ToggleGroupItem>
                <ToggleGroupItem value="0" className="rounded-l-none border-l-0">All</ToggleGroupItem>
              </ToggleGroup>
              <Select
                value={topCount.toString()}
                onValueChange={(value) => setTopCount(Number(value) as 5 | 10 | 30 | 0)}
              >
                <SelectTrigger
                  className="flex w-28 md:hidden"
                  aria-label={t("selectCountLabel")}
                >
                  <SelectValue placeholder={t("selectCountLabel")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="5" className="rounded-lg">Top 5</SelectItem>
                  <SelectItem value="10" className="rounded-lg">Top 10</SelectItem>
                  <SelectItem value="30" className="rounded-lg">Top 30</SelectItem>
                  <SelectItem value="0" className="rounded-lg">All</SelectItem>
                </SelectContent>
              </Select>
            </CardAction>
          </CardHeader>
          <CardContent>
            {visitStats && Array.isArray(visitStats.topSites) && visitStats.topSites.length > 0 ? (
              <div className="max-h-[318px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">{t("thRank")}</TableHead>
                      <TableHead>{t("thSiteName")}</TableHead>
                      <TableHead className="text-right">{t("thVisitCount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitStats.topSites.map((site, index) => (
                      <TableRow key={site.id}>
                        <TableCell className="font-medium">
                          {index === 0 && (
                            <Badge variant="default">1</Badge>
                          )}
                          {index === 1 && (
                            <Badge variant="secondary">2</Badge>
                          )}
                          {index === 2 && (
                            <Badge variant="secondary">3</Badge>
                          )}
                          {index > 2 && (
                            <span className="text-muted-foreground">#{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {site.iconUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={site.iconUrl}
                                alt={site.name}
                                className="h-5 w-5 rounded"
                              />
                            )}
                            <span className="font-medium">{site.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold">{site.visitCount.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BarChart3 className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>
                    {t("emptyDesc")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        {categoryDistribution && (
          <CategoryDistributionChart data={categoryDistribution.data} />
        )}
      </div>

      {/* 访问频次统计 */}
      {frequencyData && (
        <VisitFrequencyChart
          data={frequencyData.frequency || []}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
    </div>
  )
}
