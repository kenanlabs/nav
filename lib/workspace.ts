import { headers, cookies } from "next/headers"
import { prisma } from "./prisma"
import type { WorkspaceItem } from "./prisma"

// 后台工作区上下文 Cookie 名
export const ADMIN_WORKSPACE_COOKIE = "admin_workspace_id"

// middleware 注入的请求头
export const WORKSPACE_HOST_HEADER = "x-workspace-host"
export const WORKSPACE_PREVIEW_HEADER = "x-workspace-preview"

// 内存兜底工作区：迁移未执行 / 数据库异常时保证站点可用
export const FALLBACK_WORKSPACE: WorkspaceItem = {
  id: "ws-default",
  slug: "default",
  name: "默认工作区",
  description: null,
  siteName: null,
  siteDescription: null,
  siteLogo: null,
  favicon: null,
  aboutContent: null,
  isDefault: true,
  isPublished: true,
  order: 0,
  domains: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

// 工作区 slug 格式：小写字母数字与中划线，首尾为字母数字
const WORKSPACE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

export function isValidWorkspaceSlug(slug: unknown): slug is string {
  return (
    typeof slug === "string" &&
    slug.length >= 1 &&
    slug.length <= 50 &&
    WORKSPACE_SLUG_PATTERN.test(slug)
  )
}

/**
 * 规范化主机名：去协议、去路径、去端口、去用户信息、转小写。
 * 返回 null 表示输入非法。
 */
export function normalizeHost(input: unknown): string | null {
  if (typeof input !== "string") return null
  let host = input.trim().toLowerCase()
  if (!host) return null
  if (!host.includes(":")) {
    // 无冒号：直接进入后续清洗
  } else if (/^[a-z][a-z0-9+.-]*:\/\//.test(host)) {
    // 带 // 的 URL 形式：剥掉协议前缀
    host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
  } else {
    // 无 // 的冒号形式：仅当最后一个冒号后是纯数字（host:port）才接受，
    // 其余（javascript:alert(1)、mailto:user@x 等 scheme）一律拒绝
    const portPart = host.substring(host.lastIndexOf(":") + 1)
    if (!/^\d+$/.test(portPart)) return null
    host = host.substring(0, host.lastIndexOf(":"))
  }
  if (!host) return null
  // 去路径与查询
  host = host.split("/")[0].split("?")[0].split("#")[0]
  // 去用户信息（user@host）
  if (host.includes("@")) {
    host = host.split("@").pop() || ""
  }
  // 去端口（取最后一个冒号后的部分丢弃；简化处理，IPv6 场景极少见）
  if (host.includes(":")) {
    host = host.substring(0, host.lastIndexOf(":"))
  }
  if (!host) return null
  // 合法性：仅允许字母数字、点、中划线
  if (!/^[a-z0-9.-]+$/.test(host)) return null
  if (host.length > 253) return null
  return host
}

/**
 * 解析当前请求的工作区（前台 / 公开 API 通用）。
 * 优先级：开发模式预览 slug > 域名绑定 > 默认工作区 > 内存兜底。
 * 未发布工作区与未命中域名同样回退默认工作区。
 * 注意：不使用 React cache()——生产模式下 Server Action 调用间存在
 * 缓存泄漏（跨请求复用同一次解析结果），这里每次直接查库；
 * Domain/Workspace 均为唯一索引查询，成本可忽略。
 */
export async function getCurrentWorkspace(): Promise<WorkspaceItem> {
  try {
    const h = await headers()

    // 开发/预览模式的 ?__workspace=slug（middleware 已按环境校验后注入）
    const previewSlug = h.get(WORKSPACE_PREVIEW_HEADER)
    if (previewSlug && isValidWorkspaceSlug(previewSlug)) {
      const ws = await prisma.workspace.findUnique({
        where: { slug: previewSlug },
      })
      if (ws && ws.isPublished) return ws
    }

    // 域名精确匹配
    // x-workspace-host 由 middleware 注入；sitemap/robots 等未经过
    // middleware 的元数据路由直接读原始请求头兜底
    const host = normalizeHost(
      h.get(WORKSPACE_HOST_HEADER) ||
        h.get("x-forwarded-host")?.split(",")[0]?.trim() ||
        h.get("host") ||
        ""
    )
    if (host) {
      const domain = await prisma.domain.findUnique({
        where: { host },
      })
      if (domain) {
        const ws = await prisma.workspace.findUnique({
          where: { id: domain.workspaceId },
        })
        if (ws && ws.isPublished) return ws
      }
    }

    // 默认工作区
    const def = await prisma.workspace.findFirst({
      where: { isDefault: true },
    })
    if (def) return def

    return FALLBACK_WORKSPACE
  } catch (error) {
    // 构建期静态渲染尝试（headers() 不可用）时必须把该错误抛还给 Next，
    // 由框架将路由标记为动态渲染；吞掉会导致页面被静态化并固化默认工作区
    if (
      error &&
      typeof error === "object" &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error
    }
    console.warn("Workspace resolution failed, falling back to default:", error)
    return FALLBACK_WORKSPACE
  }
}

/**
 * 解析管理后台当前选中的工作区（读取 admin_workspace_id Cookie）。
 * 后台允许操作未发布工作区；Cookie 失效时回退默认工作区。
 * 与 getCurrentWorkspace 相同理由：直接查库，不使用 React cache()。
 */
export async function getAdminWorkspace(): Promise<WorkspaceItem> {
  try {
    const store = await cookies()
    const selectedId = store.get(ADMIN_WORKSPACE_COOKIE)?.value
    if (selectedId) {
      const ws = await prisma.workspace.findUnique({
        where: { id: selectedId },
      })
      if (ws) return ws
    }

    const def = await prisma.workspace.findFirst({
      where: { isDefault: true },
    })
    if (def) return def

    return FALLBACK_WORKSPACE
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error
    }
    console.warn("Admin workspace resolution failed:", error)
    return FALLBACK_WORKSPACE
  }
}
