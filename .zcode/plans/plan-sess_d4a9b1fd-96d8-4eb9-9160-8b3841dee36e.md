# 删除「网站收录」功能方案

访客投稿功能整体移除;联系邮箱不做任何新代码——About 页 Markdown 和页脚友情链接(支持 `mailto:` 链接)今天就已覆盖该需求,管理员自行填写即可。

## 1. 数据模型
- `prisma/schema.prisma`:删除 `Site.submitterContact` / `Site.submitterIp` 与 `SystemSettings.enableSubmission` / `submissionMaxPerDay`。
- 新增手写迁移 `prisma/migrations/20260828010000_remove_submission/migration.sql`:`DROP COLUMN` 四列(历史索引 `site_submitter_ip_idx` 已被 `20260826_fix_column_name_drift` 迁移删除,无需再处理)。注意:已部署环境的待审投稿数据将随列删除,不可恢复。

## 2. 服务端(lib)
- `lib/actions.ts`:删除 `submitSite` 整段(约 2443–2510,含区块注释);`getSitesWithPagination` 的 `submitterIp` 参数与过滤;create/update site 中的 `submitterContact`/`submitterIp` 透传;`ALLOWED_SETTINGS_FIELDS` 与 `updateSystemSettings` 签名中的两个 submission 字段。
- `lib/prisma.ts`(内存兜底库):`SiteItem`/`SystemSettingsItem` 接口、初始值、mock `findMany` 的 `submitterIp` 过滤、mock `create` 的映射,全部同步删除。
- `lib/client-settings.ts`:`PublicSettings`/`defaultSettings` 删除两个 submission 字段(公开接口 `/api/settings` 是整表透传,自动不再下发)。

## 3. 前台组件
- 删除 `components/layout/site-submission-dialog.tsx` 整个文件。
- `components/layout/header.tsx`:删除 import、`enableSubmission` state(54)、赋值(71)、按钮挂载块(279–282);logo 加载逻辑保留。

## 4. 管理端
- 设置页 `app/admin/(dash)/users/page.tsx`:删除 `enableSubmission`/`submissionMaxPerDay` 的 state、初始化、水合及「启用网站收录 + 每日限制」JSX 块(约 452–481)。
- 站点管理页 `app/admin/(dash)/sites/page.tsx`:删除类型中两字段、「提交者筛选」Select(state `filterSubmitter`、查询参数、重置条件)及表格「提交来源」列。
- 仪表盘:`app/api/admin/stats/content/route.ts` 删除 `pendingSubmissions` 计数(保留 weekNewSites/missingIcons);`app/admin/(dash)/dashboard/page.tsx` 删除「待审核」卡片及数据引用。
- 登录页 `app/admin/login/page.tsx`:删除「#7 网站收录」装饰卡片。

## 5. i18n(6 个语言文件,用脚本统一删)
- 删除顶层 `submission` 命名空间(26 个 key)。
- 删除 `login.featureSubmission` / `featureTodayCount` / `featurePending`。
- 删除 `dashboard.statPending`。
- 删除 `admin.settings.submissionLabel` / `submissionHint` / `submissionLimitLabel` / `submissionLimitHint`。
- 删除站点管理页的 `filterSource` / `filterSourceAll` / `sourceUser` / `sourceAdminCreated` / `sourceAdmin`。

## 6. 文档
- `README.md` 与 `README.zh-CN.md`:移除 Site Submission 特性行及多工作区隔离表格中的 submissions 字样。

## 7. 验证
- `npx tsc --noEmit`、`npm run lint`、`npx prisma validate`(带占位 DATABASE_URL)。
- 全局 grep 确认 `submission|submitter` 零残留(除 git 历史与 .monkeycode 文档)。
- 注意:验证时避免再触发上次 `npx prisma` 意外升级依赖的问题(用 `npx prisma@5.22.0` 或检查 package.json 后还原)。
