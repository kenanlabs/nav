import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Skeleton - 匹配真实 Header 结构 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="px-3 sm:px-4 lg:px-6">
          <div className="flex h-14 items-center gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-24 hidden sm:block" />
              </div>
            </div>

            {/* 分类导航骨架 */}
            <div className="hidden md:flex flex-1 items-center ml-4">
              <div className="bg-muted/50 inline-flex h-9 items-center rounded-lg p-1 gap-0.5">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-7 w-18 rounded-md" />
              </div>
            </div>

            {/* 工具栏骨架 */}
            <div className="flex-shrink-0 flex items-center gap-1.5">
              <Skeleton className="h-9 w-44 rounded-md hidden sm:block" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Skeleton - 匹配真实页面结构 */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-[1600px] w-full">
          <div className="lg:pr-36 lg:pl-2">
            <div className="space-y-12">
              {[...Array(3)].map((_, i) => (
                <section key={i} className="space-y-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                  {/* 分类标题骨架 */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-5 w-8 rounded-md" />
                  </div>

                  {/* 网站卡片骨架 */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, j) => (
                      <div 
                        key={j} 
                        className="rounded-xl border border-border/60 bg-card p-4 animate-fade-in"
                        style={{ animationDelay: `${(i * 8 + j) * 30}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t bg-background px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1600px] w-full py-6">
          <div className="lg:pr-36 lg:pl-2">
            <div className="flex flex-col items-center justify-between space-y-4 sm:flex-row sm:space-y-0">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
