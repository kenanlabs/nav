# 多工作区 About 页面实现方案

每个工作区拥有自己的 About 内容(`Workspace.aboutContent` 覆盖),为空时回退全局默认内容(`SystemSettings.aboutContent`),与现有 siteName/Logo 的覆盖模式完全一致。About 功能总开关 `enableAboutPage` 为全局设置(开启后所有工作区都有 About 页)。

## 1. 数据模型(prisma/schema.prisma + 手写迁移)

本地无数据库,按现有迁移风格(如 `20260827100000_add_enable_poetry`)手写 SQL 迁移:

- 新增 `prisma/migrations/20260828000000_add_about_page/migration.sql`:
  - `ALTER TABLE "Workspace" ADD COLUMN "about_content" TEXT;`
  - `ALTER TABLE "SystemSettings" ADD COLUMN "enable_about_page" BOOLEAN NOT NULL DEFAULT false;`
  - `ALTER TABLE "SystemSettings" ADD COLUMN "about_content" TEXT;`
- schema.prisma 对应三处字段(`Workspace.aboutContent` 注释「为空时回退 SystemSettings」),`npx prisma validate` + `prisma generate` 验证。

## 2. 服务端数据层(lib/actions.ts)

- 新增 `getAboutPage()`:仿照 `getDisplaySettings()`(actions.ts:1595),`getCurrentWorkspace()` + `getSystemSettings()` → 返回 `{ enabled, siteName, content: workspace.aboutContent || settings.aboutContent || "" }`,仅供 /about 页服务端调用(避免 Markdown 全文进公开设置接口)。
- `getWorkspaceDisplaySettings()`(actions.ts:112):display 增加 `aboutContent`(默认工作区 → 全局值;非默认 → `workspace.aboutContent ?? ""`,空串表示回退全局)。
- `updateWorkspaceDisplaySettings()`(actions.ts:155):签名增加 `aboutContent?: string`;默认工作区分支转发给 `updateSystemSettings`,非默认写 `workspace.aboutContent`(trim || null);两处都补 `revalidatePath("/about")`。
- `updateSystemSettings()`(actions.ts:1633):签名与 `ALLOWED_SETTINGS_FIELDS` 增加 `aboutContent`,补 `revalidatePath("/about")`。

## 3. 公开接口与类型

- `app/api/settings/route.ts`:公开响应中剥离 `aboutContent`(防止整篇 Markdown 随每个页面下发),保留 `enableAboutPage` 供 Footer 判断。
- `lib/client-settings.ts`:`PublicSettings` 与 `defaultSettings` 增加 `enableAboutPage: false`。

## 4. 前台页面与入口

- 新增 `app/(public)/about/page.tsx`(服务端组件):
  - `getAboutPage()` 取内容;`!enabled || !content` 时 `notFound()`(与 category 页模式一致)。
  - `generateMetadata`:「{关于} - {siteName}」。
  - 仿首页取 `getCategories()` + `getSites()`,包在 `SearchableLayout` 里获得一致的 Header/Footer/搜索体验;正文用 Card + 现有 `MarkdownContent` 组件渲染(max-w 适中居中)。
- `components/layout/footer.tsx`:友链与管理入口之间,`settings?.enableAboutPage` 时渲染 `<Link href="/about">` 关于链接。

## 5. 管理端编辑(app/admin/(dash)/users/page.tsx)

设置页(当前挂在工作区上下文下)新增第五个分区 `about`:

- `sections` 增加 `{ id: "about", titleKey: "secAbout", icon: FileText }`;`admin-scope-changed` effect 中 about 分区声明为 workspace 作用域(工作区切换器保持可用)。
- `SystemSettingsData` 增加 `aboutContent`;`loadSettings` 中从 `getWorkspaceDisplaySettings` 的 display 取工作区感知值。
- `handleSaveSettings` 非默认工作区分支:`aboutContent` 传给 `updateWorkspaceDisplaySettings` 并从传给 `updateSystemSettings` 的 rest 中剥离(默认分支整体透传)。
- 新分区 JSX:工作区上下文横幅(复用 workspaceContext/workspaceOverrideHint 文案)、`enableAboutPage` 全局开关(Switch)、Markdown 编辑 Textarea(等宽字体)+ 编辑/预览 Tab 切换(预览复用 `MarkdownContent`),空内容时提示「将回退全局默认内容」。

## 6. 国际化(messages/ 下 6 个语言文件)

- 顶层 `footer.about`(关于/About/Über/…
- 顶层 `about.title`(页面标题/metadata 用)。
- `admin.settings` 新增:secAbout、secAboutDesc、aboutEnableLabel/Hint、aboutContentLabel/Placeholder/Hint、aboutTabEdit/aboutTabPreview、aboutFallbackHint。

## 7. 验证

- `npx prisma validate` + `npx prisma generate`(本地无 DB,迁移由用户按现有 `db:migrate:deploy` 流程执行)。
- `npx tsc --noEmit` 与 `npm run lint` 通过。
- 手动核对:非默认工作区保存路径、公开接口不泄漏 aboutContent、Footer 入口条件、`?__workspace=slug` 预览路径下的工作区内容解析。
