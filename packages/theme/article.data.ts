import fs from 'node:fs'
import { resolve } from 'node:path'
import path from 'node:path'
import parseFrontmatter from 'gray-matter'

const excludedFiles = ['index.md', 'tags.md', 'archives.md', 'me.md']

export default {
  watch: [resolve(__dirname, '../docs/src/**/*.md')],
  load(watchedFiles: any[]) {
    // 排除不必要文件
    const articleFiles = watchedFiles.filter((file: string) => {
      const filename = path.basename(file)
      return !excludedFiles.includes(filename)
    })
    // 解析文章 Frontmatter
    const articles = articleFiles
      .filter((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data } = parseFrontmatter(articleContent)

        return !!data.publish
      })
      .map((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data } = parseFrontmatter(articleContent)
        const path = articleFile.split('/docs/src')[1].replace(/\.md$/, '')

        return {
          ...data,
          path
        }
      })

    return articles
  },
}
