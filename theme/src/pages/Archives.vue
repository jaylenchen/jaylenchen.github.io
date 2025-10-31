<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Tag } from 'ant-design-vue'
import ArticleMetadata from '@blog/theme/global/components/ArticleMetadata.vue'

import ArchiveSvg from '@blog/theme/assets/svgs/archive.svg';
import RatSvg from '@blog/theme/assets/svgs/chinese-zodiac/rat.svg';
import OxSvg from '@blog/theme/assets/svgs/chinese-zodiac/ox.svg';
import TigerSvg from '@blog/theme/assets/svgs/chinese-zodiac/tiger.svg';
import Rabbit from '@blog/theme/assets/svgs/chinese-zodiac/rabbit.svg';
import DragonSvg from '@blog/theme/assets/svgs/chinese-zodiac/dragon.svg';
import SnakeSvg from '@blog/theme/assets/svgs/chinese-zodiac/snake.svg';
import HorseSvg from '@blog/theme/assets/svgs/chinese-zodiac/horse.svg';
import GoatSvg from '@blog/theme/assets/svgs/chinese-zodiac/goat.svg';
import MonkeySvg from '@blog/theme/assets/svgs/chinese-zodiac/monkey.svg';
import RoosterSvg from '@blog/theme/assets/svgs/chinese-zodiac/rooster.svg';
import DogSvg from '@blog/theme/assets/svgs/chinese-zodiac/dog.svg';
import PigSvg from '@blog/theme/assets/svgs/chinese-zodiac/pig.svg';

import { goToArchivesPage } from '@blog/theme/utils/route';
import { getQueryParam, getChineseZodiac } from '@blog/theme/utils/utils';
// @ts-ignore
import { data as articleData } from '../../../config/article.data'


const yearSvgMap = {
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
} as const;

const defaultYearIcon = yearSvgMap.rat;

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
const activeYear = ref<string | null>(null);
const contentEl = ref<HTMLElement | null>(null);
let sectionObserver: IntersectionObserver | null = null;

function normalizeYear(value: string | number | undefined | null) {
  if (value === undefined || value === null) {
    return undefined;
  }

  const numericYear = Number(String(value).replace(/[^\d]/g, ''));
  return Number.isFinite(numericYear) && numericYear > 0 ? numericYear : undefined;
}

function yearIcon(year: string | number) {
  const normalizedYear = normalizeYear(year);
  if (!normalizedYear) {
    return defaultYearIcon;
  }

  const zodiac = getChineseZodiac(normalizedYear) as keyof typeof yearSvgMap;
  return yearSvgMap[zodiac] ?? defaultYearIcon;
}

function handleYearIconClick(newYear: string | number) {
  const normalizedYear = normalizeYear(newYear);
  if (!normalizedYear) {
    goToArchivesPage();
    return;
  }

  goToArchivesPage('year', String(normalizedYear))
}

function resetCurrentPage() {
  goToArchivesPage()
}

function selectYear(yearValue: string) {
  activeYear.value = yearValue;
}

const currentYearEntry = computed(() => {
  if (!archiveEntries.value.length) {
    return null;
  }

  return (
    archiveEntries.value.find((entry) => entry.year === activeYear.value) ??
    archiveEntries.value[0]
  );
});

function scrollToYear(yearValue: string) {
  activeYear.value = yearValue;
  const targetId = yearValue; // No longer need to normalize year for ID
  const target = contentEl.value?.querySelector<HTMLElement>(`#${targetId}`);
  if (target && contentEl.value) {
    const top = target.offsetTop - 12;
    contentEl.value.scrollTo({ top, behavior: 'smooth' });
  }
}

function setupSectionObserver() {
  sectionObserver?.disconnect();
  if (!contentEl.value) {
    return;
  }

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length > 0) {
        const yearValue = visible[0].target.getAttribute('data-archive-year');
        if (yearValue) {
          activeYear.value = yearValue;
        }
      }
    },
    {
      root: contentEl.value,
      threshold: [0.3, 0.5, 0.7]
    }
  );

  const sections = contentEl.value.querySelectorAll<HTMLElement>('[data-archive-year]');
  sections.forEach((section) => sectionObserver?.observe(section));
}


/**
 * 初始化时间轴
 */
function initTimeLine() {
  archiveData.value = {};

  let filteredArticles = [...articleData];

  if (condition.project) {
    archiveType.value = ArchiveType.Project;
    filteredArticles = filteredArticles.filter((article) => project.value && article.project && article.project.includes(project.value));
  }
  else if (condition.tag) {
    archiveType.value = ArchiveType.Tag;
    filteredArticles = filteredArticles.filter((article) => tag.value && article.tags && article.tags.includes(tag.value));
  }
  else if (condition.year) {
    archiveType.value = ArchiveType.Year;
    filteredArticles = filteredArticles.filter((article) => year.value && article.date && (new Date(article.date).getFullYear()) === +year.value);
  } else {
    archiveType.value = ArchiveType.All;
  }

  articles.value = filteredArticles;

  if (!articles.value.length) {
    return;
  }

  articles.value.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (let i = 0; i < articles.value.length; i++) {
    const article = articles.value?.[i];
    const date = new Date(article.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const yearKey = `${date.getFullYear()}年`;
    const monthKey = `${date.getMonth() + 1}月`;

    if (!archiveData.value[yearKey]) {
      archiveData.value[yearKey] = {};
    }

    if (!archiveData.value[yearKey][monthKey]) {
      archiveData.value[yearKey][monthKey] = [];
    }

    archiveData.value[yearKey][monthKey].push(article);
  }
}

const archiveEntries = computed(() => {
  return Object.keys(archiveData.value)
    .sort((a, b) => {
      const yearA = normalizeYear(a) ?? 0;
      const yearB = normalizeYear(b) ?? 0;
      return yearB - yearA;
    })
    .map((yearKey) => {
      const months = archiveData.value[yearKey];
      const monthEntries = Object.keys(months)
        .sort((a, b) => {
          const monthA = Number(String(a).replace(/[^\d]/g, '')) || 0;
          const monthB = Number(String(b).replace(/[^\d]/g, '')) || 0;
          return monthB - monthA;
        })
        .map((monthKey) => ({ month: monthKey, articles: months[monthKey] }));

      const articleCount = monthEntries.reduce((total, monthEntry) => total + monthEntry.articles.length, 0);

      return { year: yearKey, months: monthEntries, count: articleCount };
    });
});

onMounted(() => {
  initTimeLine();
});

watch(
  () => archiveEntries.value,
  (entries) => {
    if (!entries.length) {
      activeYear.value = null;
      return;
    }

    if (!activeYear.value || !entries.some((item) => item.year === activeYear.value)) {
      activeYear.value = entries[0].year;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="archives">
    <div class="archives__inner">
      <header class="archives__header">
        <p class="archives__kicker">archives</p>
        <div class="archives__filter">
          <Tag v-if="archiveType === ArchiveType.Project" class="filter-tag" closable @close="resetCurrentPage">
            <template #icon>
              <ArchiveSvg></ArchiveSvg>
            </template>
            {{ project }}项目 （共 {{ articles.length }} 篇）文章
          </Tag>

          <Tag v-else-if="archiveType === ArchiveType.Tag" class="filter-tag" closable @close="resetCurrentPage">
            <template #icon>
              <ArchiveSvg></ArchiveSvg>
            </template>
            {{ tag }}标签 （共 {{ articles.length }} 篇）文章
          </Tag>

          <Tag v-else-if="archiveType === ArchiveType.Year" class="filter-tag" closable @close="resetCurrentPage">
            <ArchiveSvg></ArchiveSvg>
            {{ year }}年 （共 {{ articles.length }} 篇）文章
          </Tag>

          <Tag v-else class="filter-tag">
            <ArchiveSvg></ArchiveSvg>
            全部文章（共 {{ articles.length }} 篇）
          </Tag>
        </div>
      </header>

      <div class="archives__layout" v-if="archiveEntries.length">
        <aside class="archives__aside" aria-label="年份导航">
          <p class="archives__aside-title">年份</p>
          <button
            v-for="yearEntry in archiveEntries"
            :key="yearEntry.year"
            type="button"
            class="archives__year-button"
            :class="{ 'is-active': (currentYearEntry && currentYearEntry.year === yearEntry.year) }"
            @click="selectYear(yearEntry.year)"
          >
            <span class="archives__year-label">{{ yearEntry.year }}</span>
            <span class="archives__year-count">{{ yearEntry.count }}</span>
          </button>
        </aside>

        <section class="archives__content" v-if="currentYearEntry">
          <header class="archives__content-header">
            <component
              :is="yearIcon(currentYearEntry.year)"
              @click="handleYearIconClick(currentYearEntry.year)"
              class="archives__year-icon"
            />
            <div class="archives__block-meta">
              <h2>{{ currentYearEntry.year }}</h2>
              <p>{{ currentYearEntry.count }} 篇文章</p>
            </div>
          </header>

          <div class="archives__month-list">
            <div class="archives__month" v-for="monthEntry in currentYearEntry.months" :key="monthEntry.month">
              <div class="archives__month-header">
                <span class="archives__month-name">{{ monthEntry.month }}</span>
                <span class="archives__month-total">{{ monthEntry.articles.length }} 篇</span>
              </div>

              <ul class="archives__article-list">
                <li v-for="article in monthEntry.articles" :key="article.path" class="archives__article-item">
                  <a :href="article.path" target="_self" class="archives__article-link">{{ article.title }}</a>
                  <ArticleMetadata :article="article" />
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <p v-else class="archives__empty">暂无文章记录。</p>
    </div>
  </div>
</template>

<style scoped>
.archives {
  max-width: 920px;
  margin: 0 auto;
  color: var(--vp-c-text-1);
  width: 100%;
  padding: 2.4rem 1.5rem 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
}

.archives__inner {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.archives__header {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.archives__kicker {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.archives__filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: inherit;
  font-size: 0.85rem;
  line-height: 1;
  padding: 0.45rem 0.9rem;
}

.filter-tag svg {
  width: 1rem;
  height: 1rem;
}

.archives__layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex-direction: row-reverse;
}

.archives__aside {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.archives__aside-title {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.archives__year-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.55rem 0.8rem;
  border-radius: 0.85rem;
  border: 1px solid transparent;
  background: var(--vp-c-bg);
  color: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.archives__year-button.is-active {
  border-color: var(--vp-c-brand-1, #3e63dd);
  background: rgba(62, 99, 221, 0.12);
}

.archives__year-label {
  font-weight: 500;
}

.archives__year-count {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.archives__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}

.archives__content-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.archives__year-icon {
  width: 46px;
  height: 46px;
  cursor: pointer;
}

.archives__block-meta h2 {
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.1rem);
}

.archives__block-meta p {
  margin: 0.35rem 0 0;
  font-size: 0.9rem;
  color: var(--vp-c-text-3);
}

.archives__month-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.archives__month {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.05rem 1.2rem;
  border-radius: 1.1rem;
  background: linear-gradient(
    180deg,
    rgba(250, 252, 255, 0.92) 0%,
    rgba(238, 245, 255, 0.88) 45%,
    rgba(232, 242, 255, 0.85) 100%
  );
  border: 1px solid rgba(120, 150, 220, 0.2);
  box-shadow: 0 16px 34px rgba(120, 150, 220, 0.12);
  backdrop-filter: blur(8px);
}

.archives__month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.archives__month-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  letter-spacing: 0.08em;
}

.archives__month-total {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.archives__article-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.archives__article-item {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.75rem 0.85rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(120, 150, 220, 0.18);
  box-shadow: 0 12px 26px rgba(120, 150, 220, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.archives__article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(120, 150, 220, 0.16);
}

.archives__article-link {
  color: inherit;
  text-decoration: none;
  font-size: 0.95rem;
  line-height: 1.5;
}

.archives__article-link:hover {
  color: var(--vp-c-brand-1, #3e63dd);
}

.archives__article-item :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
}

.archives__empty {
  margin: 0;
  font-size: 0.95rem;
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 860px) {
  .archives {
    padding: 3.5rem 1.25rem 2.5rem;
  }

  .archives__layout {
    flex-direction: column;
    gap: 2rem;
  }

  .archives__aside {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .archives__aside-title {
    width: 100%;
  }

  .archives__content {
    gap: 2rem;
  }
}

@media (max-width: 600px) {
  .archives {
    padding: 3rem 1.1rem 2.2rem;
  }

  .archives__month {
    padding: 0.85rem 0.95rem;
  }
}
</style>
