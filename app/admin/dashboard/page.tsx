"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Loader2, BarChart3, TrendingUp, Globe, FolderKanban, Users, ArrowUpRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { VisitFrequencyChart } from "@/components/admin/charts/visit-frequency-chart"
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
import { cn } from "@/lib/utils"

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

interface SiteStats {
  title: string
  value: number
  loading: boolean
  icon: typeof Globe
  trend?: string
}

type TimeRange = 0 | 7 | 30 | 90
type TopCount = 5 | 10 | 30 | 0

const statIcons = {
  "网站总数": Globe,
  "分类总数": FolderKanban,
  "独立访客数": Users,
  "总访问量": TrendingUp,
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null)
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const [topCount, setTopCount] = useState<TopCount>(5)
  const [siteStats, setSiteStats] = useState<SiteStats[]>([
    { title: "网站总数", value: 0, loading: true, icon: Globe },
    { title: "分类总数", value: 0, loading: true, icon: FolderKanban },
    { title: "独立访客数", value: 0, loading: true, icon: Users },
    { title: "总访问量", value: 0, loading: true, icon: TrendingUp },
  ])

  // 获取时间范围描述
  const getTimeRangeLabel = (days: TimeRange) => {
    if (days === 0) return "全部时间"
    if (days === 90) return "近3个月"
    if (days === 30) return "近30天"
    return `近${days}天`
  }

  // 获取排行数量描述
  const getTopCountLabel = (count: TopCount) => {
    if (count === 0) return "全部"
    return `前${count}`
  }

  // 加载统计数据
  useEffect(() => {
    async function loadStats() {
      try {
        const [sitesRes, categoriesRes, usersRes, visitsRes, frequencyRes] = await Promise.all([
          fetch("/api/admin/stats/sites"),
          fetch("/api/admin/stats/categories"),
          fetch("/api/admin/stats/users"),
          fetch(`/api/admin/stats/visits?days=${timeRange}&limit=${topCount}`),
          fetch(`/api/admin/stats/frequency?days=${timeRange}`),
        ])

        const sitesData = await sitesRes.json()
        const categoriesData = await categoriesRes.json()
        const usersData = await usersRes.json()
        const visitsData = await visitsRes.json()
        const frequencyData = await frequencyRes.json()

        setSiteStats([
          { title: "网站总数", value: sitesData.total || 0, loading: false, icon: Globe },
          { title: "分类总数", value: categoriesData.total || 0, loading: false, icon: FolderKanban },
          { title: "独立访客数", value: usersData.total || 0, loading: false, icon: Users },
          { title: "总访问量", value: visitsData.totalVisits || 0, loading: false, icon: TrendingUp },
        ])

        setVisitStats(visitsData)
        setFrequencyData(frequencyData)
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">数据统计</h1>
        <p className="text-sm text-muted-foreground mt-1">查看网站访问数据和统计信息</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {siteStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.title} 
              className={cn(
                "border-border/60 transition-all duration-200 hover:shadow-md hover:border-border animate-fade-up",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <CardAction>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  {stat.loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 访问排行 */}
      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-medium">网站访问排行</CardTitle>
          </div>
          <CardDescription>{getTimeRangeLabel(timeRange)}热门网站</CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={topCount.toString()}
              onValueChange={(value) => value && setTopCount(Number(value) as 5 | 10 | 30 | 0)}
              variant="outline"
              className="hidden md:flex"
            >
              <ToggleGroupItem value="5" className="text-xs px-2.5 h-8">Top 5</ToggleGroupItem>
              <ToggleGroupItem value="10" className="text-xs px-2.5 h-8">Top 10</ToggleGroupItem>
              <ToggleGroupItem value="30" className="text-xs px-2.5 h-8">Top 30</ToggleGroupItem>
              <ToggleGroupItem value="0" className="text-xs px-2.5 h-8">All</ToggleGroupItem>
            </ToggleGroup>
            <Select
              value={topCount.toString()}
              onValueChange={(value) => setTopCount(Number(value) as 5 | 10 | 30 | 0)}
            >
              <SelectTrigger
                className="flex w-24 md:hidden h-8 text-xs"
                aria-label="选择显示数量"
              >
                <SelectValue placeholder="选择数量" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="5" className="text-xs">Top 5</SelectItem>
                <SelectItem value="10" className="text-xs">Top 10</SelectItem>
                <SelectItem value="30" className="text-xs">Top 30</SelectItem>
                <SelectItem value="0" className="text-xs">All</SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {visitStats && visitStats.topSites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-14">排名</TableHead>
                  <TableHead>网站名称</TableHead>
                  <TableHead className="text-right w-28">访问次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitStats.topSites.map((site, index) => (
                  <TableRow key={site.id} className="group">
                    <TableCell className="font-medium">
                      {index === 0 && (
                        <Badge className="bg-amber-500 hover:bg-amber-500/90 text-amber-50">1</Badge>
                      )}
                      {index === 1 && (
                        <Badge variant="secondary" className="bg-slate-300 text-slate-700">2</Badge>
                      )}
                      {index === 2 && (
                        <Badge variant="secondary" className="bg-amber-200 text-amber-700">3</Badge>
                      )}
                      {index > 2 && (
                        <span className="text-muted-foreground text-sm ml-1">#{index + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {site.iconUrl ? (
                          <img
                            src={site.iconUrl}
                            alt={site.name}
                            className="h-6 w-6 rounded object-contain bg-muted/30"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {site.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium group-hover:text-foreground transition-colors">
                          {site.name}
                        </span>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums">{site.visitCount.toLocaleString()}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="h-10 w-10 opacity-50 mb-3" />
              <p className="text-sm">暂无访问数据</p>
            </div>
          )}
        </CardContent>
      </Card>

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
