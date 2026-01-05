import { ScrollHeader } from "@/components/layout/scroll-header"
import { Footer } from "@/components/layout/footer"
import { SiteCard } from "@/components/layout/site-card"
import { ClientHomePage } from "@/components/layout/client-home-page"
import { getAllCategories, getCategories, getSystemSettings, getSites } from "@/lib/actions"

// ISR 配置：每 1 小时自动重新生成页面
// 当后台更新数据时，revalidatePath("/") 会触发立即重新生成
export const revalidate = 3600

export default async function HomePage() {
  const { data: categories } = await getCategories()
  const { data: allCategories } = await getAllCategories()
  const { data: settings } = await getSystemSettings()
  const { data: allSites } = await getSites()

  // 将所有网站扁平化，用于客户端搜索
  const flatSites = allSites?.filter(site => site.isPublished) || []

  return (
    <ClientHomePage
      categories={categories || []}
      allCategories={allCategories || []}
      flatSites={flatSites}
      siteName={settings?.siteName}
    />
  )
}
