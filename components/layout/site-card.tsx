"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card"
import { ExternalLink, ArrowUpRight } from "lucide-react"
import { useFaviconService, getFaviconUrl } from "@/hooks/use-favicon-service"
import { cn } from "@/lib/utils"

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
  const { service } = useFaviconService()

  // 使用 useMemo 优化 favicon URL 计算
  // 优先级：用户配置 > 选中的 Favicon 服务
  const iconSrc = useMemo(() => {
    if (site.iconUrl) return site.iconUrl

    try {
      const domain = new URL(site.url).hostname
      // 使用选中的 Favicon 服务
      return getFaviconUrl(domain, service)
    } catch {
      return null
    }
  }, [site.iconUrl, site.url, service])

  // 计算首字母图标（作为 fallback）
  const initial = useMemo(() => getInitialIcon(site.name), [site.name])

  // 当服务切换时，重置加载状态
  useEffect(() => {
    setImageLoaded(false)
    hasTriedLoad.current = false
  }, [iconSrc])

  // 使用 useEffect + new Image() 预加载图片
  useEffect(() => {
    if (!iconSrc || hasTriedLoad.current) return

    hasTriedLoad.current = true
    const img = new Image()
    img.crossOrigin = "anonymous"

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
      className="group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className={cn(
        "h-full py-4 border-border/60",
        "transition-all duration-200 ease-out",
        "hover:border-border hover:shadow-md hover:-translate-y-0.5",
        "group-focus-visible:border-ring"
      )}>
        <CardHeader className="gap-3">
          <CardAction className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardAction>
          <div className="flex items-start gap-3">
            {/* 图标容器 - 固定尺寸 */}
            <div className="flex-shrink-0">
              {iconSrc && imageLoaded ? (
                <div className="relative">
                  <img
                    src={iconSrc}
                    alt={`${site.name} 图标`}
                    className="h-10 w-10 rounded-lg object-contain bg-muted/30 p-0.5"
                  />
                </div>
              ) : (
                <div
                  className="h-10 w-10 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-sm font-semibold text-muted-foreground shadow-sm"
                  title={site.name}
                >
                  {initial}
                </div>
              )}
            </div>
            
            {/* 文字内容 */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <CardTitle 
                className="text-base font-medium leading-snug line-clamp-2 group-hover:text-foreground transition-colors" 
                title={site.name}
              >
                {site.name}
              </CardTitle>
              {site.description && (
                <CardDescription 
                  className="line-clamp-2 leading-relaxed" 
                  title={site.description}
                >
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
