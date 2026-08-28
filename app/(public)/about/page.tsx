import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { SearchableLayout } from "@/components/layout/searchable-layout"
import { MarkdownContent } from "@/components/markdown-content"
import { getAllCategories, getAboutPage, getSites } from "@/lib/actions"

// 语言解析依赖请求级 Cookie（i18n/request.ts），页面按请求动态渲染；
// 后台更新内容时由 revalidatePath("/about") 触发立即重新渲染

export async function generateMetadata(): Promise<Metadata> {
  const [about, t] = await Promise.all([getAboutPage(), getTranslations("about")])
  return {
    title: `${t("title")} - ${about.siteName}`,
  }
}

export default async function AboutPage() {
  const [about, { data: allCategories }, { data: allSites }, t] = await Promise.all([
    getAboutPage(),
    getAllCategories(),
    getSites(),
    getTranslations("about"),
  ])

  // 未启用或无内容（且无全局默认内容）时不渲染空页面
  if (!about.enabled || !about.content) {
    notFound()
  }

  // 将所有网站扁平化，用于客户端搜索（与首页/分类页保持一致）
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={about.siteName}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/95">
            {t("title")}
          </h1>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-6">
          <MarkdownContent content={about.content} />
        </div>
      </div>
    </SearchableLayout>
  )
}
