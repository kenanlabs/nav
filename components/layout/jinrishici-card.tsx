"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
// @ts-ignore
const jinrishici = require("jinrishici")

interface PoetryData {
  content: string
  origin: {
    title: string
    dynasty: string
    author: string
  }
}

interface JinrishiciCardProps {
  onClose?: () => void
}

export function JinrishiciCard({ onClose }: JinrishiciCardProps) {
  const [poetry, setPoetry] = useState<PoetryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    jinrishici.load(
      (result: any) => {
        setPoetry(result.data)
        setLoading(false)
      },
      (err: any) => {
        console.error("Failed to load poetry:", err)
        setError(true)
        setLoading(false)
      }
    )
  }, [])

  if (loading) {
    return (
      <Card className="border bg-card relative">
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 opacity-50 hover:opacity-100 transition-opacity"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error || !poetry) {
    return null
  }

  return (
    <Card className="border bg-card/30 backdrop-blur-sm relative group">
      {/* 关闭按钮 */}
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-50 hover:opacity-100 transition-all"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      <CardContent className="py-6 px-8">
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
