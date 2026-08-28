import { MetadataRoute } from "next"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { getCurrentWorkspace } from "@/lib/workspace"
import { getAboutPage } from "@/lib/actions"

// sitemap 按当前请求域名对应的工作区输出：baseUrl 取实际 Host，
// 分类页仅输出当前工作区下已发布的分类
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getRequestBaseUrl()

  // 静态页面（始终包含）
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  try {
    const workspace = await getCurrentWorkspace()
    // 仅获取当前工作区下已发布的分类
    const categories = await prisma.category.findMany({
      where: {
        workspaceId: workspace.id,
        sites: {
          some: {
            isPublished: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    // 动态分类页面
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))

    // About 页面：仅在启用且有内容时纳入 sitemap（按当前工作区覆盖判断）
    const about = await getAboutPage()
    const aboutPages: MetadataRoute.Sitemap =
      about.enabled && about.content
        ? [
            {
              url: `${baseUrl}/about`,
              lastModified: new Date(),
              changeFrequency: "monthly",
              priority: 0.5,
            },
          ]
        : []

    return [...staticPages, ...aboutPages, ...categoryPages]
  } catch (error) {
    // 数据库不可用时，只返回静态页面
    console.warn("Database unavailable during sitemap generation, returning static pages only")
    return staticPages
  }
}

// 从请求头推导站点根地址（反代场景读 x-forwarded-proto/host）
async function getRequestBaseUrl(): Promise<string> {
  const fallback = process.env.NEXTAUTH_URL || "http://localhost:3000"
  try {
    const h = await headers()
    const host =
      h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      h.get("x-workspace-host") ||
      h.get("host")
    if (!host) return fallback
    const proto =
      h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
    return `${proto}://${host}`
  } catch {
    return fallback
  }
}
