import { JSDOM } from 'jsdom'

// Chrome书签解析的扁平化结果
export interface ParsedBookmark {
  categories: Array<{
    name: string
    sites: Array<{
      name: string
      url: string
      icon?: string
    }>
  }>
}

/**
 * 解析Chrome书签HTML文件
 * 支持多层嵌套文件夹，自动扁平化为独立分类
 */
export function parseChromeBookmarks(html: string): ParsedBookmark {
  const dom = new JSDOM(html)
  const document = dom.window.document
  const result: ParsedBookmark = { categories: [] }

  const rootDl = document.querySelector('dl')

  // 递归解析书签文件夹
  function parseFolder(dlElement: HTMLElement, parentPath: string[] = []) {
    // 获取所有 DT 子元素（忽略 p 标签）
    const items = Array.from(dlElement.children).filter(
      child => child.tagName === 'DT'
    ) as HTMLElement[]

    for (const item of items) {
      // 处理文件夹 (H3标签)
      const h3 = item.querySelector('h3')
      if (h3) {
        const folderName = h3.textContent?.trim() || '未命名分类'

        // JSDOM自动修复HTML后，结构变成: <DT><H3>名称</H3><DL>...</DL></DT>
        // 所以DL是DT的直接子元素
        const childDl = item.querySelector('dl')

        if (childDl) {
          // 递归处理子文件夹（扁平化：每个子文件夹都成为独立分类）
          parseFolder(childDl as HTMLElement, [...parentPath, folderName])
        }

        // 处理完文件夹后，继续处理下一个 DT
        continue
      }

      // 处理书签链接 (A标签)
      const link = item.querySelector('a')
      if (link) {
        const siteName = link.textContent?.trim() || '未命名网站'
        const siteUrl = link.getAttribute('href') || ''
        const icon = link.getAttribute('icon') || undefined

        // 使用路径中的最后一个文件夹名称作为分类
        if (parentPath.length > 0) {
          const categoryName = parentPath[parentPath.length - 1]

          let category = result.categories.find(c => c.name === categoryName)
          if (!category) {
            category = { name: categoryName, sites: [] }
            result.categories.push(category)
          }

          category.sites.push({ name: siteName, url: siteUrl, icon })
        }
      }
    }
  }

  // 从根DL开始解析
  if (rootDl) {
    parseFolder(rootDl as HTMLElement)
  }

  return result
}

/**
 * 生成Chrome书签HTML格式
 */
export function generateChromeBookmarks(
  categories: Array<{
    name: string
    sites: Array<{
      name: string
      url: string
      icon?: string
    }>
  }>
): string {
  const timestamp = Math.floor(Date.now() / 1000)

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`

  categories.forEach((category) => {
    html += `    <DT><H3 ADD_DATE="${timestamp}" LAST_MODIFIED="${timestamp}">${escapeHtml(category.name)}</H3>
    <DL><p>
`
    category.sites.forEach((site) => {
      const iconAttr = site.icon ? ` ICON="${site.icon}"` : ''
      html += `        <DT><A HREF="${escapeHtml(site.url)}" ADD_DATE="${timestamp}"${iconAttr}>${escapeHtml(site.name)}</A>\n`
    })

    html += `    </DL><p>\n`
  })

  html += `</DL><p>\n`

  return html
}

/**
 * HTML转义函数
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
