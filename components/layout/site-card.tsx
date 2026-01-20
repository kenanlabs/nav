"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

// 生成首字母图标（shadcn/ui 简洁风格）
function getInitialIcon(name: string) {
  const trimmed = name.trim()
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    const code = char.codePointAt(0) || 0

    // 匹配：英文字母 (A-Z, a-z) 或 中文字符 (0x4e00-0x9fff)
    const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
    const isChinese = code >= 0x4e00 && code <= 0x9fff

    if (isLetter || isChinese) {
      return char.toUpperCase()
    }
  }

  // 如果没有找到合适的字符，返回默认图标
  return 'N'
}

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  category?: {
    name: string
  }
}

interface SiteCardProps {
  site: Site
}

export function SiteCard({ site }: SiteCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const hasTriedLoad = useRef(false)

  // 使用 useMemo 优化 favicon URL 计算
  // 优先级：用户配置 > DuckDuckGo（在中国可访问）
  const iconSrc = useMemo(() => {
    if (site.iconUrl) return site.iconUrl

    try {
      const domain = new URL(site.url).hostname
      // 使用 DuckDuckGo Favicon API（在中国可访问）
      // DuckDuckGo 会自动解析 HTML meta 标签，比直接找 /favicon.ico 更准确
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`
    } catch {
      return null
    }
  }, [site.iconUrl, site.url])

  // 计算首字母图标（作为 fallback）
  const initial = useMemo(() => getInitialIcon(site.name), [site.name])

  // 使用 useEffect + new Image() 预加载图片
  useEffect(() => {
    if (!iconSrc || hasTriedLoad.current) return

    hasTriedLoad.current = true
    const img = new Image()

    img.onload = () => {
      setImageLoaded(true)
    }

    img.onerror = () => {
      // 保持显示首字母图标
    }

    img.src = iconSrc
  }, [iconSrc])

  const handleClick = () => {
    // 使用 sendBeacon 异步记录访问，不阻塞页面跳转
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ siteId: site.id })
      navigator.sendBeacon('/api/visit', new Blob([data], { type: 'application/json' }))
    }
  }

  return (
    <Link
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={`访问 ${site.name}`}
      className="group block"
    >
      <Card className="h-full transition-colors hover:bg-muted">
        <CardHeader>
          <CardAction>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardAction>
          <div className="flex items-center space-x-3">
            {iconSrc && imageLoaded ? (
              <img
                src={iconSrc}
                alt={`${site.name} 图标`}
                className="h-8 w-8 rounded"
              />
            ) : (
              <div
                className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground"
                title={site.name}
              >
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-2 leading-tight" title={site.name}>{site.name}</CardTitle>
              {site.description && (
                <CardDescription className="mt-2 line-clamp-1" title={site.description}>
                  {site.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
