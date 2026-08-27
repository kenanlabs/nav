import type { Metadata } from "next"
import { SearchableLayout } from "@/components/layout/searchable-layout"
import { MarkdownContent } from "@/components/markdown-content"
import { getAllCategories, getSystemSettings, getSites } from "@/lib/actions"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

// 语言解析依赖请求级 Cookie（i18n/request.ts），页面按请求动态渲染

export async function generateMetadata(): Promise<Metadata> {
  const result = await getSystemSettings()
  const settings = result.success && result.data ? result.data : null
  const t = await getTranslations("about")

  return {
    title: `${t("title")} - ${settings?.siteName || "Conan Nav"}`,
    description: settings?.siteDescription,
  }
}

export default async function AboutPage() {
  const { data: allCategories } = await getAllCategories()
  const { data: allSites } = await getSites()
  const { data: settings } = await getSystemSettings()
  const t = await getTranslations("about")

  if (settings?.enableAbout === false) {
    notFound()
  }

  const flatSites = allSites?.filter(site => site.isPublished) || []
  const aboutContent = settings?.aboutContent?.trim() || ""

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
      enableSiteDetail={settings?.enableSiteDetail}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-xl sm:text-2xl font-bold tracking-tight text-foreground/95">
          {t("title")}
        </h1>
        {aboutContent ? (
          <div className="rounded-xl border border-border/60 bg-card p-5 sm:p-8">
            <MarkdownContent content={aboutContent} />
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("emptyDesc")}</p>
          </div>
        )}
      </div>
    </SearchableLayout>
  )
}
