import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// 是否启用真实数据库（配置了 DATABASE_URL 时使用 PostgreSQL，否则使用内置内存数据）
const useRealDatabase =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.trim() !== ''

export { useRealDatabase }

// In-memory types
export interface WorkspaceItem {
  id: string
  slug: string
  name: string
  description: string | null
  siteName: string | null
  siteDescription: string | null
  siteLogo: string | null
  favicon: string | null
  aboutContent: string | null
  isDefault: boolean
  isPublished: boolean
  order: number
  domains?: DomainItem[]
  createdAt: Date
  updatedAt: Date
}

export interface DomainItem {
  id: string
  host: string
  isPrimary: boolean
  workspaceId: string
  createdAt: Date
}

export interface CategoryItem {
  id: string
  name: string
  slug: string
  icon?: string | null
  order: number
  workspaceId: string
  createdAt: Date
  updatedAt: Date
  sites?: SiteItem[]
  _count?: {
    sites: number
  }
}

export interface SiteItem {
  id: string
  name: string
  url: string
  description: string
  iconUrl: string | null
  categoryId: string
  isPublished: boolean
  isPinned?: boolean
  order: number
  detailContent: string | null
  hasDetail: boolean
  healthStatus: string
  lastHttpStatus: number | null
  latencyMs: number | null
  lastCheckedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category?: CategoryItem | null
}

export interface UserItem {
  id: string
  email: string
  password: string
  name: string | null
  avatar: string | null
  role: 'ADMIN'
  createdAt: Date
  updatedAt: Date
}

export interface SystemSettingsItem {
  id: string
  siteName: string
  siteDescription: string
  siteLogo: string | null
  favicon: string | null
  pageSize: number
  showFooter: boolean
  footerCopyright: string
  footerLinks: Array<{ name: string; url: string }>
  showAdminLink: boolean
  showIcp: boolean
  icpNumber: string | null
  icpLink: string | null
  enableVisitTracking: boolean
  enableSiteDetail: boolean
  enablePoetry: boolean
  enableAboutPage: boolean
  aboutContent: string | null
  githubUrl: string | null
  defaultLanguage: string
  createdAt: Date
  updatedAt: Date
}

export interface ScreenshotItem {
  id: string
  siteId: string
  source: 'URL' | 'UPLOAD'
  url: string | null
  data: string | null
  mimeType: string | null
  order: number
  createdAt: Date
}

export interface VisitItem {
  id: string
  siteId: string
  ipAddress: string | null
  userAgent: string | null
  referer: string | null
  visitedAt: Date
}

function generateId(): string {
  return 'c' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

// 内存模式默认工作区：与真实库迁移（ws-default）保持一致
export const DEFAULT_WORKSPACE_ID = 'ws-default'

const initialWorkspaces: WorkspaceItem[] = [
  {
    id: DEFAULT_WORKSPACE_ID,
    slug: 'default',
    name: '默认工作区',
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
  },
]

const initialDomains: DomainItem[] = []

// Initial seed categories
const initialCategories: CategoryItem[] = [
  { id: 'cat-1', name: '常用工具', slug: 'tools', icon: null, order: 1, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-2', name: '开发工具', slug: 'dev', icon: null, order: 2, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-3', name: '设计资源', slug: 'design', icon: null, order: 3, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-4', name: '学习资源', slug: 'learning', icon: null, order: 4, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-5', name: 'AI 工具', slug: 'ai', icon: null, order: 5, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-6', name: '云服务', slug: 'cloud', icon: null, order: 6, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-7', name: '社区论坛', slug: 'community', icon: null, order: 7, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-8', name: '文档参考', slug: 'docs', icon: null, order: 8, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-9', name: '生产力', slug: 'productivity', icon: null, order: 9, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-10', name: '娱乐休闲', slug: 'entertainment', icon: null, order: 10, workspaceId: DEFAULT_WORKSPACE_ID, createdAt: new Date(), updatedAt: new Date() },
]

// Initial seed sites
const seedSitesData = [
  // 常用工具
  { name: 'Google', url: 'https://www.google.com', description: '全球最大的搜索引擎', categorySlug: 'tools', isPinned: true },
  { name: 'GitHub', url: 'https://github.com', description: '全球最大的代码托管与开源协作平台', categorySlug: 'tools', isPinned: true },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: '程序员技术问答与知识社区', categorySlug: 'tools', isPinned: false },
  { name: 'ChatGPT', url: 'https://chatgpt.com', description: 'OpenAI 出品的对话式人工智能助手', categorySlug: 'tools', isPinned: true },
  { name: 'Notion', url: 'https://www.notion.so', description: '全合一的笔记、知识库与项目管理平台', categorySlug: 'tools', isPinned: false },

  // 开发工具
  { name: 'VS Code', url: 'https://code.visualstudio.com', description: '微软开发的轻量级强大代码编辑器', categorySlug: 'dev', isPinned: true },
  { name: 'Vercel', url: 'https://vercel.com', description: 'Next.js 团队打造的前端自动化部署云平台', categorySlug: 'dev', isPinned: false },
  { name: 'React', url: 'https://react.dev', description: '用于构建 Web 和原生交互界面的前端库', categorySlug: 'dev', isPinned: false },
  { name: 'Next.js', url: 'https://nextjs.org', description: '现代化 React 全栈开发框架', categorySlug: 'dev', isPinned: false },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com', description: '实用优先的现代化原子 CSS 框架', categorySlug: 'dev', isPinned: false },

  // 设计资源
  { name: 'Dribbble', url: 'https://dribbble.com', description: '全球顶尖设计师创意灵感与作品展示社区', categorySlug: 'design', isPinned: false },
  { name: 'Behance', url: 'https://www.behance.net', description: 'Adobe 旗下创意作品与设计展示平台', categorySlug: 'design', isPinned: false },
  { name: 'Figma', url: 'https://www.figma.com', description: '基于云端的新一代 UI/UX 协作设计利器', categorySlug: 'design', isPinned: true },
  { name: 'shadcn/ui', url: 'https://ui.shadcn.com', description: '美观优雅的可定制 React 组件设计系统', categorySlug: 'design', isPinned: false },
  { name: 'Unsplash', url: 'https://unsplash.com', description: '免费可商用的高分辨率摄影图片素材库', categorySlug: 'design', isPinned: false },

  // 学习资源
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: '权威的 Web 开放标准与技术开发者文档', categorySlug: 'learning', isPinned: true },
  { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', description: '免费互动的全栈开发编程学习社区', categorySlug: 'learning', isPinned: false },
  { name: 'LeetCode', url: 'https://leetcode.cn', description: '技术面试必备的算法题库与刷题平台', categorySlug: 'learning', isPinned: false },
  { name: 'Coursera', url: 'https://www.coursera.org', description: '汇聚世界顶尖名校的在线公开课程平台', categorySlug: 'learning', isPinned: false },
  { name: 'YouTube', url: 'https://www.youtube.com', description: '全球最大的视频学习与分享平台', categorySlug: 'learning', isPinned: false },

  // AI 工具
  { name: 'Claude', url: 'https://claude.ai', description: 'Anthropic 开发的安全智能 AI 助手', categorySlug: 'ai', isPinned: true },
  { name: 'Gemini', url: 'https://gemini.google.com', description: 'Google DeepMind 新一代多模态 AI 模型', categorySlug: 'ai', isPinned: true },
  { name: 'Midjourney', url: 'https://www.midjourney.com', description: '高质量艺术风格 AI 图像生成工具', categorySlug: 'ai', isPinned: false },
  { name: 'Hugging Face', url: 'https://huggingface.co', description: '全球开源 AI 模型与数据集社区', categorySlug: 'ai', isPinned: false },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', description: '基于搜索与引用的对话式 AI 搜索引擎', categorySlug: 'ai', isPinned: false },

  // 云服务
  { name: 'AWS', url: 'https://aws.amazon.com', description: '亚马逊全球云计算基础设施服务平台', categorySlug: 'cloud', isPinned: false },
  { name: 'Cloudflare', url: 'https://www.cloudflare.com', description: '全球 CDN、DNS 和网络安全防护服务', categorySlug: 'cloud', isPinned: true },
  { name: 'Railway', url: 'https://railway.app', description: '快速部署后端、数据库与全栈应用的云平台', categorySlug: 'cloud', isPinned: false },
  { name: 'Netlify', url: 'https://www.netlify.com', description: '面向现代 Web 的构建、部署与托管服务', categorySlug: 'cloud', isPinned: false },

  // 社区论坛
  { name: 'GitHub Discussions', url: 'https://github.com', description: '开源项目团队与社区交流讨论平台', categorySlug: 'community', isPinned: false },
  { name: 'Reddit', url: 'https://www.reddit.com', description: '全球热门话题与兴趣圈子社区', categorySlug: 'community', isPinned: false },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', description: '硅谷前沿技术与初创企业资讯讨论', categorySlug: 'community', isPinned: false },
  { name: 'Product Hunt', url: 'https://www.producthunt.com', description: '每日最新科技与互联网产品发现平台', categorySlug: 'community', isPinned: false },
  { name: 'V2EX', url: 'https://www.v2ex.com', description: '程序员与创意工作者交流分享社区', categorySlug: 'community', isPinned: false },

  // 文档参考
  { name: 'Can I Use', url: 'https://caniuse.com', description: '前端 HTML5/CSS3 浏览器兼容性查询', categorySlug: 'docs', isPinned: false },
  { name: 'DevDocs', url: 'https://devdocs.io', description: '整合百种开发者 API 的快速离线文档库', categorySlug: 'docs', isPinned: false },
  { name: 'RegExp101', url: 'https://regex101.com', description: '交互式正则表达式测试与语法解析器', categorySlug: 'docs', isPinned: false },

  // 生产力
  { name: 'Trello', url: 'https://trello.com', description: '直观灵活的看板式团队任务协作工具', categorySlug: 'productivity', isPinned: false },
  { name: 'Slack', url: 'https://slack.com', description: '现代企业与远程团队即时沟通协作平台', categorySlug: 'productivity', isPinned: false },
  { name: 'Discord', url: 'https://discord.com', description: '社群交流、语音连麦与游戏开黑平台', categorySlug: 'productivity', isPinned: false },

  // 娱乐休闲
  { name: 'Bilibili', url: 'https://www.bilibili.com', description: '国内年轻人的潮流文化娱乐与视频弹幕网站', categorySlug: 'entertainment', isPinned: false },
  { name: 'Spotify', url: 'https://www.spotify.com', description: '全球领先的流行音乐与播客流媒体平台', categorySlug: 'entertainment', isPinned: false },
]

const initialSites: SiteItem[] = seedSitesData.map((s, idx) => {
  const cat = initialCategories.find(c => c.slug === s.categorySlug) || initialCategories[0]
  return {
    id: `site-${idx + 1}`,
    name: s.name,
    url: s.url,
    description: s.description,
    iconUrl: `https://www.google.com/s2/favicons?domain=${new URL(s.url).hostname}&sz=128`,
    categoryId: cat.id,
    isPublished: true,
    isPinned: Boolean(s.isPinned),
    order: idx + 1,
    detailContent: null,
    hasDetail: false,
    healthStatus: 'unknown',
    lastHttpStatus: null,
    latencyMs: null,
    lastCheckedAt: null,
    createdAt: new Date(Date.now() - (idx * 3600 * 1000)),
    updatedAt: new Date(Date.now() - (idx * 3600 * 1000)),
  }
})

// Default admin: admin@example.com / admin123
const defaultHashedPassword = bcrypt.hashSync('admin123', 10)

const initialUsers: UserItem[] = [
  {
    id: 'user-admin',
    email: 'admin@example.com',
    password: defaultHashedPassword,
    name: '管理员',
    avatar: null,
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const initialSystemSettings: SystemSettingsItem = {
  id: 'default',
  siteName: 'Conan Nav',
  siteDescription: '简洁现代化的网址导航系统',
  siteLogo: null,
  favicon: null,
  pageSize: 20,
  showFooter: true,
  footerCopyright: `© ${new Date().getFullYear()} Conan Nav. All rights reserved.`,
  footerLinks: [
    { name: 'GitHub', url: 'https://github.com/kenanlabs/nav' },
  ],
  showAdminLink: true,
  showIcp: false,
  icpNumber: null,
  icpLink: null,
  enableVisitTracking: true,
  enableSiteDetail: false,
  enablePoetry: true,
  enableAboutPage: false,
  aboutContent: null,
  githubUrl: 'https://github.com/kenanlabs/nav',
  defaultLanguage: 'zh',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Generate sample visits for dashboard stats
const initialVisits: VisitItem[] = []
for (let i = 0; i < 60; i++) {
  const randomSite = initialSites[i % initialSites.length]
  initialVisits.push({
    id: `visit-${i + 1}`,
    siteId: randomSite.id,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    referer: 'https://google.com',
    visitedAt: new Date(Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000)),
  })
}

// In-Memory Database Store (Global singleton across requests)
class InMemoryDatabase {
  workspaces: WorkspaceItem[] = [...initialWorkspaces]
  domains: DomainItem[] = [...initialDomains]
  categories: CategoryItem[] = [...initialCategories]
  sites: SiteItem[] = [...initialSites]
  users: UserItem[] = [...initialUsers]
  systemSettingsItem: SystemSettingsItem = { ...initialSystemSettings }
  visits: VisitItem[] = [...initialVisits]
  screenshots: ScreenshotItem[] = []

  // Workspace methods（内存模式下的工作区存储）
  workspace = {
    findMany: async (args?: any): Promise<WorkspaceItem[]> => {
      let result = [...this.workspaces]
      if (args?.where?.isDefault !== undefined) {
        result = result.filter(w => w.isDefault === args.where.isDefault)
      }
      if (args?.orderBy?.order) {
        const dir = args.orderBy.order
        result.sort((a, b) => (dir === 'desc' ? b.order - a.order : a.order - b.order))
      }
      return result.map(w => {
        const item: any = { ...w }
        if (args?.include?.domains) {
          item.domains = this.domains.filter(d => d.workspaceId === w.id)
        }
        return item
      })
    },

    findUnique: async (args: { where: { id?: string; slug?: string } }): Promise<WorkspaceItem | null> => {
      const ws = this.workspaces.find(w =>
        (args.where.id && w.id === args.where.id) ||
        (args.where.slug && w.slug === args.where.slug)
      )
      return ws ? { ...ws } : null
    },

    findFirst: async (args?: any): Promise<WorkspaceItem | null> => {
      const list = await this.workspace.findMany(args)
      return list[0] || null
    },

    create: async (args: { data: Partial<WorkspaceItem> }): Promise<WorkspaceItem> => {
      const ws: WorkspaceItem = {
        id: generateId(),
        slug: args.data.slug || '',
        name: args.data.name || '',
        description: args.data.description ?? null,
        siteName: args.data.siteName ?? null,
        siteDescription: args.data.siteDescription ?? null,
        siteLogo: args.data.siteLogo ?? null,
        favicon: args.data.favicon ?? null,
        aboutContent: args.data.aboutContent ?? null,
        isDefault: args.data.isDefault ?? false,
        isPublished: args.data.isPublished ?? false,
        order: args.data.order ?? this.workspaces.length + 1,
        domains: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.workspaces.push(ws)
      return { ...ws }
    },

    update: async (args: { where: { id?: string; slug?: string }; data: Partial<WorkspaceItem> }): Promise<WorkspaceItem> => {
      const idx = this.workspaces.findIndex(w =>
        (args.where.id && w.id === args.where.id) ||
        (args.where.slug && w.slug === args.where.slug)
      )
      if (idx === -1) throw new Error('Workspace not found')
      this.workspaces[idx] = {
        ...this.workspaces[idx],
        ...this.stripUndefined(args.data),
        updatedAt: new Date(),
      }
      return { ...this.workspaces[idx] }
    },

    delete: async (args: { where: { id: string } }): Promise<WorkspaceItem> => {
      const idx = this.workspaces.findIndex(w => w.id === args.where.id)
      if (idx === -1) throw new Error('Workspace not found')
      const deleted = this.workspaces.splice(idx, 1)[0]
      this.domains = this.domains.filter(d => d.workspaceId !== deleted.id)
      return deleted
    },

    count: async (args?: any): Promise<number> => {
      const list = await this.workspace.findMany(args)
      return list.length
    },
  }

  // Domain methods（内存模式下的域名绑定存储）
  domain = {
    findUnique: async (args: { where: { host?: string; id?: string } }): Promise<DomainItem | null> => {
      const d = this.domains.find(x =>
        (args.where.host && x.host === args.where.host) ||
        (args.where.id && x.id === args.where.id)
      )
      return d ? { ...d } : null
    },

    findMany: async (args?: { where?: { workspaceId?: string } }): Promise<DomainItem[]> => {
      let result = [...this.domains]
      if (args?.where?.workspaceId) {
        result = result.filter(d => d.workspaceId === args.where!.workspaceId)
      }
      return result.map(d => ({ ...d }))
    },

    create: async (args: { data: Partial<DomainItem> }): Promise<DomainItem> => {
      const d: DomainItem = {
        id: generateId(),
        host: args.data.host || '',
        isPrimary: args.data.isPrimary ?? false,
        workspaceId: args.data.workspaceId || '',
        createdAt: new Date(),
      }
      this.domains.push(d)
      return { ...d }
    },

    delete: async (args: { where: { id: string } }): Promise<DomainItem> => {
      const idx = this.domains.findIndex(d => d.id === args.where.id)
      if (idx === -1) throw new Error('Domain not found')
      return this.domains.splice(idx, 1)[0]
    },

    deleteMany: async (args?: { where?: { workspaceId?: string } }): Promise<{ count: number }> => {
      const before = this.domains.length
      if (args?.where?.workspaceId) {
        this.domains = this.domains.filter(d => d.workspaceId !== args.where!.workspaceId)
      } else {
        this.domains = []
      }
      return { count: before - this.domains.length }
    },

    count: async (args?: any): Promise<number> => {
      if (!args?.where) return this.domains.length
      return (await this.domain.findMany(args)).length
    },
  }

  // Category methods
  category = {
    findMany: async (args?: any): Promise<CategoryItem[]> => {
      let result = [...this.categories]

      if (args?.where) {
        if (args.where.id) {
          result = result.filter(c => c.id === args.where.id)
        }
        if (args.where.slug) {
          result = result.filter(c => c.slug === args.where.slug)
        }
        if (args.where.workspaceId) {
          result = result.filter(c => c.workspaceId === args.where.workspaceId)
        }
        if (args.where.sites?.some) {
          result = result.filter(cat => {
            const catSites = this.sites.filter(s => s.categoryId === cat.id)
            if (args.where.sites.some.isPublished !== undefined) {
              return catSites.some(s => s.isPublished === args.where.sites.some.isPublished)
            }
            return catSites.length > 0
          })
        }
        if (args.where.OR) {
          result = result.filter(cat =>
            args.where.OR.some((cond: any) => {
              if (cond.name?.contains) {
                return cat.name.toLowerCase().includes(cond.name.contains.toLowerCase())
              }
              if (cond.slug?.contains) {
                return cat.slug.toLowerCase().includes(cond.slug.contains.toLowerCase())
              }
              return true
            })
          )
        }
      }

      if (args?.orderBy) {
        const orderKey = Object.keys(args.orderBy)[0] as keyof CategoryItem
        const orderDir = args.orderBy[orderKey]
        result.sort((a: any, b: any) => {
          const valA = a[orderKey]
          const valB = b[orderKey]
          if (valA === undefined || valB === undefined) return 0
          if (valA < valB) return orderDir === 'desc' ? 1 : -1
          if (valA > valB) return orderDir === 'desc' ? -1 : 1
          return 0
        })
      }

      if (args?.skip) {
        result = result.slice(args.skip)
      }
      if (args?.take) {
        result = result.slice(0, args.take)
      }

      return result.map(cat => {
        const item: any = { ...cat, sites: [] }
        if (args?.include?.sites) {
          item.sites = this.assembleCategorySites(cat.id, args.include.sites)
        }
        if (args?.include?._count?.select?.sites) {
          item._count = { sites: this.sites.filter(s => s.categoryId === cat.id).length }
        }
        return item as CategoryItem
      })
    },

    findUnique: async (args: { where: { id?: string; slug?: string }; include?: any; select?: any }): Promise<CategoryItem | null> => {
      const cat = this.categories.find(c =>
        (args.where.id && c.id === args.where.id) ||
        (args.where.slug && c.slug === args.where.slug)
      )
      if (!cat) return null
      const item: any = { ...cat, sites: [] }
      if (args.include?.sites) {
        item.sites = this.assembleCategorySites(cat.id, args.include.sites)
      }
      if (args?.include?._count?.select?.sites) {
        item._count = { sites: this.sites.filter(s => s.categoryId === cat.id).length }
      }
      return item as CategoryItem
    },

    findFirst: async (args?: any): Promise<CategoryItem | null> => {
      const list = await this.category.findMany(args)
      return list[0] || null
    },

    create: async (args: { data: Partial<CategoryItem>; select?: any; include?: any }): Promise<CategoryItem> => {
      const newCat: CategoryItem = {
        id: generateId(),
        name: args.data.name || '',
        slug: args.data.slug || '',
        icon: args.data.icon || null,
        order: args.data.order ?? this.categories.length + 1,
        workspaceId: args.data.workspaceId || DEFAULT_WORKSPACE_ID,
        sites: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.categories.push(newCat)
      return newCat
    },

    update: async (args: { where: { id: string }; data: Partial<CategoryItem>; select?: any; include?: any }): Promise<CategoryItem> => {
      const idx = this.categories.findIndex(c => c.id === args.where.id)
      if (idx === -1) throw new Error('Category not found')
      this.categories[idx] = {
        ...this.categories[idx],
        ...this.stripUndefined(args.data),
        updatedAt: new Date(),
      }
      return this.categories[idx]
    },

    delete: async (args: { where: { id: string }; select?: any; include?: any }): Promise<CategoryItem> => {
      const idx = this.categories.findIndex(c => c.id === args.where.id)
      if (idx === -1) throw new Error('Category not found')
      const deleted = this.categories.splice(idx, 1)[0]
      // Cascade delete sites（及其关联截图/访问记录，与 schema onDelete: Cascade 一致）
      const orphanSiteIds = new Set(this.sites.filter(s => s.categoryId === deleted.id).map(s => s.id))
      this.sites = this.sites.filter(s => s.categoryId !== deleted.id)
      this.screenshots = this.screenshots.filter(s => !orphanSiteIds.has(s.siteId))
      this.visits = this.visits.filter(v => !orphanSiteIds.has(v.siteId))
      return deleted
    },

    deleteMany: async (args?: any) => {
      // 支持 workspaceId 过滤（多工作区覆盖导入时仅清当前工作区）
      let count = this.categories.length
      if (args?.where?.workspaceId) {
        const targetIds = new Set(
          this.categories
            .filter(c => c.workspaceId === args.where.workspaceId)
            .map(c => c.id)
        )
        count = targetIds.size
        this.categories = this.categories.filter(c => !targetIds.has(c.id))
        const orphanSiteIds = new Set(
          this.sites.filter(s => targetIds.has(s.categoryId)).map(s => s.id)
        )
        this.sites = this.sites.filter(s => !targetIds.has(s.categoryId))
        this.screenshots = this.screenshots.filter(s => !orphanSiteIds.has(s.siteId))
        this.visits = this.visits.filter(v => !orphanSiteIds.has(v.siteId))
        return { count }
      }
      this.categories = []
      this.sites = []
      this.screenshots = []
      this.visits = []
      return { count }
    },

    count: async (args?: any): Promise<number> => {
      const list = await this.category.findMany(args)
      return list.length
    },
  }

  // Site methods
  /**
   * 内存模式专用：按 Prisma select 子句投影标量字段。
   * value 为 true 表示保留该字段，未声明的字段被剔除（与真实 Prisma 行为一致）。
   */
  /**
   * 内存模式专用：按 Prisma 语义剔除 update data 中值为 undefined 的键。
   *
   * JS 展开语义下 { ...src, ...{ k: undefined } } 会用 undefined 覆盖原值，
   * 而真实 Prisma 对 undefined 字段直接跳过（不写入）。调用方（如 updateUser）
   * 常构造"键恒存在、值可能为 undefined"的 data，内存实现若不剔除会把
   * email/password 等字段污染成 undefined，进而导致登录查询抛错（500）、
   * 前台渲染崩溃等连锁故障。
   */
  private stripUndefined<T extends object>(data: T): Partial<T> {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) out[key] = value
    }
    return out as Partial<T>
  }

  private selectScalars<T extends object>(
    src: T,
    select: Record<string, unknown>
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(select)) {
      const v = select[key]
      if (v === true) out[key] = (src as Record<string, unknown>)[key]
    }
    return out
  }

  /** 内存模式专用：按 siteId 取关联 screenshots，支持嵌套 select + orderBy */
  private getScreenshotsForSite(
    siteId: string,
    opts?: { select?: Record<string, unknown>; orderBy?: { order?: 'asc' | 'desc' } }
  ): Record<string, unknown>[] {
    let shots = this.screenshots.filter(s => s.siteId === siteId)
    if (opts?.orderBy?.order) {
      const dir = opts.orderBy.order
      shots = shots
        .slice()
        .sort((a, b) => (dir === 'desc' ? b.order - a.order : a.order - b.order))
    } else {
      shots = shots.slice().sort((a, b) => a.order - b.order)
    }
    if (opts?.select) return shots.map(s => this.selectScalars(s, opts.select!))
    return shots.map(s => ({ ...s }))
  }

  /** 内存模式专用：组装 site 返回对象，兼容 select（嵌套）+ include（关系） */
  private projectSiteResult(
    site: SiteItem,
    args?: { select?: Record<string, unknown>; include?: Record<string, unknown> }
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    const sel = args?.select
    const inc = args?.include

    if (sel) {
      // select 模式：按 select 投影顶层标量字段；关系字段（值为对象）单独处理
      for (const [key, val] of Object.entries(sel)) {
        if (val === true) {
          out[key] = (site as any)[key]
        } else if (val && typeof val === 'object') {
          if (key === 'category') {
            const cat = this.categories.find(c => c.id === site.categoryId)
            const nested = cat ? (val as any).select ? this.selectScalars(cat, (val as any).select) : { ...cat } : null
            out.category = nested
          } else if (key === 'screenshots') {
            out.screenshots = this.getScreenshotsForSite(site.id, val as any)
          }
        }
      }
    } else {
      // 无 select：返回全字段 + apply include
      Object.assign(out, site)
    }

    if (inc?.category) {
      out.category = this.categories.find(c => c.id === site.categoryId) || null
    }
    if (inc?.screenshots) {
      out.screenshots = this.getScreenshotsForSite(site.id, inc.screenshots as any)
    }

    return out
  }

  /**
   * 内存模式专用：组装分类下的 sites 列表。
   * 支持 Prisma 嵌套 include 语义：where.isPublished 过滤、orderBy.order 排序、
   * include.screenshots 等嵌套关系（未显式 orderBy 时置顶优先、再按 order）。
   */
  private assembleCategorySites(categoryId: string, sitesInclude?: any): Record<string, unknown>[] {
    let sites = this.sites.filter(s => s.categoryId === categoryId)
    if (sitesInclude?.where?.isPublished !== undefined) {
      sites = sites.filter(s => s.isPublished === sitesInclude.where.isPublished)
    }
    if (sitesInclude?.orderBy?.order) {
      const dir = sitesInclude.orderBy.order
      sites = sites.slice().sort((a, b) => (dir === 'desc' ? b.order - a.order : a.order - b.order))
    } else {
      // Prioritize pinned sites, then by order
      sites = sites.slice().sort((a, b) => {
        const aPinned = a.isPinned ? 1 : 0
        const bPinned = b.isPinned ? 1 : 0
        if (aPinned !== bPinned) return bPinned - aPinned
        return a.order - b.order
      })
    }
    return sites.map(site =>
      this.projectSiteResult(site, { include: sitesInclude?.include })
    )
  }

  site = {
    findMany: async (args?: any): Promise<SiteItem[]> => {
      let result = [...this.sites]

      if (args?.where) {
        if (args.where.categoryId) {
          if (typeof args.where.categoryId === 'object' && 'in' in args.where.categoryId) {
            const ids: string[] = args.where.categoryId.in || []
            result = result.filter(s => ids.includes(s.categoryId))
          } else {
            result = result.filter(s => s.categoryId === args.where.categoryId)
          }
        }
        if (args.where.isPublished !== undefined) {
          result = result.filter(s => s.isPublished === args.where.isPublished)
        }
        if (args.where.isPinned !== undefined) {
          result = result.filter(s => s.isPinned === args.where.isPinned)
        }
        if (args.where.id?.in) {
          result = result.filter(s => args.where.id.in.includes(s.id))
        }
        if (args.where.createdAt?.gte) {
          result = result.filter(s => s.createdAt >= args.where.createdAt.gte)
        }
        if (args.where.OR) {
          result = result.filter(site =>
            args.where.OR.some((cond: any) => {
              if (cond.name?.contains) {
                return site.name.toLowerCase().includes(cond.name.contains.toLowerCase())
              }
              if (cond.description?.contains) {
                return site.description.toLowerCase().includes(cond.description.contains.toLowerCase())
              }
              if (cond.url?.contains) {
                return site.url.toLowerCase().includes(cond.url.contains.toLowerCase())
              }
              return false
            })
          )
        }
        if (args.where.AND) {
          for (const clause of args.where.AND) {
            if (clause.isPublished !== undefined) {
              result = result.filter(s => s.isPublished === clause.isPublished)
            }
            if (clause.categoryId && typeof clause.categoryId === 'object' && 'in' in clause.categoryId) {
              const ids: string[] = clause.categoryId.in || []
              result = result.filter(s => ids.includes(s.categoryId))
            }
            if (clause.OR) {
              result = result.filter(site =>
                clause.OR.some((cond: any) => {
                  if (cond.name?.contains) {
                    return site.name.toLowerCase().includes(cond.name.contains.toLowerCase())
                  }
                  if (cond.description?.contains) {
                    return site.description.toLowerCase().includes(cond.description.contains.toLowerCase())
                  }
                  if (cond.url?.contains) {
                    return site.url.toLowerCase().includes(cond.url.contains.toLowerCase())
                  }
                  return false
                })
              )
            }
          }
        }
      }

      if (args?.orderBy) {
        // 支持数组形式的多键排序，空值（null/undefined）统一沉底
        const orderSpecs = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy]
        result.sort((a: any, b: any) => {
          for (const spec of orderSpecs) {
            const orderKey = Object.keys(spec)[0] as keyof SiteItem
            const orderDir = spec[orderKey]
            const valA = a[orderKey]
            const valB = b[orderKey]
            const aNull = valA === null || valA === undefined
            const bNull = valB === null || valB === undefined
            if (aNull && bNull) continue
            if (aNull) return 1
            if (bNull) return -1
            if (valA < valB) return orderDir === 'desc' ? 1 : -1
            if (valA > valB) return orderDir === 'desc' ? -1 : 1
          }
          return 0
        })
      }

      if (args?.skip) {
        result = result.slice(args.skip)
      }
      if (args?.take) {
        result = result.slice(0, args.take)
      }

      return result.map(site => this.projectSiteResult(site, { select: args?.select, include: args?.include })) as unknown as SiteItem[]
    },

    findUnique: async (args: { where: { id?: string; url?: string }; include?: any; select?: any }): Promise<SiteItem | null> => {
      const site = this.sites.find(s =>
        (args.where.id && s.id === args.where.id) ||
        (args.where.url && s.url === args.where.url)
      )
      if (!site) return null
      return this.projectSiteResult(site, { select: args.select, include: args.include }) as unknown as SiteItem
    },

    findFirst: async (args?: any): Promise<SiteItem | null> => {
      const list = await this.site.findMany(args)
      return list[0] || null
    },

    create: async (args: { data: Partial<SiteItem>; include?: any; select?: any }): Promise<SiteItem> => {
      let icon = args.data.iconUrl
      if (!icon && args.data.url) {
        try {
          icon = `https://www.google.com/s2/favicons?domain=${new URL(args.data.url).hostname}&sz=128`
        } catch {
          icon = null
        }
      }

      const newSite: SiteItem = {
        id: generateId(),
        name: args.data.name || '',
        url: args.data.url || '',
        description: args.data.description || '',
        iconUrl: icon || null,
        categoryId: args.data.categoryId || (this.categories[0]?.id ?? 'cat-1'),
        isPublished: args.data.isPublished ?? true,
        isPinned: args.data.isPinned ?? false,
        order: args.data.order ?? this.sites.length + 1,
        detailContent: args.data.detailContent ?? null,
        hasDetail: args.data.hasDetail ?? false,
        healthStatus: args.data.healthStatus ?? 'unknown',
        lastHttpStatus: args.data.lastHttpStatus ?? null,
        latencyMs: args.data.latencyMs ?? null,
        lastCheckedAt: args.data.lastCheckedAt ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.sites.push(newSite)
      const item: any = { ...newSite }
      if (args.include?.category) {
        item.category = this.categories.find(c => c.id === newSite.categoryId) || null
      }
      return item as SiteItem
    },

    update: async (args: { where: { id: string }; data: Partial<SiteItem>; include?: any; select?: any }): Promise<SiteItem> => {
      const idx = this.sites.findIndex(s => s.id === args.where.id)
      if (idx === -1) throw new Error('Site not found')
      const data: any = { ...this.stripUndefined(args.data) }
      // Prisma 关系语法：category: { connect: { id } } → 转换为 categoryId，
      // 避免嵌套对象直接展开到记录上造成字段漂移
      if (data.category && typeof data.category === 'object') {
        if (data.category.connect?.id) {
          data.categoryId = data.category.connect.id
        }
        delete data.category
      }
      this.sites[idx] = {
        ...this.sites[idx],
        ...data,
        updatedAt: new Date(),
      }
      const item: any = { ...this.sites[idx] }
      if (args.include?.category) {
        item.category = this.categories.find(c => c.id === item.categoryId) || null
      }
      return item as SiteItem
    },

    delete: async (args: { where: { id: string }; include?: any; select?: any }): Promise<SiteItem> => {
      const idx = this.sites.findIndex(s => s.id === args.where.id)
      if (idx === -1) throw new Error('Site not found')
      const deleted = this.sites.splice(idx, 1)[0]
      // 与真实库一致：级联删除关联截图与访问记录（schema 中 onDelete: Cascade）
      this.screenshots = this.screenshots.filter(s => s.siteId !== deleted.id)
      this.visits = this.visits.filter(v => v.siteId !== deleted.id)
      const item: any = { ...deleted }
      if (args.include?.category) {
        item.category = this.categories.find(c => c.id === item.categoryId) || null
      }
      return item as SiteItem
    },

    deleteMany: async (args?: any) => {
      // 支持 categoryId（含 in 语法）过滤，配合真实库多工作区覆盖导入
      if (args?.where?.categoryId) {
        let targetCategoryIds: Set<string>
        if (typeof args.where.categoryId === 'object' && 'in' in args.where.categoryId) {
          targetCategoryIds = new Set(args.where.categoryId.in || [])
        } else {
          targetCategoryIds = new Set([args.where.categoryId])
        }
        const before = this.sites.length
        const orphanSiteIds = new Set(
          this.sites.filter(s => targetCategoryIds.has(s.categoryId)).map(s => s.id)
        )
        this.sites = this.sites.filter(s => !targetCategoryIds.has(s.categoryId))
        this.screenshots = this.screenshots.filter(s => !orphanSiteIds.has(s.siteId))
        this.visits = this.visits.filter(v => !orphanSiteIds.has(v.siteId))
        return { count: before - this.sites.length }
      }
      const count = this.sites.length
      this.sites = []
      this.visits = []
      this.screenshots = []
      return { count }
    },

    count: async (args?: any): Promise<number> => {
      const list = await this.site.findMany(args)
      return list.length
    },

    groupBy: async (args: {
      by: string[]
      where?: { isPublished?: boolean }
      _count?: { id?: boolean }
      orderBy?: { _count?: { id?: 'asc' | 'desc' } }
    }) => {
      let filtered = [...this.sites]
      if (args?.where?.isPublished !== undefined) {
        filtered = filtered.filter(s => s.isPublished === args.where!.isPublished)
      }

      const counts: Record<string, number> = {}
      for (const s of filtered) {
        counts[s.categoryId] = (counts[s.categoryId] || 0) + 1
      }

      let groups = Object.entries(counts).map(([categoryId, count]) => ({
        categoryId,
        _count: { id: count },
      }))

      if (args.orderBy?._count?.id) {
        const dir = args.orderBy._count.id
groups.sort((a, b) => dir === 'desc' ? b._count.id - a._count.id : a._count.id - b._count.id)
      }

      return groups
    },
  }

  // Screenshot methods (内存模式下的截图存储)
  screenshot = {
    createMany: async (args: { data: Array<Partial<ScreenshotItem>> }) => {
      const created: ScreenshotItem[] = []
      for (const shot of args.data) {
        const newShot: ScreenshotItem = {
          id: shot.id || generateId(),
          siteId: shot.siteId || '',
          source: shot.source || 'URL',
          url: shot.url ?? null,
          data: shot.data ?? null,
          mimeType: shot.mimeType ?? null,
          order: shot.order ?? created.length,
          createdAt: new Date(),
        }
        this.screenshots.push(newShot)
        created.push(newShot)
      }
      return { count: created.length }
    },

    deleteMany: async (args?: { where?: { siteId?: string } }) => {
      let count = 0
      if (!args?.where?.siteId) {
        count = this.screenshots.length
        this.screenshots = []
      } else {
        const before = this.screenshots.length
        this.screenshots = this.screenshots.filter(s => s.siteId !== args.where!.siteId)
        count = before - this.screenshots.length
      }
      return { count }
    },

    findMany: async (args?: { where?: { siteId?: string; id?: string }; orderBy?: { order?: 'asc' | 'desc' } }): Promise<ScreenshotItem[]> => {
      let result = [...this.screenshots]
      if (args?.where?.siteId) result = result.filter(s => s.siteId === args.where!.siteId)
      if (args?.where?.id) result = result.filter(s => s.id === args.where!.id)
      if (args?.orderBy?.order) {
        const dir = args.orderBy.order
        result.sort((a, b) => dir === 'desc' ? b.order - a.order : a.order - b.order)
      }
      return result
    },

    findUnique: async (args: { where: { id: string }; select?: any }) => {
      const shot = this.screenshots.find(s => s.id === args.where.id)
      if (!shot) return null
      if (args?.select) {
        const out: any = {}
        for (const k of Object.keys(args.select)) {
          if (args.select[k]) out[k] = (shot as any)[k]
        }
        return out
      }
      return { ...shot }
    },
  }

  // User methods
  user = {
    findMany: async (args?: any): Promise<UserItem[]> => {
      let result = [...this.users]
      if (args?.where?.OR) {
        result = result.filter(u =>
          args.where.OR.some((cond: any) => {
            if (cond.email?.contains) return u.email.toLowerCase().includes(cond.email.contains.toLowerCase())
            if (cond.name?.contains && u.name) return u.name.toLowerCase().includes(cond.name.contains.toLowerCase())
            return false
          })
        )
      }
      if (args?.skip) result = result.slice(args.skip)
      if (args?.take) result = result.slice(0, args.take)
      return result
    },

    findUnique: async (args: { where: { id?: string; email?: string }; select?: any; include?: any }): Promise<any> => {
      // null 安全：历史数据若被污染（email 为 undefined）跳过该记录而不是抛错
      const user = this.users.find(u =>
        (args.where.id && u.id === args.where.id) ||
        (args.where.email && typeof u.email === 'string' && u.email.toLowerCase() === args.where.email.toLowerCase())
      ) || null
      // 与真实 Prisma 行为一致：指定 select 时仅返回所选字段，
      // 避免将 password 哈希等敏感字段透出给调用方
      if (user && args?.select) {
        const out: any = {}
        for (const key of Object.keys(args.select)) {
          if (args.select[key]) out[key] = (user as any)[key]
        }
        return out
      }
      return user
    },

    findFirst: async (args?: any): Promise<any> => {
      const list = await this.user.findMany(args)
      return list[0] || null
    },

    create: async (args: { data: Partial<UserItem>; select?: any; include?: any }): Promise<any> => {
      const newUser: UserItem = {
        id: generateId(),
        email: args.data.email || '',
        password: args.data.password || defaultHashedPassword,
        name: args.data.name || null,
        avatar: args.data.avatar || null,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      this.users.push(newUser)
      return newUser
    },

    update: async (args: { where: { id: string }; data: Partial<UserItem>; select?: any; include?: any }): Promise<any> => {
      const idx = this.users.findIndex(u => u.id === args.where.id)
      if (idx === -1) throw new Error('User not found')
      this.users[idx] = {
        ...this.users[idx],
        ...this.stripUndefined(args.data),
        updatedAt: new Date(),
      }
      return this.users[idx]
    },

    delete: async (args: { where: { id: string } }): Promise<UserItem> => {
      const idx = this.users.findIndex(u => u.id === args.where.id)
      if (idx === -1) throw new Error('User not found')
      return this.users.splice(idx, 1)[0]
    },

    count: async (_args?: any): Promise<number> => {
      return this.users.length
    },
  }

  // System Settings methods
  systemSettings = {
    findFirst: async (): Promise<SystemSettingsItem> => {
      return { ...this.systemSettingsItem }
    },

    create: async (args: { data: Partial<SystemSettingsItem> }): Promise<SystemSettingsItem> => {
      this.systemSettingsItem = {
        ...this.systemSettingsItem,
        ...args.data,
        updatedAt: new Date(),
      }
      return { ...this.systemSettingsItem }
    },

    update: async (args: { where?: { id: string }; data: Partial<SystemSettingsItem> }): Promise<SystemSettingsItem> => {
      this.systemSettingsItem = {
        ...this.systemSettingsItem,
        ...this.stripUndefined(args.data),
        updatedAt: new Date(),
      }
      return { ...this.systemSettingsItem }
    },

    count: async () => 1,
  }

  // Visit tracking methods
  visit = {
    findMany: async (args?: any): Promise<VisitItem[]> => {
      let result = [...this.visits]
      if (args?.where?.visitedAt?.gte) {
        result = result.filter(v => v.visitedAt >= args.where.visitedAt.gte)
      }
      if (args?.orderBy?.visitedAt) {
        const dir = args.orderBy.visitedAt
        result.sort((a, b) => {
          if (a.visitedAt < b.visitedAt) return dir === 'desc' ? 1 : -1
          if (a.visitedAt > b.visitedAt) return dir === 'desc' ? -1 : 1
          return 0
        })
      }
      return result
    },

    create: async (args: { data: Partial<VisitItem> }): Promise<VisitItem> => {
      const newVisit: VisitItem = {
        id: generateId(),
        siteId: args.data.siteId || '',
        ipAddress: args.data.ipAddress || null,
        userAgent: args.data.userAgent || null,
        referer: args.data.referer || null,
        visitedAt: new Date(),
      }
      this.visits.push(newVisit)
      return newVisit
    },

    count: async (args?: any): Promise<number> => {
      if (args?.where?.visitedAt?.gte) {
        return this.visits.filter(v => v.visitedAt >= args.where.visitedAt.gte).length
      }
      return this.visits.length
    },

    groupBy: async (args: {
      by: string[]
      where?: { visitedAt?: { gte?: Date } }
      _count?: { id?: boolean }
      orderBy?: { _count?: { id?: 'asc' | 'desc' } }
      take?: number
    }) => {
      let filtered = [...this.visits]
      const gte = args?.where?.visitedAt?.gte
      if (gte) {
        filtered = filtered.filter(v => v.visitedAt >= gte)
      }

      const counts: Record<string, number> = {}
      for (const v of filtered) {
        counts[v.siteId] = (counts[v.siteId] || 0) + 1
      }

      let groups = Object.entries(counts).map(([siteId, count]) => ({
        siteId,
        _count: { id: count },
      }))

      if (args.orderBy?._count?.id) {
        const dir = args.orderBy._count.id
        groups.sort((a, b) => dir === 'desc' ? b._count.id - a._count.id : a._count.id - b._count.id)
      }

      if (args.take) {
        groups = groups.slice(0, args.take)
      }

      return groups
    },

    deleteMany: async (_args?: any) => {
      const count = this.visits.length
      this.visits = []
      return { count }
    },
  }

  $transaction = async (input: any) => {
    if (typeof input === 'function') {
      return await input(this)
    }
    if (Array.isArray(input)) {
      return await Promise.all(input)
    }
    return input
  }

  $queryRaw = async (..._args: any[]) => {
    return [{ '?column?': 1 }]
  }

  $disconnect = async () => {}
}

const globalForPrisma = globalThis as unknown as {
  inMemoryDb: InMemoryDatabase | undefined
  realClient: PrismaClient | undefined
}

function createPrisma(): PrismaClient {
  if (useRealDatabase) {
    const client = globalForPrisma.realClient ?? new PrismaClient()
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.realClient = client
    }
    return client
  }

  const db = globalForPrisma.inMemoryDb ?? new InMemoryDatabase()
  // 内存模式必须无条件复用全局单例：若只在非生产环境缓存，生产（如 Vercel）
  // 下每次请求都会 new 一个全新空库，保存的设置/站点数据在下一个请求即丢失
  globalForPrisma.inMemoryDb = db
  return db as unknown as PrismaClient
}

export const prisma: PrismaClient = createPrisma()
