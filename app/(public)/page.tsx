import { SearchableLayout } from "@/components/layout/searchable-layout"
import { SiteCard } from "@/components/layout/site-card"
import { getAllCategories, getCategories, getSystemSettings, getSites } from "@/lib/actions"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Folder, Globe } from "lucide-react"

// ISR 配置：每 10 秒自动重新生成页面
// 这样在 seed 后 10 秒内会自动看到新数据
// 当后台更新数据时，revalidatePath("/") 会触发立即重新生成
export const revalidate = 10

export default async function HomePage() {
  const { data: categories } = await getCategories()
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <SearchableLayout
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
    >
      <div className="space-y-10">
        {/* 分类内容 */}
        {categories && categories.length > 0 ? (
          <>
            {categories.map((category, index) => (
              <section 
                key={category.id} 
                id={`category-${category.slug}`}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {category.name}
                  </h2>
                  {category.sites && category.sites.length > 0 && (
                    <Badge variant="secondary" className="font-normal">
                      {category.sites.length} 个网站
                    </Badge>
                  )}
                </div>

                {category.sites && category.sites.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {category.sites.map((site, siteIndex) => (
                      <div
                        key={site.id}
                        className="animate-fade-up"
                        style={{ animationDelay: `${(index * 4 + siteIndex) * 30}ms` }}
                      >
                        <SiteCard site={site} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Globe className="h-8 w-8 opacity-50" />
                      <p className="text-sm">暂无网站</p>
                    </div>
                  </div>
                )}

                {index < categories.length - 1 && (
                  <Separator className="mt-10 bg-border/50" />
                )}
              </section>
            ))}
          </>
        ) : (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Folder className="h-12 w-12 opacity-50" />
              <div className="text-center">
                <p className="text-base font-medium">暂无分类数据</p>
                <p className="text-sm mt-1">请先在后台创建分类和网站</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </SearchableLayout>
  )
}
