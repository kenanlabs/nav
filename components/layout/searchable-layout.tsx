"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { pinyin } from "pinyin-pro"
import { ScrollHeader } from "./scroll-header"
import { Footer } from "./footer"
import { SiteGrid } from "./site-grid"
import { JinrishiciCardWrapper } from "./jinrishici-card-wrapper"
import { BackToTop } from "./back-to-top"
import { SiteDetailProvider } from "./site-detail-provider"
import { Badge } from "@/components/ui/badge"
import { usePoetryToggle } from "@/hooks/use-poetry-toggle"

interface Site {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  isPinned?: boolean
  hasDetail?: boolean
  category?: {
    name: string
  } | null
}

interface SearchableLayoutProps {
  allCategories: Array<{
    id: string
    name: string
    slug: string
    icon?: string | null
  }>
  flatSites: Site[]
  siteName?: string
  currentCategory?: string
  useAnchorLinks?: boolean
  enableSiteDetail?: boolean
  children: React.ReactNode
}

export function SearchableLayout({
  allCategories,
  flatSites,
  siteName,
  currentCategory,
  useAnchorLinks,
  enableSiteDetail,
  children,
}: SearchableLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isHomePath, setIsHomePath] = useState(false)
  const { isVisible: isPoetryVisible, mounted: poetryMounted } = usePoetryToggle()
  const t = useTranslations("search")

  useEffect(() => {
    if (typeof window === "undefined") return
    setIsHomePath(window.location.pathname === "/" || window.location.pathname === "")
  }, [])

  const anchorLinks = useAnchorLinks ?? isHomePath

  // 预计算每个 site 的拼音，用于拼音搜索匹配
  const pinyinMap = useMemo(() => {
    const map = new Map<string, { namePinyin: string; descPinyin: string }>()
    for (const site of flatSites) {
      map.set(site.id, {
        namePinyin: pinyin(site.name, { toneType: "none", type: "array" }).join("").toLowerCase(),
        descPinyin: pinyin(site.description, { toneType: "none", type: "array" }).join("").toLowerCase(),
      })
    }
    return map
  }, [flatSites])

  const filteredSites = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return flatSites.filter(site => {
      // 原文匹配
      if (
        site.name.toLowerCase().includes(query) ||
        site.description.toLowerCase().includes(query) ||
        site.url.toLowerCase().includes(query)
      ) {
        return true
      }
      // 拼音匹配
      const py = pinyinMap.get(site.id)
      if (py) {
        if (py.namePinyin.includes(query) || py.descPinyin.includes(query)) {
          return true
        }
      }
      return false
    })
  }, [searchQuery, flatSites, pinyinMap])

  const isSearching = searchQuery.trim().length > 0
  const hasPoetryRightSpace = poetryMounted && isPoetryVisible

  return (
    <SiteDetailProvider initialEnableSiteDetail={enableSiteDetail}>
      <div className="min-h-screen flex flex-col">
      <ScrollHeader
        categories={allCategories}
        siteName={siteName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentCategory={currentCategory}
        useAnchorLinks={anchorLinks}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-[1600px] w-full">
          {/* 今日诗词 - 固定在右上角 */}
          <JinrishiciCardWrapper />

          {/* 内容区域：为诗词卡片预留右侧空间 */}
          <div className="lg:pr-36 lg:pl-2">
            {isSearching ? (
              // 搜索结果
              <div className="animate-fade-in">
                <div className="mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("resultsTitle")}</h1>
                  <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                    {t("found", { count: filteredSites.length })}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {t("keyword")}：<span className="font-semibold text-foreground">{t("quoted", { query: searchQuery })}</span>
                  </p>
                </div>

                {filteredSites.length === 0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-8 text-center animate-scale-in">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-foreground">{t("notFoundTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      {t("notFoundDesc", { query: searchQuery })}
                    </p>
                  </div>
                ) : (
                  <SiteGrid sites={filteredSites} />
                )}
              </div>
            ) : (
              // 页面内容（由父组件传入）
              children
            )}
          </div>

          <BackToTop />
        </div>
      </main>

      <Footer />
      </div>
    </SiteDetailProvider>
  )
}
