"use client"

import { useState, useMemo } from "react"
import { ScrollHeader } from "./scroll-header"
import { Footer } from "./footer"
import { SiteCard } from "./site-card"
import { JinrishiciCardWrapper } from "./jinrishici-card-wrapper"
import { Badge } from "@/components/ui/badge"
import { SearchX } from "lucide-react"

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

interface SearchableLayoutProps {
  allCategories: Array<{
    id: string
    name: string
    slug: string
  }>
  flatSites: Site[]
  siteName?: string
  currentCategory?: string
  children: React.ReactNode
}

export function SearchableLayout({
  allCategories,
  flatSites,
  siteName,
  currentCategory,
  children,
}: SearchableLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return flatSites.filter(site =>
      site.name.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query) ||
      site.url.toLowerCase().includes(query)
    )
  }, [searchQuery, flatSites])

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollHeader
        categories={allCategories}
        siteName={siteName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentCategory={currentCategory}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-[1600px] w-full">
          {/* 今日诗词 - 固定在右上角，根据用户设置显示/隐藏 */}
          <JinrishiciCardWrapper />

          {/* 内容区域：为诗词卡片预留右侧空间 */}
          <div className="lg:pr-36 lg:pl-2">
            {isSearching ? (
              // 搜索结果
              <div className="animate-fade-in">
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">搜索结果</h1>
                  <Badge variant="secondary" className="font-normal">
                    {filteredSites.length} 个结果
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    关键词：<span className="font-medium text-foreground">「{searchQuery}」</span>
                  </span>
                </div>

                {filteredSites.length === 0 ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <SearchX className="h-12 w-12 opacity-50" />
                      <div className="text-center">
                        <p className="text-base font-medium">未找到匹配的网站</p>
                        <p className="text-sm mt-1">请尝试其他关键词</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSites.map((site, index) => (
                      <div
                        key={site.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <SiteCard site={site} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // 页面内容（由父组件传入）
              children
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
