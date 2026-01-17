"use client"

import { useState } from "react"
import { ImportBookmarksDialog } from "@/components/admin/import-bookmarks-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileDown, FileUp, Database, ChevronDown } from "lucide-react"

export default function DataManagementPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">数据管理</h1>
        <p className="text-muted-foreground">导入浏览器书签、导出备份、数据迁移</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 导入数据 - 主要操作 */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded">
                <FileUp className="h-5 w-5 text-primary" />
              </div>
              导入数据
            </CardTitle>
            <CardDescription>
              从浏览器导入书签，或导入本系统JSON备份
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setImportDialogOpen(true)}
              className="w-full"
              size="lg"
            >
              <FileUp className="mr-2 h-4 w-4" />
              开始导入
            </Button>
          </CardContent>
        </Card>

        {/* 导出数据 - 辅助功能 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-muted rounded">
                <FileDown className="h-5 w-5" />
              </div>
              导出数据
            </CardTitle>
            <CardDescription>
              导出为完整备份或Chrome书签格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  选择导出格式
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => window.open('/api/data/export', '_blank')}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">JSON完整备份</span>
                    <span className="text-xs text-muted-foreground">包含所有字段，用于数据迁移和备份</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open('/api/bookmarks/export', '_blank')}>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">Chrome书签</span>
                    <span className="text-xs text-muted-foreground">导出到浏览器，在Chrome等浏览器中使用</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
      </div>

      {/* 说明卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            功能说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* 导入模式 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📥</span>
              导入模式
            </h4>
            <div className="grid gap-3 md:grid-cols-2 ml-7">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-medium text-foreground mb-1">追加模式</p>
                <p className="text-muted-foreground text-xs">保留现有数据，将新数据添加到末尾</p>
              </div>
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                <p className="font-medium text-destructive mb-1">覆盖模式</p>
                <p className="text-muted-foreground text-xs">删除所有现有数据，仅保留导入的数据</p>
              </div>
            </div>
          </div>

          {/* 导入格式 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📄</span>
              支持的导入格式
            </h4>
            <div className="space-y-3 ml-7">
              {/* JSON格式 */}
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-primary font-semibold">JSON格式（推荐）</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">完整数据</span>
                </div>
                <p className="text-muted-foreground text-xs">包含描述、排序、发布状态等所有字段，不会丢失任何数据，适合数据迁移和恢复</p>
              </div>

              {/* Chrome书签格式 */}
              <div className="p-3 rounded-lg border border-blue-600/20 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-blue-600 font-semibold">Chrome书签</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">浏览器格式</span>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium">导出：</span>在Chrome等浏览器中使用，方便用户将导航站的书签同步到浏览器
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <span className="font-medium">导入：</span>从浏览器导入书签到导航站，仅包含名称、URL和图标
                  </p>
                </div>

                {/* 多层嵌套说明 - 仅导入时 */}
                <div className="mt-2 p-2 rounded bg-background/50 border-l-2 border-blue-600">
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    <span className="font-medium">多层嵌套处理（导入时）：</span>如果浏览器书签包含多层嵌套文件夹（如 <code className="px-1 py-0.5 rounded bg-background font-mono">/云服务/Cloudflare</code>），
                    系统会自动将每个文件夹拆分为独立分类。例如：<code className="px-1 py-0.5 rounded bg-background font-mono">云服务</code> 和
                    <code className="px-1 py-0.5 rounded bg-background font-mono">Cloudflare</code> 会成为两个独立的分类。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              安全提示
            </h4>
            <div className="ml-7 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <p className="text-destructive text-xs font-medium mb-1">覆盖模式会永久删除所有数据</p>
              <p className="text-muted-foreground text-xs mb-2">执行覆盖后，原有的所有分类、网站和访问统计记录都会被永久删除。</p>
              <p className="text-muted-foreground text-xs">💡 <strong>访问统计无法恢复</strong>，因为导出的JSON文件不包含统计数据。如需保留统计数据，请使用数据库备份。</p>
            </div>
          </div>

          {/* 数据对比 */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              数据格式对比
            </h4>
            <div className="ml-7 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">字段</th>
                    <th className="text-center p-2 font-medium">JSON</th>
                    <th className="text-center p-2 font-medium">Chrome书签</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b">
                    <td className="p-2">网站名称</td>
                    <td className="text-center p-2">✅</td>
                    <td className="text-center p-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">URL地址</td>
                    <td className="text-center p-2">✅</td>
                    <td className="text-center p-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">网站描述</td>
                    <td className="text-center p-2 text-primary font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">排序</td>
                    <td className="text-center p-2 text-primary font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                  <tr>
                    <td className="p-2">发布状态</td>
                    <td className="text-center p-2 text-primary font-semibold">✅</td>
                    <td className="text-center p-2">❌</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导入/导出对话框 */}
      <ImportBookmarksDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  )
}
