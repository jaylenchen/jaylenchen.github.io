import type { Plugin } from 'vite'
import { resolve, dirname } from 'node:path'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * Vite 插件：将 .articles/assets 目录中的静态资源复制到 src/public
 * 规则：
 * 1. 复制前先清除 public 中对应的目录结构
 * 2. .articles/assets/life/xxx.png -> src/public/life/xxx.png
 * 3. .articles/assets/technology/xxx.png -> src/public/technology/xxx.png
 */
export function copyAssetsToPublic(): Plugin {
  // 使用与 site-config.ts 相同的方式解析路径
  // 由于 VitePress 在构建时会解析路径，我们使用相对路径解析
  // 插件文件在 .vitepress/plugins/，需要找到 docs 目录
  // 使用 fileURLToPath 和 dirname 来获取当前文件目录
  let articlesAssetsDir: string
  let publicDir: string
  
  try {
    // 使用 fileURLToPath 正确解析 import.meta.url
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    
    // 插件文件在 docs/.vitepress/plugins/
    // 所以 ../.. 到达 docs/ 目录
    const docsDir = resolve(__dirname, '../..')
    
    articlesAssetsDir = resolve(docsDir, '.articles/assets')
    publicDir = resolve(docsDir, 'src/public')
  } catch (e) {
    // 回退方案：使用 process.cwd()，假设在 docs 目录运行
    const cwd = process.cwd()
    articlesAssetsDir = resolve(cwd, '.articles/assets')
    publicDir = resolve(cwd, 'src/public')
  }
  
  // 调试输出
  console.log(`[copy-assets-to-public] 解析路径:`)
  console.log(`  articlesAssetsDir: ${articlesAssetsDir}`)
  console.log(`  publicDir: ${publicDir}`)
  console.log(`  articlesAssetsDir exists: ${fs.existsSync(articlesAssetsDir)}`)

  // 递归删除目录
  function removeDir(dir: string) {
    if (!fs.existsSync(dir)) return
    
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = resolve(dir, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        removeDir(filePath)
      } else {
        fs.unlinkSync(filePath)
      }
    }
    fs.rmdirSync(dir)
  }

  // 递归复制文件，保持目录结构（去掉 assets 这一层）
  function copyRecursive(src: string, baseSrc: string) {
    if (!fs.existsSync(src)) return

    const stats = fs.statSync(src)
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(src)
      for (const file of files) {
        const srcPath = resolve(src, file)
        copyRecursive(srcPath, baseSrc)
      }
    } else if (stats.isFile()) {
      // 只复制图片和静态资源文件
      if (/\.(png|jpg|jpeg|gif|webp|svg|ico|pdf)$/i.test(src)) {
        // 计算相对于 baseSrc (.articles/assets) 的路径
        const relativePath = path.relative(baseSrc, src)
        const destPath = resolve(publicDir, relativePath)
        const destDir = path.dirname(destPath)
        
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        
        fs.copyFileSync(src, destPath)
      }
    }
  }

  // 执行资源复制的通用函数
  function syncAssets() {
    if (!fs.existsSync(articlesAssetsDir)) {
      console.warn(`⚠️  .articles/assets 目录不存在: ${articlesAssetsDir}`)
      return
    }
    
    console.log(`📦 开始同步资源: ${articlesAssetsDir} -> ${publicDir}`)

      // 先清除 public 中对应的目录（保留 public 本身）
      if (fs.existsSync(publicDir)) {
        const items = fs.readdirSync(publicDir)
        for (const item of items) {
          // 只删除 assets 对应的目录，保留其他（如 svgs、tech 等）
          const itemPath = resolve(publicDir, item)
          const stats = fs.statSync(itemPath)
          
          // 检查 .articles/assets 中是否有对应目录
          const assetItemPath = resolve(articlesAssetsDir, item)
          if (stats.isDirectory() && fs.existsSync(assetItemPath)) {
            removeDir(itemPath)
            console.log(`🗑️  已清除: public/${item}`)
          }
        }
      }

      // 复制资源（去掉 assets 这一层）
      copyRecursive(articlesAssetsDir, articlesAssetsDir)
      
      console.log('✅ 已复制 .articles/assets 到 src/public')
  }

  return {
    name: 'copy-assets-to-public',
    buildStart() {
      // 构建开始时复制资源
      syncAssets()
    },
    configureServer(server) {
      // 开发服务器启动时也执行一次复制
      syncAssets()
      
      // 开发服务器：监听 .articles/assets 的变化
      const watchFiles: string[] = []
      
      function watchAssetsDir(dir: string) {
        if (!fs.existsSync(dir)) return
        
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const filePath = resolve(dir, file)
          const stats = fs.statSync(filePath)
          
          if (stats.isDirectory()) {
            watchAssetsDir(filePath)
          } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico|pdf)$/i.test(file)) {
            watchFiles.push(filePath)
            server.watcher.add(filePath)
          }
        }
      }
      
      watchAssetsDir(articlesAssetsDir)
      
      // 监听文件变化
      server.watcher.on('change', (file) => {
        if (watchFiles.includes(file) && file.startsWith(articlesAssetsDir)) {
          const relativePath = path.relative(articlesAssetsDir, file)
          const destPath = resolve(publicDir, relativePath)
          const destDir = path.dirname(destPath)
          
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true })
          }
          
          fs.copyFileSync(file, destPath)
          console.log(`🔄 已更新: ${relativePath}`)
        }
      })
    }
  }
}


