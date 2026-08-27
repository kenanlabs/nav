"use server"

import { prisma, useRealDatabase } from "./prisma"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { isLocale, type Locale } from "./i18n"
import { getAdminSession } from "./api-auth"

// ==================== 安全辅助 ====================

// 管理操作统一鉴权闸门：会话有效返回 null，否则返回统一错误结果。
// Server Actions 可被客户端直接构造调用，每个写操作/敏感读操作
// 必须自行校验，不能依赖页面层拦截。
// 双层校验：签名验证（防伪造）+ 查库确认用户仍存在且为 ADMIN
// （防数据库重建/删除用户后旧 token 在有效期内继续生效）。
async function requireAdmin(): Promise<{ success: false; error: string } | null> {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Unauthorized" }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }
  return null
}

// 站点 URL 协议白名单：仅允许 http/https，
// 防止导入/提交 javascript: 等协议 URL 造成存储型 XSS
function isSafeSiteUrl(url: unknown): boolean {
  if (typeof url !== "string" || url.trim().length === 0) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

// ==================== Categories ====================

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        sites: {
          where: { isPublished: true },
          orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
        },
      },
    })
    return { success: true, data: categories }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        sites: {
          where: { isPublished: true },
          orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
        },
      },
    })
    if (!category) {
      return { success: false, error: "Category not found" }
    }
    return { success: true, data: category }
  } catch (error) {
    console.error("Error fetching category:", error)
    return { success: false, error: "Failed to fetch category" }
  }
}

export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    })
    return { success: true, data: categories }
  } catch (error) {
    console.error("Error fetching all categories:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function getCategoriesWithPagination(params: {
  page?: number
  pageSize?: number
  search?: string
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: Prisma.CategoryWhereInput = {}

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { sites: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ])

    return {
      success: true,
      data: categories,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching categories with pagination:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function getCategoryById(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const category = await prisma.category.findUnique({
      where: { id },
    })
    if (!category) {
      return { success: false, error: "Category not found" }
    }
    return { success: true, data: category }
  } catch (error) {
    console.error("Error fetching category:", error)
    return { success: false, error: "Failed to fetch category" }
  }
}

export async function createCategory(data: {
  name: string
  slug: string
  icon?: string | null
  order?: number
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        order: data.order ?? 0,
      },
    })
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { success: true, data: category }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, data: {
  name?: string
  slug?: string
  icon?: string | null
  order?: number
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    })
    revalidatePath("/admin/categories")
    revalidatePath("/")
    revalidatePath(`/category/${category.slug}`)
    return { success: true, data: category }
  } catch (error) {
    console.error("Error updating category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

export async function updateCategoriesOrder(items: { id: string; order: number }[]) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    for (const item of items) {
      await prisma.category.update({
        where: { id: item.id },
        data: { order: item.order },
      })
    }
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error updating categories order:", error)
    return { success: false, error: "Failed to update categories order" }
  }
}

export async function deleteCategory(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    await prisma.category.delete({
      where: { id },
    })
    revalidatePath("/admin/categories")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: "Failed to delete category" }
  }
}

// ==================== Sites ====================

export async function getSites() {
  try {
    // 仅返回已发布站点：此 Action 可被客户端直接调用，
    // 避免未收录审核中的站点元数据外泄
    const sites = await prisma.site.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: 'desc' }, { order: 'asc' }],
      include: {
        category: true,
      },
    })
    return { success: true, data: sites }
  } catch (error) {
    console.error("Error fetching sites:", error)
    return { success: false, error: "Failed to fetch sites" }
  }
}

export async function getSitesWithPagination(params: {
  page?: number
  pageSize?: number
  categoryId?: string
  search?: string
  isPublished?: boolean
  submitterIp?: string
  sortBy?: "default" | "health" | "createdAt"
  sortDir?: "asc" | "desc"
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: Prisma.SiteWhereInput = {}

    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { url: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    if (params.isPublished !== undefined) {
      where.isPublished = params.isPublished
    }

    if (params.submitterIp === "true") {
      where.submitterIp = { not: null }
    } else if (params.submitterIp === "false") {
      where.submitterIp = null
    }

    // 排序规则：默认置顶优先 + 手动 order；
    // health 利用字符串序 down < suspicious < unknown < up，asc 即「测活异常优先」；
    // createdAt 用于快速定位新收录条目；非默认排序为纯排序，不再叠加置顶优先
    const sortDir = params.sortDir === "asc" || params.sortDir === "desc" ? params.sortDir : undefined
    let orderBy: Prisma.SiteOrderByWithRelationInput[]
    switch (params.sortBy) {
      case "health":
        orderBy = [{ healthStatus: sortDir || "asc" }, { order: "asc" }]
        break
      case "createdAt":
        orderBy = [{ createdAt: sortDir || "desc" }, { name: "asc" }]
        break
      default:
        orderBy = [{ isPinned: 'desc' }, { order: 'asc' }]
    }

    const [sites, total] = await Promise.all([
      prisma.site.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: true,
          // 编辑回填用：仅元数据，不含 base64 data 字段
          screenshots: {
            orderBy: { order: 'asc' },
            select: { id: true, source: true, url: true, mimeType: true, order: true },
          },
        },
      }),
      prisma.site.count({ where }),
    ])

    return {
      success: true,
      data: sites,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching sites with pagination:", error)
    return { success: false, error: "Failed to fetch sites" }
  }
}

export async function getCategoriesForFilter() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return { success: false, error: "Failed to fetch categories" }
  }
}

export async function getSiteById(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })
    if (!site) {
      return { success: false, error: "Site not found" }
    }
    return { success: true, data: site }
  } catch (error) {
    console.error("Error fetching site:", error)
    return { success: false, error: "Failed to fetch site" }
  }
}

// ==================== Site Detail ====================

const MAX_SCREENSHOTS_PER_SITE = 10
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024
const ALLOWED_SCREENSHOT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']

export interface ScreenshotInput {
  source: 'URL' | 'UPLOAD'
  url?: string
  data?: string
  mimeType?: string
  order?: number
}

// 校验截图入参：数量、类型、大小、字段完整性
function validateScreenshots(screenshots: ScreenshotInput[]): string | null {
  if (screenshots.length > MAX_SCREENSHOTS_PER_SITE) {
    return `Screenshots exceed the limit of ${MAX_SCREENSHOTS_PER_SITE}`
  }
  for (const shot of screenshots) {
    if (shot.source === 'URL') {
      if (!shot.url || typeof shot.url !== 'string') {
        return 'URL screenshot requires a valid url'
      }
      try {
        const parsed = new URL(shot.url)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return 'Screenshot url must use http or https'
        }
      } catch {
        return 'Screenshot url is invalid'
      }
    } else if (shot.source === 'UPLOAD') {
      if (!shot.data || typeof shot.data !== 'string') {
        return 'Uploaded screenshot requires base64 data'
      }
      if (!shot.mimeType || !ALLOWED_SCREENSHOT_MIME_TYPES.includes(shot.mimeType)) {
        return 'Screenshot mime type is not allowed'
      }
      const approxBytes = Math.floor((shot.data.length * 3) / 4)
      if (approxBytes > MAX_SCREENSHOT_BYTES) {
        return 'Screenshot exceeds the 2MB size limit'
      }
    } else {
      return 'Invalid screenshot source'
    }
  }
  return null
}

// 规范化详情内容：空白文本视为无内容
function normalizeDetailContent(content?: string | null): string | null {
  if (content === undefined || content === null) return null
  const trimmed = content.trim()
  return trimmed.length > 0 ? trimmed : null
}

// 计算冗余标志：详情文本或截图任一存在即为 true
function computeHasDetail(detailContent: string | null, screenshotCount: number): boolean {
  return detailContent !== null || screenshotCount > 0
}

// 替换式重写站点截图记录（事务内调用）
function buildScreenshotCreateMany(siteId: string, screenshots: ScreenshotInput[]) {
  return screenshots.map((shot, index) => ({
    siteId,
    source: shot.source,
    url: shot.source === 'URL' ? shot.url! : null,
    data: shot.source === 'UPLOAD' ? shot.data! : null,
    mimeType: shot.source === 'UPLOAD' ? shot.mimeType! : null,
    order: index,
  }))
}

// 获取站点详情（弹窗渲染与管理编辑回填共用）
// 仅返回截图元数据与展示地址，不返回 base64 大字段
export async function getSiteDetail(siteId: string) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        iconUrl: true,
        isPublished: true,
        detailContent: true,
        hasDetail: true,
        category: {
          select: { name: true, slug: true },
        },
        screenshots: {
          orderBy: { order: 'asc' },
          select: { id: true, source: true, url: true, order: true },
        },
      },
    })
    if (!site) {
      return { success: false, error: "Site not found" }
    }
    // 未发布站点：仅管理员可见（管理预览），公开访问与前台弹窗口径一致返回不存在
    if (!site.isPublished && !(await getAdminSession())) {
      return { success: false, error: "Site not found" }
    }
    const data = {
      ...site,
      screenshots: site.screenshots.map(shot => ({
        id: shot.id,
        order: shot.order,
        displayUrl: shot.source === 'URL' ? shot.url! : `/api/screenshots/${shot.id}`,
      })),
    }
    return { success: true, data }
  } catch (error) {
    console.error("Error fetching site detail:", error)
    return { success: false, error: "Failed to fetch site detail" }
  }
}

// 截图上传能力检测：对 SystemSettings 执行一次同值写探测（不产生数据变化）
// 结果内存缓存 60 秒，避免频繁探测
let capabilityCache: { supported: boolean; checkedAt: number; reason?: string } | null = null

export async function checkScreenshotUploadCapability() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  // 内存模式下，截图直接写入进程内存储，无需外部依赖
  if (!useRealDatabase) {
    return {
      success: true,
      data: { supported: true, checkedAt: Date.now() },
    }
  }
  const now = Date.now()
  if (capabilityCache && now - capabilityCache.checkedAt < 60_000) {
    return { success: true, data: capabilityCache }
  }
  try {
    const probe = await prisma.$transaction(async (tx) => {
      // 确保设置记录存在
      const settings = await tx.systemSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
        },
      })
      // 同值写入：验证写权限且不改变任何数据
      await tx.systemSettings.update({
        where: { id: settings.id },
        data: { siteName: settings.siteName },
      })
      return true
    }, { timeout: 10_000 })
    capabilityCache = { supported: probe, checkedAt: now }
    return { success: true, data: capabilityCache }
  } catch (error) {
    console.warn("Screenshot upload capability check failed:", error)
    capabilityCache = {
      supported: false,
      checkedAt: now,
      reason: "Database is not writable",
    }
    return { success: true, data: capabilityCache }
  }
}

export async function createSite(data: {
  name: string
  url: string
  description: string
  iconUrl?: string
  submitterContact?: string
  submitterIp?: string
  categoryId: string
  isPublished?: boolean
  isPinned?: boolean
  order?: number
  detailContent?: string | null
  screenshots?: ScreenshotInput[]
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    // URL 协议白名单校验，防止 javascript: 等协议入库
    if (!isSafeSiteUrl(data.url)) {
      return { success: false, error: "站点 URL 必须使用 http 或 https 协议" }
    }
    const detailContent = normalizeDetailContent(data.detailContent)
    const screenshots = data.screenshots ?? []
    const validationError = validateScreenshots(screenshots)
    if (validationError) {
      return { success: false, error: validationError }
    }
    const hasDetail = computeHasDetail(detailContent, screenshots.length)

    const site = await prisma.$transaction(async (tx) => {
      const created = await tx.site.create({
        data: {
          name: data.name,
          url: data.url,
          description: data.description,
          iconUrl: data.iconUrl,
          submitterContact: data.submitterContact,
          submitterIp: data.submitterIp,
          categoryId: data.categoryId,
          isPublished: data.isPublished ?? false,
          isPinned: data.isPinned ?? false,
          order: data.order ?? 0,
          detailContent,
          hasDetail,
        },
        include: {
          category: true,
        },
      })
      if (screenshots.length > 0) {
        await tx.screenshot.createMany({
          data: buildScreenshotCreateMany(created.id, screenshots),
        })
      }
      return created
    })

    revalidatePath("/admin/sites")
    revalidatePath("/")
    revalidatePath(`/category/${site.category?.slug || ''}`)
    return { success: true, data: site }
  } catch (error) {
    console.error("Error creating site:", error)
    return { success: false, error: "Failed to create site" }
  }
}

export async function updateSite(id: string, data: {
  name?: string
  url?: string
  description?: string
  iconUrl?: string
  submitterContact?: string
  submitterIp?: string
  categoryId?: string
  isPublished?: boolean
  isPinned?: boolean
  order?: number
  detailContent?: string | null
  screenshots?: ScreenshotInput[]
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    if (data.url !== undefined && !isSafeSiteUrl(data.url)) {
      return { success: false, error: "站点 URL 必须使用 http 或 https 协议" }
    }
    let detailContent: string | null | undefined = undefined
    if (data.detailContent !== undefined) {
      detailContent = normalizeDetailContent(data.detailContent)
    }
    const screenshotsProvided = data.screenshots !== undefined
    const screenshots = data.screenshots ?? []
    const validationError = validateScreenshots(screenshots)
    if (validationError) {
      return { success: false, error: validationError }
    }

    const site = await prisma.$transaction(async (tx) => {
      const updateData: Prisma.SiteUpdateInput = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.url !== undefined) updateData.url = data.url
      if (data.description !== undefined) updateData.description = data.description
      if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl
      if (data.submitterContact !== undefined) updateData.submitterContact = data.submitterContact
      if (data.submitterIp !== undefined) updateData.submitterIp = data.submitterIp
      if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } }
      if (data.isPublished !== undefined) updateData.isPublished = data.isPublished
      if (data.isPinned !== undefined) updateData.isPinned = data.isPinned
      if (data.order !== undefined) updateData.order = data.order

      // 详情相关：合并现值与新值后统一计算 hasDetail
      // - 仅传 detailContent → 截图数取现值
      // - 仅传 screenshots  → 详情文本取现值
      // - 都传或都不传之外的情况按需补查
      if (detailContent !== undefined || screenshotsProvided) {
        const [currentContent, currentShotCount] = await Promise.all([
          detailContent === undefined
            ? tx.site.findUnique({ where: { id }, select: { detailContent: true } })
            : null,
          !screenshotsProvided
            ? tx.screenshot.count({ where: { siteId: id } })
            : null,
        ])
        const effectiveContent = detailContent !== undefined
          ? detailContent
          : normalizeDetailContent(currentContent?.detailContent)
        const effectiveShotCount = screenshotsProvided ? screenshots.length : (currentShotCount ?? 0)
        if (detailContent !== undefined) updateData.detailContent = detailContent
        updateData.hasDetail = computeHasDetail(effectiveContent, effectiveShotCount)
      }

      const updated = await tx.site.update({
        where: { id },
        data: updateData,
        include: { category: true },
      })

      if (screenshotsProvided) {
        await tx.screenshot.deleteMany({ where: { siteId: id } })
        if (screenshots.length > 0) {
          await tx.screenshot.createMany({
            data: buildScreenshotCreateMany(id, screenshots),
          })
        }
      }

      return updated
    })

    revalidatePath("/admin/sites")
    revalidatePath("/")
    revalidatePath(`/category/${site.category?.slug || ''}`)
    return { success: true, data: site }
  } catch (error) {
    console.error("Error updating site:", error)
    return { success: false, error: "Failed to update site" }
  }
}

export async function toggleSitePin(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const existing = await prisma.site.findUnique({ where: { id } })
    if (!existing) return { success: false, error: "Site not found" }
    const updated = await prisma.site.update({
      where: { id },
      data: { isPinned: !existing.isPinned },
      include: { category: true },
    })
    revalidatePath("/admin/sites")
    revalidatePath("/")
    revalidatePath(`/category/${updated.category?.slug || ''}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error toggling site pin:", error)
    return { success: false, error: "Failed to toggle pin" }
  }
}

export async function deleteSite(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const site = await prisma.site.delete({
      where: { id },
      include: {
        category: true,
      },
    })
    revalidatePath("/admin/sites")
    revalidatePath("/")
    revalidatePath(`/category/${site.category?.slug || ''}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting site:", error)
    return { success: false, error: "Failed to delete site" }
  }
}

export async function toggleSitePublish(id: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const currentSite = await prisma.site.findUnique({
      where: { id },
      select: { isPublished: true },
    })

    if (!currentSite) {
      return { success: false, error: "Site not found" }
    }

    const site = await prisma.site.update({
      where: { id },
      data: { isPublished: !currentSite.isPublished },
      include: {
        category: true,
      },
    })
    revalidatePath("/admin/sites")
    revalidatePath("/")
    return { success: true, data: site }
  } catch (error) {
    console.error("Error toggling site publish status:", error)
    return { success: false, error: "Failed to toggle site publish status" }
  }
}

// ==================== 站点测活（健康检测） ====================

// 探测超时（毫秒）：兼顾死链判定准确性与单次 Action 执行时长（兼容 Serverless 超时）
const HEALTH_CHECK_TIMEOUT_MS = 10_000

// 三态取值：unknown 未检测 / up 在线 / suspicious 疑似受限（防护拦截）/ down 失效

// 多数站点拒绝默认 Node fetch UA，伪装成浏览器访问以降低误判
const HEALTH_CHECK_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

interface ProbeResult {
  status: number | null
  latencyMs: number
  server: string | null
}

// 探测被拦时常见的响应状态码：认证拦截/防护拦截/限流/JS 挑战页。
// 这些响应本身证明站点存活，不应判为失效。
const SUSPICIOUS_STATUS_CODES = [401, 403, 429, 503]

// 常见 CDN/WAF 的 Server 响应头特征（参考 OneNav 的判定）：
// 命中时即使状态码异常也判为“疑似受限”而非失效。
const PROTECTED_SERVER_SIGNATURES = [
  "cloudflare",
  "waf",
  "akamaighost",
  "jdcloudstarshield",
  "aliyunoss",
  "yunjiasu",
]

// 特殊哨兵值：响应头超过 undici 默认 16KB 上限（UND_ERR_HEADERS_OVERFLOW）。
// Google 等服务的 Set-Cookie 数量巨大导致 fetch 抛错，但收到响应头本身证明站点存活。
const HEADERS_OVERFLOW_STATUS = -1

// 三态取值：unknown 未检测 / up 在线 / suspicious 疑似受限（防护拦截）/ down 失效。
// down 仅限：网络层失败（DNS/超时/拒连）或未被防护特征解释的 4xx/5xx。
function classifyProbe(probe: ProbeResult): "up" | "suspicious" | "down" {
  if (probe.status === HEADERS_OVERFLOW_STATUS) return "suspicious"
  if (probe.status === null) return "down"
  if (probe.status < 400) return "up"
  const server = probe.server?.toLowerCase() ?? ""
  if (PROTECTED_SERVER_SIGNATURES.some((sig) => server.includes(sig))) {
    return "suspicious"
  }
  if (SUSPICIOUS_STATUS_CODES.includes(probe.status)) return "suspicious"
  return "down"
}

// 对单个 URL 发起探测：优先 HEAD，被拒（403/405/501，部分站点不接受 HEAD）时回退 GET。
// 仅允许 http/https 协议（复用 isSafeSiteUrl 白名单），网络错误/超时视为无响应。
async function probeUrl(url: string): Promise<ProbeResult> {
  if (!isSafeSiteUrl(url)) {
    return { status: null, latencyMs: 0, server: null }
  }

  const startedAt = Date.now()

  const doFetch = async (method: "HEAD" | "GET") => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": HEALTH_CHECK_USER_AGENT },
      })
      return {
        status: res.status,
        latencyMs: Date.now() - startedAt,
        server: res.headers.get("server"),
      }
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    const head = await doFetch("HEAD")
    // 403：部分站点拒绝 HEAD（真正的防护拦截会在 GET 时再次命中，多一次请求无副作用）；
    // 405/501：不支持 HEAD，回退 GET 再判定
    if (head.status === 403 || head.status === 405 || head.status === 501) {
      return await doFetch("GET")
    }
    return head
  } catch (error) {
    // undici 默认响应头上限 16KB，Google 等服务 Set-Cookie 数量巨大会触发
    // UND_ERR_HEADERS_OVERFLOW；能收到响应头说明站点活着，判疑似受限而非失效。
    // （部署层可通过 --max-http-header-size 根治，见 package.json/entrypoint.sh）
    const cause =
      error instanceof Error
        ? (error.cause as { code?: string; message?: string } | undefined)
        : undefined
    if (
      cause?.code === "UND_ERR_HEADERS_OVERFLOW" ||
      /headers overflow/i.test(cause?.message ?? "")
    ) {
      return {
        status: HEADERS_OVERFLOW_STATUS,
        latencyMs: Date.now() - startedAt,
        server: null,
      }
    }
    return { status: null, latencyMs: Date.now() - startedAt, server: null }
  }
}

// 单站测活：探测后把结果持久化到 Site 表。
// 单站粒度、请求短（≤ 超时时长），“全部测活”由前端并发编排逐个调用。
export async function checkSiteHealth(siteId: string) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, url: true },
    })
    if (!site) {
      return { success: false, error: "Site not found" }
    }

    const probe = await probeUrl(site.url)
    const updated = await prisma.site.update({
      where: { id: siteId },
      data: {
        healthStatus: classifyProbe(probe),
        // 哨兵值（响应头超限）不入库，避免展示 HTTP -1
        lastHttpStatus:
          probe.status !== null && probe.status > 0 ? probe.status : null,
        latencyMs: probe.latencyMs,
        lastCheckedAt: new Date(),
      },
    })
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error checking site health:", error)
    return { success: false, error: "Failed to check site health" }
  }
}

// 获取全部站点的 id/url，供前端“全部测活”编排使用（不分页）
export async function getSiteIdsForHealthCheck() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const sites = await prisma.site.findMany({
      select: { id: true, name: true, url: true },
      orderBy: [{ isPinned: "desc" }, { order: "asc" }],
    })
    return { success: true, data: sites }
  } catch (error) {
    console.error("Error fetching sites for health check:", error)
    return { success: false, error: "Failed to fetch sites" }
  }
}

// ==================== Users ====================

export async function getUsersWithPagination(params: {
  page?: number
  pageSize?: number
  search?: string
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: Prisma.UserWhereInput = {}

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ])

    return {
      success: true,
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  } catch (error) {
    console.error("Error fetching users with pagination:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}


// 修改资料（邮箱/姓名/头像）。密码修改不走此通道，
// 一律经由 changePassword 强制校验旧密码，且身份以会话为准，
// 不再信任客户端传入的 userId
export async function updateUser(
  id: string,
  data: {
    email?: string
    name?: string
    avatar?: string
  }
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    type UserUpdateData = {
      email?: string
      name?: string | null
      avatar?: string | null
    }

    const updateData: UserUpdateData = {
      email: data.email,
      name: data.name,
      avatar: data.avatar,
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    })
    revalidatePath("/admin/users")
    // 只回传安全字段，避免 password 哈希随响应外泄（内存模式下
    // update 不支持 select，故在应用层投影）
    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

// 修改密码：强制校验旧密码，目标用户以会话身份为准，
// 不接受客户端传入的用户 ID
export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await getAdminSession()
  if (!session) return { success: false, error: "Unauthorized" }
  try {
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return { success: false, error: "新密码至少需要6个字符" }
    }
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    })
    if (!user) {
      return { success: false, error: "用户不存在，请重新登录" }
    }
    const matched = await bcrypt.compare(
      typeof currentPassword === "string" ? currentPassword : "",
      user.password
    )
    if (!matched) {
      return { success: false, error: "当前密码不正确" }
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, 10) },
    })
    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error changing password:", error)
    return { success: false, error: "Failed to change password" }
  }
}


// ==================== Search ====================

export async function searchSites(query: string) {
  try {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [] }
    }

    const sites = await prisma.site.findMany({
      where: {
        AND: [
          { isPublished: true },
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { url: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      include: {
        category: true,
      },
      orderBy: { order: 'asc' },
    })

    return { success: true, data: sites }
  } catch (error) {
    console.error("Error searching sites:", error)
    return { success: false, error: "Failed to search sites" }
  }
}

// ==================== System Settings ====================

// 当前是否运行在内存模式（未配置 DATABASE_URL）。
// 内存模式下数据仅存在于单个实例内存中，Serverless 多实例（如 Vercel）
// 之间不共享且实例回收后重置，站点详情等功能无法持久生效
export async function isMemoryMode() {
  return { success: true, data: !useRealDatabase }
}

export async function getSystemSettings() {
  try {
    // 系统设置只有一条记录，使用第一条
    let settings = await prisma.systemSettings.findFirst()

    // 如果不存在，创建默认设置
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: "default",
          footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
        },
      })
      // 重新获取以确保使用数据库默认值（siteName 等）
      settings = await prisma.systemSettings.findFirst()
    }

    return { success: true, data: settings }
  } catch (error) {
    console.error("Error fetching system settings:", error)
    return { success: false, error: "Failed to fetch system settings" }
  }
}

// 允许写入的设置字段白名单：拒绝任意字段注入（如伪造 footerHtml 等）
const ALLOWED_SETTINGS_FIELDS = [
  "siteName",
  "siteDescription",
  "siteLogo",
  "favicon",
  "pageSize",
  "showFooter",
  "footerCopyright",
  "footerLinks",
  "showAdminLink",
  "showIcp",
  "icpNumber",
  "icpLink",
  "enableVisitTracking",
  "enableSubmission",
  "enableSiteDetail",
  "enablePoetry",
  "submissionMaxPerDay",
  "githubUrl",
  "defaultLanguage",
  "enableAbout",
  "aboutContent",
] as const

export async function updateSystemSettings(data: {
  siteName?: string
  siteDescription?: string
  siteLogo?: string
  favicon?: string
  pageSize?: number
  showFooter?: boolean
  footerCopyright?: string
  footerLinks?: Array<{ name: string; url: string }>
  showAdminLink?: boolean
  showIcp?: boolean
  icpNumber?: string | null
  icpLink?: string | null
  enableVisitTracking?: boolean
  enableSubmission?: boolean
  enableSiteDetail?: boolean
  enablePoetry?: boolean
  submissionMaxPerDay?: number
  githubUrl?: string
  defaultLanguage?: Locale
  enableAbout?: boolean
  aboutContent?: string | null
}) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    // 白名单过滤：只保留已知字段，丢弃任何额外注入的键
    const allowed = Object.fromEntries(
      Object.entries(data).filter(([key]) =>
        (ALLOWED_SETTINGS_FIELDS as readonly string[]).includes(key)
      )
    ) as Partial<typeof data>

    // 校验默认语言取值
    if (allowed.defaultLanguage && !isLocale(allowed.defaultLanguage)) {
      return { success: false, error: "Invalid defaultLanguage" }
    }

    // 获取第一条设置记录
    let settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      // 如果不存在，创建新的
      settings = await prisma.systemSettings.create({
        data: {
          ...allowed,
          footerCopyright: allowed.footerCopyright || `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
        },
      })
    } else {
      // 更新现有记录
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: allowed,
      })
    }

    revalidatePath("/admin/settings")
    revalidatePath("/")
    revalidatePath("/about")
    revalidatePath("/admin/dashboard")

    return { success: true, data: settings }
  } catch (error) {
    console.error("Error updating system settings:", error)
    return { success: false, error: "Failed to update system settings" }
  }
}

// ==================== Visit Tracking ====================

export async function recordVisit(siteId: string, request?: Request) {
  try {
    // 仅对存在且已发布的站点记录访问，防止伪造 siteId 污染统计
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, isPublished: true },
    })
    if (!site || !site.isPublished) {
      return { success: false, error: "Site not found" }
    }

    // 获取系统设置，检查是否启用访问统计
    const settingsResult = await getSystemSettings()
    if (!settingsResult.success || !settingsResult.data?.enableVisitTracking) {
      return { success: true }
    }

    let ipAddress = null
    let userAgent = null
    let referer = null

    if (request) {
      // x-forwarded-for 可能为逗号分隔的 IP 链，取首段作为客户端 IP
      ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                  request.headers.get('x-real-ip') ||
                  null
      userAgent = request.headers.get('user-agent') || null
      referer = request.headers.get('referer') || null
    }

    const visit = await prisma.visit.create({
      data: {
        siteId,
        ipAddress,
        userAgent,
        referer,
      },
    })

    return { success: true, data: visit }
  } catch (error) {
    console.error("Error recording visit:", error)
    return { success: false, error: "Failed to record visit" }
  }
}

export async function getVisitStats(days: number = 30, limit: number = 10) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const topSites = await prisma.visit.groupBy({
      by: ['siteId'],
      where: days > 0 ? {
        visitedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      } : undefined,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit === 0 ? undefined : limit,
    })

    const siteIds = topSites.map(s => s.siteId)
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
      },
      include: {
        category: true,
      },
    })

    const topSitesWithDetails = topSites.map(stat => {
      const site = sites.find(s => s.id === stat.siteId)
      return {
        ...site,
        visitCount: stat._count.id,
      }
    })

    const totalVisits = await prisma.visit.count({
      where: days > 0 ? {
        visitedAt: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      } : undefined,
    })

    return {
      success: true,
      data: {
        topSites: topSitesWithDetails,
        totalVisits,
      },
    }
  } catch (error) {
    console.error("Error fetching visit stats:", error)
    return { success: false, error: "Failed to fetch visit stats" }
  }
}

export async function getVisitFrequency(days: number = 30) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const visits = await prisma.visit.findMany({
      where: days > 0 ? {
        visitedAt: {
          gte: startDate,
        },
      } : undefined,
      select: {
        visitedAt: true,
      },
      orderBy: {
        visitedAt: 'asc',
      },
    })

    // 按日期分组统计
    const visitsByDate = visits.reduce((acc, visit) => {
      const date = new Date(visit.visitedAt)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      acc[dateKey] = (acc[dateKey] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 转换为数组格式
    const frequencyData = Object.entries(visitsByDate).map(([date, count]) => ({
      date,
      count,
    }))

    return {
      success: true,
      data: frequencyData,
    }
  } catch (error) {
    console.error("Error fetching visit frequency:", error)
    return { success: false, error: "Failed to fetch visit frequency" }
  }
}

// ==================== Data Import/Export ====================

// 完整数据导出（JSON格式，包含所有字段）
export async function exportData() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        sites: {
          orderBy: { order: 'asc' },
          include: {
            screenshots: {
              orderBy: { order: 'asc' },
              select: { source: true, url: true, data: true, mimeType: true, order: true },
            },
          },
        },
      },
    })

    // 导出完整数据（包含描述、排序、详情内容、截图等所有字段）
    const fullData = categories.map(category => ({
      name: category.name,
      slug: category.slug,
      order: category.order,
      sites: (category.sites || []).map(site => ({
        name: site.name,
        url: site.url,
        description: site.description,
        iconUrl: site.iconUrl,
        order: site.order,
        isPublished: site.isPublished,
        detailContent: site.detailContent,
        screenshots: (site.screenshots || []).map(shot => ({
          source: shot.source,
          url: shot.url,
          data: shot.data,
          mimeType: shot.mimeType,
          order: shot.order,
        })),
      })),
    }))

    return {
      success: true,
      data: fullData,
    }
  } catch (error) {
    console.error("Error exporting data:", error)
    return { success: false, error: "Failed to export data" }
  }
}

// Chrome书签导出（HTML格式，仅基本字段，兼容浏览器）
export async function exportBookmarks() {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        sites: {
          orderBy: { order: 'asc' },
          where: { isPublished: true },
        },
      },
    })

    // 转换为书签格式（仅基本字段）
    const bookmarkData = categories.map(category => ({
      name: category.name,
      sites: (category.sites || []).map(site => ({
        name: site.name,
        url: site.url,
        icon: site.iconUrl || undefined,
      })),
    }))

    return {
      success: true,
      data: bookmarkData,
    }
  } catch (error) {
    console.error("Error exporting bookmarks:", error)
    return { success: false, error: "Failed to export bookmarks" }
  }
}

// JSON数据导入（完整数据）
export async function importData(
  jsonData: any,
  mode: 'overwrite' | 'append'
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    // 验证数据格式
    if (!Array.isArray(jsonData)) {
      return { success: false, error: "Invalid data format" }
    }

    // 覆盖模式：删除所有现有数据
    if (mode === 'overwrite') {
      await prisma.visit.deleteMany({})
      await prisma.site.deleteMany({})
      await prisma.category.deleteMany({})
    }

    // 追加模式：获取当前最大排序值
    let currentMaxOrder = 0
    if (mode === 'append') {
      const maxOrderCategory = await prisma.category.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      currentMaxOrder = maxOrderCategory?.order || 0
    }

    // 导入分类和网站
    let skippedSites = 0
    for (const categoryData of jsonData) {
      // 生成分类 slug
      const transliteration = require('transliteration')
      const slug = categoryData.slug || transliteration.slugify(categoryData.name)

      // 检查分类是否已存在（追加模式）
      let category
      if (mode === 'append') {
        category = await prisma.category.findUnique({
          where: { slug },
        })
      }

      if (!category) {
        currentMaxOrder++
        category = await prisma.category.create({
          data: {
            name: categoryData.name,
            slug,
            order: categoryData.order !== undefined ? categoryData.order : currentMaxOrder,
          },
        })
      }

      // 导入网站（跳过非 http/https 的非法 URL，防止存储型 XSS）
      for (const siteData of categoryData.sites) {
        if (!isSafeSiteUrl(siteData.url)) {
          skippedSites++
          continue
        }
        const detailContent = normalizeDetailContent(siteData.detailContent)
        const screenshots = Array.isArray(siteData.screenshots)
          ? siteData.screenshots.filter((shot: ScreenshotInput) =>
              shot && (shot.source === 'UPLOAD' || (shot.source === 'URL' && isSafeSiteUrl(shot.url))))
          : []
        const hasDetail = computeHasDetail(detailContent, screenshots.length)

        const createdSite = await prisma.site.create({
          data: {
            name: siteData.name,
            url: siteData.url,
            description: siteData.description || '',
            iconUrl: siteData.iconUrl || null,
            categoryId: category.id,
            order: siteData.order || 0,
            isPublished: siteData.isPublished !== undefined ? siteData.isPublished : true,
            detailContent,
            hasDetail,
          },
        })
        if (screenshots.length > 0) {
          await prisma.screenshot.createMany({
            data: screenshots.map((shot: ScreenshotInput, index: number) => ({
              siteId: createdSite.id,
              source: shot.source,
              url: shot.source === 'URL' ? shot.url || null : null,
              data: shot.source === 'UPLOAD' ? shot.data || null : null,
              mimeType: shot.source === 'UPLOAD' ? shot.mimeType || null : null,
              order: shot.order !== undefined ? shot.order : index,
            })),
          })
        }
      }
    }

    // 重新验证缓存
    revalidatePath('/', 'layout')
    revalidatePath('/category/[slug]', 'page')

    const skippedNote = skippedSites > 0 ? `，已跳过 ${skippedSites} 条非法URL记录` : ''
    return {
      success: true,
      message: (mode === 'overwrite'
        ? `成功导入 ${jsonData.length} 个分类`
        : `成功追加 ${jsonData.length} 个分类`) + skippedNote,
      importedCount: jsonData.length,
    }
  } catch (error) {
    console.error("Error importing data:", error)
    return { success: false, error: "Failed to import data" }
  }
}

export async function importBookmarks(
  html: string,
  mode: 'overwrite' | 'append'
) {
  const unauthorized = await requireAdmin()
  if (unauthorized) return unauthorized
  try {
    const { parseChromeBookmarks } = await import('./bookmarks')
    const parsed = parseChromeBookmarks(html)

    // 覆盖模式：删除所有现有网站和分类
    if (mode === 'overwrite') {
      // 删除所有网站（级联删除会自动处理关联）
      await prisma.site.deleteMany({})
      // 删除所有分类
      await prisma.category.deleteMany({})
    }

    // 追加模式：保留现有数据，只添加新的
    let currentMaxOrder = 0
    if (mode === 'append') {
      const maxOrderCategory = await prisma.category.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      currentMaxOrder = maxOrderCategory?.order || 0
    }

    // 导入分类和网站
    let skippedSites = 0
    for (const categoryData of parsed.categories) {
      // 生成分类 slug（使用 transliteration 将中文转换为拼音）
      const transliteration = require('transliteration')
      const slug = transliteration.slugify(categoryData.name)

      // 检查分类是否已存在（追加模式）
      let category
      if (mode === 'append') {
        category = await prisma.category.findUnique({
          where: { slug },
        })
      }

      if (!category) {
        currentMaxOrder++
        category = await prisma.category.create({
          data: {
            name: categoryData.name,
            slug,
            order: currentMaxOrder,
          },
        })
      }

      // 导入网站
      let currentSiteOrder = 0
      if (mode === 'append') {
        const maxOrderSite = await prisma.site.findFirst({
          where: { categoryId: category.id },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
        currentSiteOrder = maxOrderSite?.order || 0
      }

      for (const siteData of categoryData.sites) {
        // 跳过非 http/https 的非法 URL，防止存储型 XSS
        if (!isSafeSiteUrl(siteData.url)) {
          skippedSites++
          continue
        }
        currentSiteOrder++
        await prisma.site.create({
          data: {
            name: siteData.name,
            url: siteData.url,
            description: siteData.url, // 使用URL作为描述
            iconUrl: siteData.icon || null,
            categoryId: category.id,
            order: currentSiteOrder,
            isPublished: true,
          },
        })
      }
    }

    // 重新验证缓存
    revalidatePath('/', 'layout')
    revalidatePath('/category/[slug]', 'page')

    const bookmarkSkippedNote = skippedSites > 0 ? `，已跳过 ${skippedSites} 条非法URL记录` : ''
    return {
      success: true,
      message: (mode === 'overwrite'
        ? `成功导入 ${parsed.categories.length} 个分类`
        : `成功追加 ${parsed.categories.length} 个分类`) + bookmarkSkippedNote,
      importedCount: parsed.categories.length,
    }
  } catch (error) {
    console.error("Error importing bookmarks:", error)
    return { success: false, error: "Failed to import bookmarks" }
  }
}

// ==================== Site Submission ====================

export async function submitSite(data: {
  name: string
  url: string
  description: string
  categoryId: string
  submitterContact?: string
  request?: Request
}) {
  try {
    // 获取系统设置，检查是否启用收录功能
    const settingsResult = await getSystemSettings()
    if (!settingsResult.success || !settingsResult.data?.enableSubmission) {
      return { success: false, error: "网站收录功能已关闭" }
    }

    // URL 协议白名单校验：仅允许 http/https，防止 javascript: 等存储型 XSS
    if (!isSafeSiteUrl(data.url)) {
      return { success: false, error: "网站URL不合法，仅支持 http/https 链接" }
    }

    // 获取 IP 地址：Server Action 场景下未传 request 时通过 headers() 读取
    const requestHeaders = data.request?.headers ?? await headers()
    const ipAddress = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     requestHeaders.get('x-real-ip') ||
                     'local'  // Fallback: 标记为本地提交

    // IP 频率限制检查（仅对真实 IP 限制）
    const maxPerDay = settingsResult.data.submissionMaxPerDay || 3
    if (ipAddress && ipAddress !== 'local') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentSubmissions = await prisma.site.count({
        where: {
          submitterIp: ipAddress,
          createdAt: { gte: oneDayAgo },
        },
      })

      if (recentSubmissions >= maxPerDay) {
        return {
          success: false,
          error: `提交太频繁啦！24小时内最多${maxPerDay}次，请明天再试🙅`
        }
      }
    }

    // 创建网站记录（默认未发布）
    const site = await prisma.site.create({
      data: {
        name: data.name,
        url: data.url,
        description: data.description,
        submitterContact: data.submitterContact || null,
        submitterIp: ipAddress,  // 记录提交者 IP
        categoryId: data.categoryId,
        isPublished: false, // 默认待审核
        order: 0,
      },
      include: {
        category: true,
      },
    })

    revalidatePath("/admin/sites")
    revalidatePath("/")
    revalidatePath(`/category/${site.category?.slug || ''}`)

    return {
      success: true,
      data: site,
      message: "提交成功！我们会尽快审核，感谢您的贡献"
    }
  } catch (error) {
    console.error("Error submitting site:", error)
    return { success: false, error: "提交失败，请稍后重试" }
  }
}
