import { SearchableLayout } from "@/components/layout/searchable-layout"
import { SiteCard } from "@/components/layout/site-card"
import { getAllCategories, getCategoryBySlug, getSystemSettings, getSites } from "@/lib/actions"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"

// ISR 配置：每 10 秒自动重新生成页面
// 这样在 seed 后 10 秒内会自动看到新数据
// 当后台更新数据时，revalidatePath("/") 会触发立即重新生成
export const revalidate = 10

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { data: category } = await getCategoryBySlug(slug)
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()

  if (!category) {
    notFound()
  }

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
      currentCategory={slug}
    >
      <div className="animate-fade-in">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
          {category.sites && category.sites.length > 0 && (
            <Badge variant="secondary" className="font-normal">
              {category.sites.length} 个网站
            </Badge>
          )}
        </div>

        {category.sites && category.sites.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.sites.map((site, index) => (
              <div
                key={site.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <SiteCard site={site} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Globe className="h-12 w-12 opacity-50" />
              <div className="text-center">
                <p className="text-base font-medium">该分类下暂无网站</p>
                <p className="text-sm mt-1">请在后台添加网站到此分类</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SearchableLayout>
  )
}
