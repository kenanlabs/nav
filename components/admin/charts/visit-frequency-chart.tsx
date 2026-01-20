"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { TrendingUp } from "lucide-react"
import { useMemo } from "react"

interface VisitFrequencyChartProps {
  data: Array<{
    date: string
    count: number
  }>
  timeRange: number
  onTimeRangeChange: (days: 0 | 7 | 30 | 90) => void
}

export function VisitFrequencyChart({ data, timeRange, onTimeRangeChange }: VisitFrequencyChartProps) {
  // 填充缺失的日期数据
  const displayData = useMemo(() => {
    if (timeRange === 0) {
      // 全部数据模式，不填充
      return data
    }

    // 计算日期范围
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - timeRange + 1)

    // 创建日期映射
    const dateMap = new Map<string, number>()
    data.forEach(item => {
      const dateKey = item.date.split('T')[0] // YYYY-MM-DD
      dateMap.set(dateKey, item.count)
    })

    // 填充所有日期
    const filledData: Array<{ date: string; count: number }> = []
    for (let i = 0; i < timeRange; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      filledData.push({
        date: dateKey,
        count: dateMap.get(dateKey) || 0
      })
    }

    return filledData
  }, [data, timeRange])

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return month + "/" + day
  }

  // 格式化完整日期
  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    return year + "年" + month + "月" + day + "日 " + weekDay
  }

  // 计算总访问量
  const totalVisits = data.reduce((sum, item) => sum + item.count, 0)

  // 计算合理的 Y 轴最大值
  const maxCount = Math.max(...displayData.map(d => d.count), 0)
  const yAxisMax = maxCount > 0 ? Math.ceil(maxCount * 1.2) : 10 // 留20%空间，最小为10

  // 获取时间范围标签
  const getTimeRangeLabel = () => {
    if (timeRange === 0) return "全部"
    if (timeRange === 90) return "最近3个月"
    if (timeRange === 30) return "最近1个月"
    return "最近" + timeRange + "天"
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          访问频次统计
        </CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getTimeRangeLabel()}共 {totalVisits.toLocaleString()} 次访问
          </span>
          <span className="@[540px]/card:hidden">
            {timeRange === 0 ? "全部" : (timeRange === 90 ? "3个月" : timeRange === 30 ? "1个月" : timeRange + "天")}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange.toString()}
            onValueChange={(value) => value && onTimeRangeChange(Number(value) as 0 | 7 | 30 | 90)}
            variant="outline"
            className="hidden md:flex"
          >
            <ToggleGroupItem value="0" className="rounded-r-none">全部</ToggleGroupItem>
            <ToggleGroupItem value="90" className="rounded-none border-l-0">最近3个月</ToggleGroupItem>
            <ToggleGroupItem value="30" className="rounded-none border-l-0">最近1个月</ToggleGroupItem>
            <ToggleGroupItem value="7" className="rounded-l-none border-l-0">最近7天</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange.toString()}
            onValueChange={(value) => onTimeRangeChange(Number(value) as 0 | 7 | 30 | 90)}
          >
            <SelectTrigger
              className="flex w-32 md:hidden"
              aria-label="选择时间范围"
            >
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="0" className="rounded-lg">全部</SelectItem>
              <SelectItem value="90" className="rounded-lg">最近3个月</SelectItem>
              <SelectItem value="30" className="rounded-lg">最近1个月</SelectItem>
              <SelectItem value="7" className="rounded-lg">最近7天</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={displayData}>
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, yAxisMax]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  if (value >= 1000) return (value / 1000).toFixed(1) + "k"
                  return value.toString()
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                labelFormatter={(label) => formatFullDate(label)}
                formatter={(value: number | undefined) => [
                  value ? (value + " 次") : '0 次',
                  '访问量',
                ]}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  )
}
