<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { Tag } from 'ant-design-vue'
import ArticleMetadata from '../../global/components/ArticleMetadata.vue'

import ArchiveSvg from '../../assets/svgs/archive.svg';
import ArticleSvg from '../../assets/svgs/article.svg';
import RatSvg from '../../assets/svgs/chinese-zodiac/rat.svg';
import OxSvg from '../../assets/svgs/chinese-zodiac/ox.svg';
import TigerSvg from '../../assets/svgs/chinese-zodiac/tiger.svg';
import Rabbit from '../../assets/svgs/chinese-zodiac/rabbit.svg';
import DragonSvg from '../../assets/svgs/chinese-zodiac/dragon.svg';
import SnakeSvg from '../../assets/svgs/chinese-zodiac/snake.svg';
import HorseSvg from '../../assets/svgs/chinese-zodiac/horse.svg';
import GoatSvg from '../../assets/svgs/chinese-zodiac/goat.svg';
import MonkeySvg from '../../assets/svgs/chinese-zodiac/monkey.svg';
import RoosterSvg from '../../assets/svgs/chinese-zodiac/rooster.svg';
import DogSvg from '../../assets/svgs/chinese-zodiac/dog.svg';
import PigSvg from '../../assets/svgs/chinese-zodiac/pig.svg';

// @ts-ignore
import { data as articleData } from '../../../article.data'
import { goToArchivesPage } from '../../utils/route';
import { getQueryParam, getChineseZodiac } from '../../utils/utils';


enum ArchiveType {
  Project,
  Tag,
  Year,
  All
}

const articles = ref<any[]>([...articleData]); // 文档原始数据
const archiveData = ref<{ [x: string]: { [x: string]: any[]; } }>({}); // 文档归档数据
const archiveType = ref<ArchiveType>(ArchiveType.All);
const condition = reactive({
  project: getQueryParam('project')?.trim(),
  tag: getQueryParam('tag')?.trim(),
  year: getQueryParam('year')?.trim()
})
const project = ref(getQueryParam('project')?.trim());
const tag = ref(getQueryParam('tag')?.trim());
const year = ref(getQueryParam('year')?.trim());

function yearIcon(year: string) {
  const yearSvgs = {
    rat: RatSvg,
    ox: OxSvg,
    tiger: TigerSvg,
    rabbit: Rabbit,
    dragon: DragonSvg,
    snake: SnakeSvg,
    horse: HorseSvg,
    goat: GoatSvg,
    monkey: MonkeySvg,
    rooster: RoosterSvg,
    dog: DogSvg,
    pig: PigSvg
  }

  return yearSvgs[getChineseZodiac(+year.replace("年", "")) as keyof typeof yearSvgs]
}

function handleYearIconClick(newYear: string) {
  goToArchivesPage('year', newYear.replace('年', ''))
}

function resetCurrentPage() {
  goToArchivesPage()
}


/**
 * 初始化时间轴
 */
function initTimeLine() {
  // 根据条件过滤文章数据
  if (condition.project) {
    archiveType.value = ArchiveType.Project;
    articles.value = articles.value.filter((article) => project.value && article.project && article.project.includes(project.value))
  }
  else if (condition.tag) {
    archiveType.value = ArchiveType.Tag;
    articles.value = articles.value.filter((article) => tag.value && article.tags && article.tags.includes(tag.value))
  }
  else if (condition.year) {
    archiveType.value = ArchiveType.Year;
    articles.value = articles.value.filter((article) => year.value && article.date && (new Date(article.date).getFullYear()) === +year.value)
  } else {
    archiveType.value = ArchiveType.All;
    articles.value = articleData;
  }

  // 文章数据归档处理
  // 1.对文章数据进行降序排序
  articles.value.length > 0 && articles.value.sort((a, b) => b.date.localeCompare(a.date));
  // 2.按年、月进行归档
  for (let i = 0; i < articles.value.length; i++) {
    const article = articles.value?.[i];
    const date = new Date(article.date)
    const year = date.getFullYear() + '年';
    const month = (date.getMonth() + 1) + '月';

    if (!archiveData.value[year]) {
      archiveData.value[year] = {};
    }

    if (!(archiveData.value[year][month])) {
      archiveData.value[year][month] = [];
    }

    archiveData.value[year][month].push(article);
  }
}

onMounted(() => {
  initTimeLine()
})

watch([year], () => {
  initTimeLine()
})
</script>

<template>
  <div class="timeline-wrap">
    <!-- 时间轴头部 -->
    <div class="timeline-header">
      <!-- 如果是用户点击文章的分类按钮进入的归档页面，将会显示当前分类的文章列表 -->
      <Tag v-if="archiveType === ArchiveType.Project" class="content" closable @close="resetCurrentPage">
        <template #icon>
          <ArchiveSvg></ArchiveSvg>
        </template>
        {{ project }}项目 （共 {{ articles.length }} 篇）文章
      </Tag>

      <!-- 如果是用户点击文章的标签按钮进入的归档页面，将会显示当前标签的文章列表 -->
      <Tag v-else-if="archiveType === ArchiveType.Tag" class="content" closable @close="resetCurrentPage">
        <template #icon>
          <ArchiveSvg></ArchiveSvg>
        </template>
        {{ tag }}标签 （共 {{ articles.length }} 篇）文章
      </Tag>

      <!-- 如果是用户点击文章的年份按钮进入的归档页面，将会显示当前年份的文章列表 -->
      <Tag v-else-if="archiveType === ArchiveType.Year" class="content" closable @close="resetCurrentPage">
        <ArchiveSvg></ArchiveSvg>
        {{ year }}年 （共 {{ articles.length }} 篇）文章
      </Tag>

      <!-- 如果是用户直接进入归档页面，将会显示所有文章 -->
      <Tag v-else class="content">
        <ArchiveSvg></ArchiveSvg>
        全部（共 {{ articles.length }} 篇）文章
      </Tag>
    </div>

    <!-- 时间轴主体 -->
    <div class="timeline-item" v-for="(item, year) in archiveData">
      <div class="year">
        <!-- 展示当年对应的生肖Icon -->
        <component :is="yearIcon(String(year))" @click="handleYearIconClick(String(year))" class="chinese-zodiac">
        </component>
        <span>{{ year }}</span>
      </div>

      <div class="timeline-item-content">
        <div v-for="(articles, month) in item">
          <span class="month">
            {{ month }}
          </span>
          <div class="articles">
            <span v-for="article in articles" class="article">
              <ArticleSvg></ArticleSvg>
              <a :href="article.path" class="title" target="_blank">{{ article.title }}</a>
              <ArticleMetadata :article="article" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.arco-tag) {
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

:deep(.arco-icon) {
  width: 1em;
  height: 1em;
}

.timeline-wrap {
  margin-top: 18px;
  word-break: break-all;
}

.timeline-wrap .timeline-header {
  padding-bottom: 20px;
}

.timeline-wrap .timeline-header .icon {
  fill: var(--vp-c-text-2);
  height: 22px;
  width: 22px;
}

.timeline-wrap .timeline-header .content {
  position: relative;
  left: -20px;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
  border:none;
  background:none;

  .icon {
    width: 35px;
    height: 35px;
  }
}

.timeline-wrap .timeline-item {
  padding: 0 0 0 20px;
  border-left: 1px solid #5D9DF0;
  line-height: 1;
  position: relative;
}

.timeline-wrap .timeline-item:not(:last-child) {
  padding-bottom: 20px;
}

.timeline-wrap .timeline-item .year {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0.6em;
}

.timeline-wrap .timeline-item .timeline-item-time {
  margin-bottom: 12px;
  width: 200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-wrap .timeline-item .month {
  padding: 8px 0 8px 0;
  display: block;
  color: var(--vp-c-text-1);
  font-size: 16px;
  font-weight: bold;
  position: relative;
}

.timeline-wrap .timeline-item .timeline-item-content {
  font-size: 14px;
}

.timeline-wrap .timeline-item .articles {
  line-height: 1;
  padding-top: 7px;
}

.timeline-wrap .timeline-item .articles .article {
  display: block;
  position: relative;
  margin-bottom: 20px;
  line-height: 1.5;
}

.timeline-wrap .timeline-item .articles svg {
  position: absolute;
  left: -27.5px;
  top: 3.5px;
  background: #fff;
  border: 1px solid #84b9e5;
  border-radius: 50%;
  cursor: pointer;
}

.timeline-wrap .timeline-item .articles .article span {
  color: var(--vp-c-text-2);
}

.vp-doc a {
  font-weight: 400;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.vp-doc a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>
