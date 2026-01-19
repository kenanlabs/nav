"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { PoetryToggle } from "@/components/poetry-toggle"
import { SiteSubmissionDialog } from "@/components/layout/site-submission-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Menu, X } from "lucide-react"

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

  useEffect(() => {
    async function loadSettings() {
      // 检查缓存
      const now = Date.now()
      if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        if (settingsCache.siteLogo) setLogo(settingsCache.siteLogo)
        return
      }

      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const settings = await res.json()
          settingsCache = settings
          cacheTimestamp = now
          if (settings.siteLogo) setLogo(settings.siteLogo)
          setEnableSubmission(settings.enableSubmission ?? true)
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
    loadSettings()
  }, [])

  const handleClearSearch = () => {
    onSearchChange?.("")
  }

  // 生成短名称
  const shortName = siteName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex h-16 items-center">
          <div className="flex-shrink-0 pr-6 sm:pr-8">
            <Link href="/" className="flex items-center space-x-2">
              {logo && (
                <img src={logo} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <span className="hidden font-bold sm:inline-block text-xl">
                {siteName}
              </span>
              <span className="font-bold sm:hidden text-xl">{shortName}</span>
            </Link>
          </div>

          {/* 移动端下拉菜单 */}
          <div className="md:hidden flex-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md transition-colors">
                  <Menu className="h-4 w-4" />
                  <span>分类</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link
                      href={`/category/${category.slug}`}
                      className={currentCategory === category.slug ? "text-foreground" : "text-foreground/60"}
                    >
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 桌面端横向导航 */}
          <nav className="hidden md:flex flex-1 items-center space-x-4 lg:space-x-6 text-sm font-medium overflow-x-auto overflow-y-hidden scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className={`transition-colors hover:text-foreground/80 whitespace-nowrap ${
                  currentCategory === category.slug
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="flex-shrink-0 pl-2 sm:pl-4 flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="搜索..."
                className="h-9 w-40 sm:w-48 lg:w-64 pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
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

            <PoetryToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
