"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// jinrishici 模块的类型定义
interface PoetryData {
  content: string
  origin: {
    title: string
    dynasty: string
    author: string
  }
}

interface JinrishiciResult {
  data: PoetryData
  status: string
}

interface JinrishiciAPI {
  load(
    success: (result: JinrishiciResult) => void,
    error?: (err: Error) => void
  ): void
}

// 使用类型断言而不是 declare module
const jinrishici = require("jinrishici") as JinrishiciAPI

interface JinrishiciCardProps {
  onClose?: () => void
}

// 默认诗词（当 API 失败时使用）
const DEFAULT_POETRY: PoetryData = {
  content: "海内存知己，天涯若比邻",
  origin: {
    title: "送杜少府之任蜀州",
    dynasty: "唐",
    author: "王勃"
  }
}

// 模块级缓存：避免重复调用 API
let poetryCache: PoetryData | null = null
let isLoading = false
let hasFailed = false

export function JinrishiciCard({ onClose }: JinrishiciCardProps) {
  const [poetry, setPoetry] = useState<PoetryData | null>(() => poetryCache || DEFAULT_POETRY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    // 如果已经有缓存，直接使用
    if (poetryCache) {
      setPoetry(poetryCache)
      return
    }

    // 如果已经失败过，直接使用默认诗词
    if (hasFailed) {
      setPoetry(DEFAULT_POETRY)
      return
    }

    // 标记正在加载
    isLoading = true
    setLoading(true)

    jinrishici.load(
      (result) => {
        if (isMounted) {
          poetryCache = result.data // 缓存结果
          setPoetry(result.data)
          setLoading(false)
          isLoading = false
        }
      },
      (err: Error) => {
        // 静默失败，使用默认诗词
        if (isMounted) {
          hasFailed = true
          setPoetry(DEFAULT_POETRY)
          setLoading(false)
          isLoading = false
        }
      }
    )

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <Card>
        {onClose && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!poetry) {
    return null
  }

  return (
    <Card className="relative group">
      {onClose && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <CardContent className="px-8">
        {/* 竖向排列容器：从右到左 */}
        <div
          className="font-lxgw-wenkai text-foreground"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'upright',
            height: 'auto',
            minHeight: '200px',
            letterSpacing: '0.2em',
            lineHeight: '2',
          }}
        >
          {/* 诗句 */}
          <div className="text-xl">
            {poetry.content}
          </div>

          {/* 出处信息 */}
          <div className="text-sm text-muted-foreground mt-0" style={{ marginLeft: '0.8em' }}>
            <span className="font-medium">《{poetry.origin.title}》</span>
            <span className="mx-2">·</span>
            <span>{poetry.origin.dynasty}</span>
            <span className="mx-1">·</span>
            <span>{poetry.origin.author}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
