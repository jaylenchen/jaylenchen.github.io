<script lang="ts" setup>
import { ref, computed, useAttrs } from 'vue'
import { useData, useRoute } from 'vitepress'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

import TimeSvg from '../assets/svgs/time.svg'
import DateSvg from '../assets/svgs/date.svg'
import AuthorSvg from '../assets/svgs/author.svg'
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

// 判断是否在首页或 Tags 页面
const isListPage = computed(() => {
  if (isTagsContext.value) return true
  const path = route.path || ''
  return path === '/' || path.startsWith('/tags')
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

    <!-- 作者 -->
    <div class="meta-item">
      <span class="meta-icon author">
        <AuthorSvg></AuthorSvg>
      </span>
      <span class="meta-content">
        <a href="https://github.com/jaylenchen" target="_blank" rel="noopener noreferrer">
          jaylenchen
        </a>
      </span>
    </div>

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

  </div>
</template>

<style scoped>
.meta-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 2px;
}

/* 标签页特殊样式 - 更紧凑 */
.tags-meta .meta-wrapper {
  margin: 0;
  gap: 0.3rem;
  padding: 0;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  max-width: 240px;
  color: var(--vp-c-text-1);
  cursor: default;
  font-size: 14px;
  padding: 2px;
}

/* 标签页特殊样式 - 更小的 padding */
.tags-meta .meta-item {
  padding: 0;
  font-size: 0.8rem;
}

.meta-item.original {
  margin-right: 0.5rem;
  margin-top: -0.5px;
}

.meta-icon,
.meta-content {
  display: inline-flex;
  align-items: center;
  margin-right: .375rem;
  vertical-align: middle;
}

.meta-icon {
  line-height: 1;
  overflow: visible;
  color: var(--vp-c-text-3);
}

.meta-icon svg {
  height: 18px;
  width: 18px;
  display: block;
  overflow: visible;
}

.meta-content {
  font-weight: 400;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

time.meta-content {
  display: inline-flex;
  align-items: center;
}

.meta-content a {
  font-weight: 400;
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.meta-content a:hover {
  color: var(--vp-c-brand-1);
}
</style>

