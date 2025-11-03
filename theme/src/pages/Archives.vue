<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Tag } from 'ant-design-vue'
import ArticleMetadata from '../components/ArticleMetadata.vue'

import RatSvg from '../assets/svgs/chinese-zodiac/rat.svg';
import OxSvg from '../assets/svgs/chinese-zodiac/ox.svg';
import TigerSvg from '../assets/svgs/chinese-zodiac/tiger.svg';
import Rabbit from '../assets/svgs/chinese-zodiac/rabbit.svg';
import DragonSvg from '../assets/svgs/chinese-zodiac/dragon.svg';
import SnakeSvg from '../assets/svgs/chinese-zodiac/snake.svg';
import HorseSvg from '../assets/svgs/chinese-zodiac/horse.svg';
import GoatSvg from '../assets/svgs/chinese-zodiac/goat.svg';
import MonkeySvg from '../assets/svgs/chinese-zodiac/monkey.svg';
import RoosterSvg from '../assets/svgs/chinese-zodiac/rooster.svg';
import DogSvg from '../assets/svgs/chinese-zodiac/dog.svg';
import PigSvg from '../assets/svgs/chinese-zodiac/pig.svg';

import { goToArchivesPage } from '../utils/route';
import { getQueryParam, getChineseZodiac, countUniqueArticles } from '../utils/utils';
// @ts-ignore
import { data as articleData } from '@blog/docs/article.data'


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

const allArticles = computed(() => {
  const sorted = [...articleData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return sorted
})

const totalArticlesCount = computed(() => countUniqueArticles(allArticles.value))

const latestUpdated = computed(() => {
  if (!allArticles.value.length) {
    return null;
  }

  const parsed = new Date(allArticles.value[0].date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
});

const filteredLatestUpdated = computed(() => {
  if (!articles.value.length) {
    return null;
  }

  const parsed = new Date(articles.value[0].date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
});

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
      <header class="archives__hero">
        <div class="archives__hero-card">
          <a
            class="archives__hero-heading"
            href="https://github.com/jaylenchen"
            target="_blank"
            rel="noopener"
          >
            <img
              class="archives__hero-avatar"
              src="/svgs/avatar.svg"
              alt="jaylenchen avatar"
            />
            <span class="archives__hero-name">jaylenchen</span>
          </a>
          <p>
            用文字的灶台燃起思维的火花，用心在这思维的厨房里烹饪，就能够做出一道又道美味的佳肴，至于能有多美味，交给时间吧...
          </p>
          <div class="archives__hero-meta">
            <span class="meta-pill">累计 {{ totalArticlesCount }} 篇文章</span>
            <span v-if="latestUpdated" class="meta-pill">最近更新 {{ latestUpdated }}</span>
          </div>
        </div>
      </header>

      <aside class="archives__aside" aria-label="年份导航" v-if="archiveEntries.length">
        <div class="archives__aside-header">
          <p class="archives__aside-title">
            <template v-if="archiveType === ArchiveType.All">年份导航</template>
            <template v-else-if="archiveType === ArchiveType.Project">{{ condition.project }}</template>
            <template v-else-if="archiveType === ArchiveType.Tag">#{{ condition.tag }}</template>
            <template v-else-if="archiveType === ArchiveType.Year">{{ condition.year }}年</template>
          </p>
          <button 
            v-if="archiveType !== ArchiveType.All" 
            type="button"
            class="archives__clear-button"
            @click="resetCurrentPage()"
            aria-label="清除筛选"
          >
            ✕
          </button>
        </div>
        <div v-if="archiveType !== ArchiveType.All" class="archives__filter-stats">
          <span class="meta-pill">累计 {{ articles.length }} 篇文章</span>
          <span v-if="filteredLatestUpdated" class="meta-pill">最近更新 {{ filteredLatestUpdated }}</span>
        </div>
        <div class="archives__aside-buttons">
          <button
            v-for="yearEntry in archiveEntries"
            :key="yearEntry.year"
            type="button"
            class="archives__year-button"
            :class="{ 'is-active': (currentYearEntry && currentYearEntry.year === yearEntry.year) }"
            @click="selectYear(yearEntry.year)"
          >
            <span class="archives__year-label">{{ yearEntry.year }}</span>
            <span v-if="archiveType !== ArchiveType.All" class="archives__year-filter">
              <template v-if="archiveType === ArchiveType.Project">· {{ condition.project }}</template>
              <template v-else-if="archiveType === ArchiveType.Tag">· #{{ condition.tag }}</template>
            </span>
            <span class="archives__year-count">{{ yearEntry.count }}</span>
          </button>
        </div>
      </aside>

      <div class="archives__layout" v-if="archiveEntries.length">
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
                  <ArticleMetadata :article="article" />
                  <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                  <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
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
  max-width: 1200px;
  margin: 0 auto;
  color: var(--vp-c-text-1);
  width: 100%;
  padding: 1.5rem 1.5rem 2rem;
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

.archives__hero {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.archives__hero-kicker {
  align-self: flex-start;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(96, 135, 220, 0.14);
  color: rgba(60, 90, 170, 0.82);
}

.archives__hero-card {
  position: relative;
  padding: 2.4rem 2.1rem 2.6rem;
  border-radius: 8px;
  border: 1px solid rgba(120, 150, 220, 0.22);
  background: rgba(236, 242, 255, 0.92);
  box-shadow: 0 26px 46px rgba(110, 138, 220, 0.2);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow: hidden;
}

.archives__hero-card::before {
  display: none;
}


.archives__hero-heading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.95rem;
  text-decoration: none;
  color: inherit;
  border-bottom: none !important;
}

.archives__hero-heading:hover,
.archives__hero-heading:focus-visible {
  text-decoration: none;
  color: inherit;
  border-bottom: none !important;
}

.archives__hero-avatar {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: none;
  box-shadow: none;
  background: transparent;
}

.archives__hero-name {
  font-size: clamp(1.45rem, 3vw, 1.9rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
  color: rgba(48, 64, 110, 0.9);
}

.archives__hero-card p {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.85;
  color: rgba(55, 74, 122, 0.86);
}

.archives__hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.2rem;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: rgba(55, 78, 135, 0.9);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(120, 150, 220, 0.24);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

@media (max-width: 640px) {
  .archives {
    padding: 1.9rem 1.1rem 2.2rem;
  }

  .archives__hero-card {
    padding: 2rem 1.65rem 2.2rem;
    border-radius: 8px;
    gap: 1rem;
  }

  .archives__hero-avatar {
    width: 60px;
    height: 60px;
  }

  .archives__hero-name {
    font-size: 1.4rem;
  }

  .archives__hero-card p {
    font-size: 0.98rem;
    line-height: 1.75;
  }

  .meta-pill {
    font-size: 0.8rem;
    padding: 0.35rem 0.75rem;
  }
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
  flex-direction: column;
  gap: 2.5rem;
}

.archives__aside {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(120, 150, 220, 0.15);
}

.archives__aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.archives__aside-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.archives__clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 1px solid rgba(120, 150, 220, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--vp-c-text-2);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archives__clear-button:hover {
  border-color: var(--vp-c-brand-1);
  background: rgba(62, 99, 221, 0.12);
  color: var(--vp-c-brand-1);
}

.archives__filter-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
}

.archives__aside-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.archives__year-button {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.7);
  color: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.archives__year-button:hover {
  border-color: rgba(120, 150, 220, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.archives__year-button.is-active {
  border-color: var(--vp-c-brand-1, #3e63dd);
  background: rgba(62, 99, 221, 0.12);
  color: var(--vp-c-brand-1);
}

.archives__year-label {
  font-weight: 500;
}

.archives__year-filter {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-left: 0.25rem;
  margin-right: 0;
}

.archives__year-count {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: rgba(120, 150, 220, 0.12);
  border-radius: 50%;
  margin-left: 0.5rem;
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
  border-radius: 8px;
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
  gap: 0;
}

.archives__article-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.35rem 1.3rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(120, 150, 220, 0.18);
  box-shadow: 0 12px 26px rgba(120, 150, 220, 0.12);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  margin-bottom: 1.2rem;
}

.archives__article-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 32px rgba(120, 150, 220, 0.16);
}

.archives__article-item :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
}

.archives__article-excerpt {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--vp-c-text-2);
  overflow: hidden;
}

.archives__article-excerpt :deep(p) {
  margin: 0 0 0.9rem;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  line-height: 1.65;
}

.archives__article-excerpt :deep(p:last-child) {
  margin-bottom: 0;
}

.archives__article-excerpt :deep(h1) {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.archives__article-excerpt :deep(h2) {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  line-height: 1.4;
}

.archives__article-excerpt :deep(h3) {
  font-size: 0.95rem;
  font-weight: 650;
  margin: 0 0 0.45rem;
  line-height: 1.4;
}

.archives__article-excerpt :deep(h4),
.archives__article-excerpt :deep(h5),
.archives__article-excerpt :deep(h6) {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 0.4rem;
  line-height: 1.4;
}

.archives__article-excerpt :deep(strong) {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.archives__article-excerpt :deep(a) {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.archives__article-excerpt :deep(a:hover) {
  text-decoration: underline;
}

.archives__article-excerpt :deep(code) {
  background: rgba(120, 150, 220, 0.1);
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8em;
  color: var(--vp-c-brand-1);
}

.archives__article-excerpt :deep(ul),
.archives__article-excerpt :deep(ol) {
  margin: 0 0 0.9rem;
  padding-left: 1.5rem;
  font-size: 0.875rem;
}

.archives__article-excerpt :deep(li) {
  margin: 0.3rem 0;
}

.archives__article-excerpt :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 0.6rem 0;
}

.archives__article-excerpt :deep(pre) {
  margin: 0.6rem 0;
  padding: 0.65rem;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.75rem;
}

.archives__article-excerpt :deep(blockquote) {
  margin: 0.6rem 0;
  padding: 0.5rem 0.65rem;
  border-left: 3px solid rgba(120, 150, 220, 0.3);
  background: rgba(120, 150, 220, 0.05);
  border-radius: 4px;
  font-size: 0.875rem;
}

.archives__article-read-more {
  align-self: flex-start;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.archives__article-read-more:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.archives__empty {
  margin: 0;
  font-size: 0.95rem;
  color: var(--vp-c-text-3);
  text-align: center;
}

@media (max-width: 860px) {
  .archives {
    max-width: 100%;
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .archives__layout {
    gap: 2rem;
  }

  .archives__content {
    gap: 2rem;
  }

  .archives__aside-buttons {
    gap: 0.5rem;
  }

  .archives__year-button {
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
  }
}

@media (max-width: 600px) {
  .archives {
    max-width: 100%;
    padding: 1.5rem 1.1rem 2.2rem;
  }

  .archives__month {
    padding: 0.85rem 0.95rem;
  }
}
</style>
