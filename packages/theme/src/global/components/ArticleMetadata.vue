<script lang="ts" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

import TimeSvg from '../../assets/svgs/time.svg'
import ProjectSvg from '../../assets/svgs/project.svg'
import TagSvg from '../../assets/svgs/tag.svg'

import { goToArchivesPage } from '../../utils/route';


interface Props {
  article: {
    date: string
    project: string
    tags: string[]
  }
}

// 定义文章属性
const props = defineProps<Props>()
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')


const date = ref(props.article?.date ? new Date(props.article?.date) : new Date())
const project = ref(props.article?.project ?? '')
const tags = ref(props.article?.tags ?? [])

// 处理项目点击
function handleProjectClick(project: string) {
  goToArchivesPage('project', project)
}

// 处理标签点击
function handleTagClick(tag: string) {
  goToArchivesPage('tag', tag)
}

</script>

<template>
  <div class="meta-wrapper">
    <!-- 时间 -->
    <div class="meta-item">
      <span class="meta-icon date">
        <TimeSvg></TimeSvg>
      </span>
      <time class="meta-content" :datetime="date.toISOString()" :title="dayjs().to(dayjs(date))">
        {{
          date.toLocaleString('zh', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute:
              'numeric'
          })
        }}
      </time>
    </div>

    <!-- 项目 -->
    <div class="meta-item">
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
    <div class="meta-item">
      <span class="meta-icon tag">
        <TagSvg></TagSvg>
      </span>
      <span class="meta-content">
        <span v-for="(tag, index) in tags" :key="index">
          <a href="#" target="_self" :title="tag" @click="handleTagClick(tag)">{{
            tag
            }}</a>
          <span v-if="index !== tags.length - 1">｜</span>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.meta-wrapper {
  margin-top: 10px;
}

.meta-item {
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  max-width: 240px;
  color: var(--vp-c-text-2);
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

.meta-icon svg {
  fill: var(--vp-c-text-2);
  height: 16px;
  width: 16px;
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
