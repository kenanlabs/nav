"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Loader2, BarChart3, TrendingUp, Globe, FolderKanban, Users } from "lucide-react"
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
}

type TimeRange = 0 | 7 | 30 | 90
type TopCount = 5 | 10 | 30 | 0

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [visitStats, setVisitStats] = useState<VisitStats | null>(null)
  const [frequencyData, setFrequencyData] = useState<FrequencyData | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>(7)
  const [topCount, setTopCount] = useState<TopCount>(5)
  const [siteStats, setSiteStats] = useState<SiteStats[]>([
    { title: "网站总数", value: 0, loading: true },
    { title: "分类总数", value: 0, loading: true },
    { title: "独立访客数", value: 0, loading: true },
    { title: "总访问量", value: 0, loading: true },
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
          { title: "网站总数", value: sitesData.total || 0, loading: false },
          { title: "分类总数", value: categoriesData.total || 0, loading: false },
          { title: "独立访客数", value: usersData.total || 0, loading: false },
          { title: "总访问量", value: visitsData.totalVisits || 0, loading: false },
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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {siteStats.map((stat) => (
          <Card key={stat.title} className="@container/card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <CardAction>
                {stat.title === "网站总数" && <Globe className="h-4 w-4 text-muted-foreground" />}
                {stat.title === "分类总数" && <FolderKanban className="h-4 w-4 text-muted-foreground" />}
                {stat.title === "独立访客数" && <Users className="h-4 w-4 text-muted-foreground" />}
                {stat.title === "总访问量" && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">
                {stat.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  stat.value.toLocaleString()
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 访问排行 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            网站访问排行
          </CardTitle>
          <CardDescription>{getTimeRangeLabel(timeRange)}热门网站</CardDescription>
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
                aria-label="选择显示数量"
              >
                <SelectValue placeholder="选择数量" />
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
          {visitStats && visitStats.topSites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">排名</TableHead>
                  <TableHead>网站名称</TableHead>
                  <TableHead className="text-right">访问次数</TableHead>
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
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            暂无访问数据
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
