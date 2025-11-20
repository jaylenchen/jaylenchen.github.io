<script lang="ts" setup>
import { ref, computed, useAttrs, onMounted, nextTick } from 'vue'
import { useData, useRoute } from 'vitepress'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

import TimeSvg from '../assets/svgs/time.svg'
import DateSvg from '../assets/svgs/date.svg'
import ReadingTimeSvg from '../assets/svgs/reading-time.svg'
import ProjectSvg from '../assets/svgs/project.svg'
import TagSvg from '../assets/svgs/tag.svg'
import { goToArchivesPage, goToTagsPage } from '../utils/route';


interface Props {
  article: {
    date: string
    project: string
    tags: string[]
  }
}

// 定义文章属性
const props = defineProps<Props>()
const attrs = useAttrs()
const { page } = useData()
const route = useRoute()
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')


const date = ref(props.article?.date ? new Date(props.article?.date) : new Date())
const project = ref(props.article?.project ?? '')
const tags = ref(props.article?.tags ?? [])
const isTagsContext = computed(() => {
  const cls = attrs.class
  return typeof cls === 'string' && cls.split(' ').includes('tags-meta')
})
const displayTags = computed(() => (isTagsContext.value ? [] : tags.value))

// 判断是否在 Archives 或 Tags 页面
const isListPage = computed(() => {
  if (isTagsContext.value) return true
  const path = route.path || ''
  return path.startsWith('/archives') || path.startsWith('/tags') || path === '/'
})

// 阅读时长：只在文章详情页显示和计算
const readingTime = ref<number | null>(null)

// 字数统计的正则表达式
const wordPattern = /[a-zA-Z0-9_\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g

// 计算字数
function countWord(data: string): number {
  const m = data.match(wordPattern)
  let count = 0
  if (!m) return 0
  for (let i = 0; i < m.length; i += 1) {
    // CJK 字符按字符长度计算，其他按 1 计算
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    } else {
      count += 1
    }
  }
  return count
}

// 计算阅读时长（基于字数）
function calculateReadingTime(): number {
  try {
    const mainContent = document.querySelector('.vp-doc .content') || 
                        document.querySelector('.vp-doc .main') || 
                        document.querySelector('.vp-doc')
    
    if (!mainContent) return 0
    
    // 克隆节点，避免修改原始 DOM
    const cloned = mainContent.cloneNode(true) as HTMLElement
    
    // 排除不应该计入字数的元素
    const excludeSelectors = [
      'pre',           // 代码块
      '.mermaid',      // Mermaid 图表
      '.math',         // 数学公式
      '.MathJax',      // MathJax
      '.meta-wrapper', // 文章元数据
      '.article-meta', // 文章元数据
      '.VPDocAside',   // 侧边栏
      '.outline',      // 目录
      'nav',           // 导航
      'aside',         // 侧边栏
      '.edit-link',    // 编辑链接
      'footer',        // 页脚
      'script',        // 脚本
      'style',         // 样式
      '.header-anchor', // 标题锚点链接
      'img'            // 图片
    ]
    
    excludeSelectors.forEach(selector => {
      cloned.querySelectorAll(selector).forEach(el => el.remove())
    })
    
    const text = cloned.textContent || ''
    const wordCount = countWord(text)
    
    // 阅读速度：250 字/分钟（中文平均值）
    const minutes = Math.ceil(wordCount / 250)
    return Math.max(1, minutes) // 至少 1 分钟
  } catch (e) {
    console.warn('阅读时长计算失败:', e)
    return 0
  }
}

let hasCalculated = false

onMounted(() => {
  // 只在文章详情页计算阅读时长
  if (isListPage.value) {
    return
  }
  
  // 使用 nextTick 确保 DOM 已更新，立即计算
  nextTick(() => {
    if (hasCalculated) {
      return
    }
    const minutes = calculateReadingTime()
    if (minutes > 0) {
      readingTime.value = minutes
      hasCalculated = true
    }
  })
})

// 处理项目点击
function handleProjectClick(project: string) {
  goToArchivesPage('project', project)
}

// 处理标签点击 - 跳转到 Tags 页面并选中对应标签
function handleTagClick(tag: string) {
  goToTagsPage(tag)
}


</script>

<template>
  <div class="meta-wrapper">
    <!-- 项目 -->
    <div v-if="project" class="meta-item">
      <span class="meta-icon project">
        <ProjectSvg></ProjectSvg>
      </span>
      <span class="meta-content">
        <span>
          <a href="#" target="_self" @click="handleProjectClick(project)">
            {{ project }}
          </a>
        </span>
      </span>
    </div>

    <!-- 标签 -->
    <div v-if="displayTags.length" class="meta-item">
      <span class="meta-icon tag">
        <TagSvg></TagSvg>
      </span>
      <span class="meta-content">
        <span v-for="(tag, index) in displayTags" :key="index">
          <a href="#" target="_self" :title="tag" @click="handleTagClick(tag)">{{
            tag
            }}</a>
          <span v-if="index !== displayTags.length - 1">｜</span>
        </span>
      </span>
    </div>

    <!-- 时间 -->
    <div class="meta-item">
      <span class="meta-icon date">
        <DateSvg></DateSvg>
      </span>
      <time class="meta-content" :datetime="date.toISOString()" :title="dayjs().to(dayjs(date))">
        {{
          date.toLocaleString('zh', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
          })
        }}
      </time>
    </div>

    <!-- 阅读时长：只在文章详情页显示 -->
    <div v-if="!isListPage && readingTime !== null && readingTime > 0" class="meta-item">
      <span class="meta-icon reading-time">
        <ReadingTimeSvg></ReadingTimeSvg>
      </span>
      <span class="meta-content">
        {{ readingTime }} 分钟
      </span>
    </div>
  </div>
</template>

<style scoped>
.meta-wrapper {
  margin-top: 10px;
  margin-bottom: 16px;
}

.meta-item {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  max-width: 240px;
  color: var(--vp-c-text-1);
  cursor: default;
  font-size: 14px;
  margin-right: 1rem;
}

.meta-item.original {
  margin-right: 0.5rem;
  margin-top: -0.5px;
}

.meta-icon,
meta-content {
  display: inline-block;
  margin-right: .375rem;
  vertical-align: middle;
}

.meta-icon {
  position: relative;
  bottom: 1.5px;
}

.meta-icon.author {
  bottom: 1.3px;
}

.meta-icon.date {
  bottom: 1.3px;
}

.meta-icon.reading-time {
  bottom: 1.3px;
}

.meta-icon svg {
  height: 18px;
  width: 18px;
}

.meta-content a {
  font-weight: 400;
  color: var(--vp-c-text-1);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.meta-content a:hover {
  color: var(--vp-c-brand-1);
}
</style>

