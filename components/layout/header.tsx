"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Search, X, Command, PanelLeft } from "lucide-react"
import { logger } from "@/lib/logger"
import { cn } from "@/lib/utils"

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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const isDesktop = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    setMounted(true)
  }, [])

  // 键盘快捷键支持 (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (!isDesktop) {
          setMobileSearchOpen(true)
        } else {
          // 桌面端聚焦搜索框
          const searchInput = document.getElementById("search")
          if (searchInput) {
            searchInput.focus()
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isDesktop])

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

  const handleClearSearch = useCallback(() => {
    onSearchChange?.("")
  }, [onSearchChange])

  const handleMobileSearch = useCallback((value: string) => {
    onSearchChange?.(value)
  }, [onSearchChange])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 items-center gap-4">
          {/* Logo 区域 */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              {logo && (
                <img src={logo} alt="Logo" className="h-6 w-6 object-contain" />
              )}
              <span className="font-semibold text-lg tracking-tight group-hover:text-foreground/80 transition-colors">
                {siteName}
              </span>
            </Link>
          </div>

          {/* 响应式导航：桌面端横向导航，移动端 Drawer */}
          {!mounted ? (
            // 占位符：保持布局稳定
            <div className="flex-1" />
          ) : isDesktop ? (
            // 桌面端：Tabs 风格的横向导航
            <nav className="flex flex-1 items-center overflow-x-auto overflow-y-hidden scrollbar-hide ml-4">
              <div className="bg-muted/50 inline-flex h-9 items-center justify-center rounded-lg p-1 gap-0.5">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={cn(
                      "inline-flex h-7 items-center justify-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                      currentCategory === category.slug
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </nav>
          ) : (
            // 移动端：Drawer（从左侧展开）+ 扩展区域
            <>
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} direction="left">
                <DrawerTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <PanelLeft className="h-4 w-4" />
                    <span className="sr-only">打开分类菜单</span>
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-full w-[280px] rounded-none border-r">
                  <DrawerHeader className="border-b px-4 py-3">
                    <DrawerTitle className="text-base font-medium">分类导航</DrawerTitle>
                  </DrawerHeader>
                  <div className="flex flex-col gap-1 p-3">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center py-2.5 px-3 rounded-md text-sm transition-colors",
                          currentCategory === category.slug
                            ? "bg-accent text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
              <div className="flex-1" />
            </>
          )}

          {/* 右侧工具栏 */}
          <div className="flex-shrink-0 flex items-center gap-1.5">
            {/* 桌面端搜索框 */}
            {mounted && isDesktop && (
              <div className="relative">
                <Label htmlFor="search" className="sr-only">搜索</Label>
                <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="search"
                  type="text"
                  placeholder="搜索网站..."
                  className="h-9 w-44 lg:w-56 pl-8 pr-8 bg-muted/50 border-transparent hover:border-border focus-visible:border-border focus-visible:bg-background transition-colors [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  suppressHydrationWarning
                />
                {searchQuery ? (
                  <button
                    onClick={handleClearSearch}
                    className="absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    type="button"
                    aria-label="清除搜索"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="h-2.5 w-2.5" />K
                  </kbd>
                )}
              </div>
            )}

            {/* 移动端搜索按钮 */}
            {mounted && !isDesktop && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <Search className="h-4 w-4" />
                  <span className="sr-only">搜索</span>
                </Button>

                {/* 移动端搜索对话框 */}
                <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
                  <DialogContent className="top-4 translate-y-0 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="sr-only">搜索网站</DialogTitle>
                    </DialogHeader>
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <Input
                        type="text"
                        placeholder="搜索网站..."
                        className="h-10 pl-9 pr-9"
                        value={searchQuery}
                        onChange={(e) => handleMobileSearch(e.target.value)}
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            handleClearSearch()
                          }}
                          className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          type="button"
                          aria-label="清除搜索"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <p className="text-sm text-muted-foreground">
                        按 Enter 或点击搜索结果查看
                      </p>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}

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
