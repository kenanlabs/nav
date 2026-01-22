"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { PoetryToggle } from "@/components/poetry-toggle"
import { FaviconServiceToggle } from "@/components/favicon-service-toggle"
import { SiteSubmissionDialog } from "@/components/layout/site-submission-dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Search, X } from "lucide-react"
import { logger } from "@/lib/logger"

// 系统设置缓存类型
interface SettingsCache {
  siteLogo?: string | null
  enableSubmission?: boolean
}

// 缓存设置数据，避免每次页面切换都重新加载
let settingsCache: SettingsCache | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

interface HeaderProps {
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  currentCategory?: string
  siteName?: string
  siteLogo?: string | null
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function Header({
  categories,
  currentCategory = "",
  siteName = "Conan Nav",
  siteLogo = null,
  searchQuery = "",
  onSearchChange
}: HeaderProps) {
  const [logo, setLogo] = useState<string | null>(siteLogo)
  const [enableSubmission, setEnableSubmission] = useState<boolean>(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSettings() {
      // 检查缓存
      const now = Date.now()
      if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (settingsCache.siteLogo && !cancelled) setLogo(settingsCache.siteLogo)
        return
      }

      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const settings = await res.json()
          if (!cancelled) {
            settingsCache = settings
            cacheTimestamp = now
            if (settings.siteLogo) setLogo(settings.siteLogo)
            setEnableSubmission(settings.enableSubmission ?? true)
          }
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("Failed to load settings:", error)
        }
      }
    }

    loadSettings()

    // 窗口焦点时检查缓存是否过期
    const handleFocus = () => {
      const now = Date.now()
      if (!settingsCache || (now - cacheTimestamp) > CACHE_DURATION) {
        loadSettings()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      cancelled = true
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleClearSearch = () => {
    onSearchChange?.("")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center">
          <div className="flex-shrink-0 pr-6 sm:pr-8">
            <Link href="/" className="flex items-center space-x-2">
              {logo && (
                <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
              )}
              <span className="font-bold text-xl">{siteName}</span>
            </Link>
          </div>

          {/* 响应式导航：桌面端横向导航，移动端 Drawer */}
          {!mounted ? (
            // 占位符：保持布局稳定
            <div className="flex-1" />
          ) : isDesktop ? (
            // 桌面端：Tabs 风格的横向导航
            <nav className="flex flex-1 items-center overflow-x-auto overflow-y-hidden scrollbar-hide">
              <div className="bg-muted inline-flex h-9 items-center justify-center rounded-lg p-[3px]">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={`inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] ${
                      currentCategory === category.slug
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </nav>
          ) : (
            // 移动端：Drawer（从左侧展开）
            <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
              <DrawerTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                  </svg>
                  <span className="sr-only">分类</span>
                </button>
              </DrawerTrigger>
              <DrawerContent className="h-full w-[280px] rounded-none border-r">
                <DrawerHeader className="sr-only">
                  <DrawerTitle>选择分类</DrawerTitle>
                </DrawerHeader>
                <div className="grid gap-1 px-4 py-6">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-3 px-4 rounded-md transition-colors ${
                        currentCategory === category.slug
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          )}

          <div className="flex-shrink-0 pl-2 sm:pl-4 flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Label htmlFor="search" className="sr-only">搜索</Label>
              <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 pointer-events-none select-none" />
              <Input
                id="search"
                type="text"
                placeholder="搜索..."
                className="h-9 w-40 sm:w-48 lg:w-64 pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                suppressHydrationWarning
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  type="button"
                  aria-label="清除搜索"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 网站收录按钮 */}
            {enableSubmission && (
              <SiteSubmissionDialog categories={categories} />
            )}

            <FaviconServiceToggle />
            <PoetryToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
