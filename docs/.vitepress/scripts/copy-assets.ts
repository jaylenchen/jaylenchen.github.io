import { resolve, dirname } from 'node:path'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// 获取当前文件的目录路径（ESM 兼容）
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 解析路径
const docsDir = resolve(__dirname, '../..')
const articlesAssetsDir = resolve(docsDir, '.articles/assets')
const publicDir = resolve(docsDir, 'src/public')

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
      
      // 检查目标文件是否存在，如果存在则比较修改时间
      const srcTime = stats.mtimeMs
      let shouldCopy = true
      
      if (fs.existsSync(destPath)) {
        const destStats = fs.statSync(destPath)
        const destTime = destStats.mtimeMs
        // 如果源文件比目标文件新，则复制（覆盖）
        // 如果目标文件更新或相同时间，不覆盖
        if (destTime >= srcTime) {
          shouldCopy = false
        }
      }
      
      if (shouldCopy) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        
        fs.copyFileSync(src, destPath)
        console.log(`✅ 已复制: ${relativePath}`)
      } else {
        console.log(`⏭️  跳过（目标文件已是最新）: ${relativePath}`)
      }
    }
  }
}

// 收集 .articles/assets 中的所有文件路径（相对于 assets 目录）
function collectSourceFiles(dir: string, baseDir: string, fileSet: Set<string>) {
  if (!fs.existsSync(dir)) return
  
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = resolve(dir, file)
    const stats = fs.statSync(filePath)
    
    if (stats.isDirectory()) {
      collectSourceFiles(filePath, baseDir, fileSet)
    } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico|pdf)$/i.test(file)) {
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/')
      fileSet.add(relativePath)
    }
  }
}

// 删除 public 中存在但 .articles/assets 中不存在的文件
function removeOrphanedFiles(sourceFileSet: Set<string>) {
  if (!fs.existsSync(publicDir)) return
  
  // 遍历 public 目录，查找需要删除的孤立文件
  function scanPublicDir(dir: string, baseDir: string) {
    if (!fs.existsSync(dir)) return
    
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = resolve(dir, file)
      const stats = fs.statSync(filePath)
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/')
      
      if (stats.isDirectory()) {
        scanPublicDir(filePath, baseDir)
        // 如果目录为空，删除它
        try {
          if (fs.readdirSync(filePath).length === 0) {
            fs.rmdirSync(filePath)
            console.log(`🗑️  已删除空目录: ${relativePath}`)
          }
        } catch (e) {
          // 忽略错误
        }
      } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico|pdf)$/i.test(file)) {
        // 检查对应的源文件是否存在
        // public/life/xxx.png -> .articles/assets/life/xxx.png
        if (!sourceFileSet.has(relativePath)) {
          // 检查是否是 assets 相关的文件（排除其他手动添加的文件）
          // 如果 public 中的文件在 .articles/assets 中有对应目录结构，才删除
          const possibleSourcePath = resolve(articlesAssetsDir, relativePath)
          const possibleSourceDir = resolve(articlesAssetsDir, path.dirname(relativePath))
          if (fs.existsSync(possibleSourceDir)) {
            // 源目录存在，说明这个文件应该被同步，但现在不存在了，删除它
            fs.unlinkSync(filePath)
            console.log(`🗑️  已删除孤立文件: ${relativePath}`)
          }
        }
      }
    }
  }
  
  scanPublicDir(publicDir, publicDir)
}

// 执行资源复制的通用函数
function syncAssets() {
  if (!fs.existsSync(articlesAssetsDir)) {
    console.warn(`⚠️  .articles/assets 目录不存在: ${articlesAssetsDir}`)
    return
  }
  
  console.log(`📦 开始同步资源: ${articlesAssetsDir} -> ${publicDir}`)

  // 收集所有源文件
  const sourceFileSet = new Set<string>()
  collectSourceFiles(articlesAssetsDir, articlesAssetsDir, sourceFileSet)

  // 删除孤立文件（在 public 中存在但源中不存在的文件）
  removeOrphanedFiles(sourceFileSet)

  // 复制资源（去掉 assets 这一层，如果文件不存在或源文件更新则复制）
  copyRecursive(articlesAssetsDir, articlesAssetsDir)
  
  console.log('✅ 资源同步完成')
}

// 执行同步
syncAssets()

