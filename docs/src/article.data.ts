import fs from 'node:fs'
import { resolve, relative } from 'node:path'
import path from 'node:path'
import parseFrontmatter from 'gray-matter'

const excludedFiles = ['index.md', 'tags.md', 'archives.md']

export default {
  watch: [resolve(__dirname, './**/*.md')],
  load(watchedFiles: any[]) {
    const baseDir = resolve(__dirname)

    const articles = watchedFiles
      .filter((file: string) => {
        const filename = path.basename(file)
        return !excludedFiles.includes(filename)
      })
      .filter((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data } = parseFrontmatter(articleContent)

        return !!data.publish
      })
      .map((articleFile: string) => {
        const articleContent = fs.readFileSync(articleFile, 'utf-8')
        const { data } = parseFrontmatter(articleContent)
        const relativePath = relative(baseDir, articleFile).replace(/\\/g, '/').replace(/\.md$/, '')
        const normalizedPath = `/${relativePath}`

        return {
          ...data,
          path: normalizedPath
        }
      })

    return articles
  },
}
