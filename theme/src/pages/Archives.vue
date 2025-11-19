<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch, nextTick, defineAsyncComponent } from 'vue'
import { Tag } from 'ant-design-vue'
import ArticleMetadata from '../components/ArticleMetadata.vue'

import { goToArchivesPage } from '../utils/route';
import { getQueryParam, getChineseZodiac, countUniqueArticles } from '../utils/utils';
// @ts-ignore
import { data as articleData } from '@blog/docs/article.data'

// 使用异步组件优化 SVG 加载（代码分割）
const RatSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/rat.svg'));
const OxSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/ox.svg'));
const TigerSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/tiger.svg'));
const Rabbit = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/rabbit.svg'));
const DragonSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/dragon.svg'));
const SnakeSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/snake.svg'));
const HorseSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/horse.svg'));
const GoatSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/goat.svg'));
const MonkeySvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/monkey.svg'));
const RoosterSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/rooster.svg'));
const DogSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/dog.svg'));
const PigSvg = defineAsyncComponent(() => import('../assets/svgs/chinese-zodiac/pig.svg'));
const ProjectSvg = defineAsyncComponent(() => import('../assets/svgs/project.svg'));

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
const isLoading = ref(true); // 加载状态
// 初始化时使用空值，在 onMounted 中从 URL 读取（避免 SSR 错误）
const condition = reactive({
  project: '',
  tag: '',
  year: ''
})
const project = ref('');
const tag = ref('');
const year = ref('');
const activeYear = ref<string | null>(null);
const contentEl = ref<HTMLElement | null>(null);
let sectionObserver: IntersectionObserver | null = null;

// 分页相关 - 每个年份独立分页
const yearPages = ref<Record<string, number>>({}); // 存储每个年份的当前页码
const articlesPerPage = 5; // 每页显示5篇文章

// 项目筛选时的统一分页
const projectPage = ref(1); // 项目筛选时的当前页码

// 全部文章的统一分页
const allArticlesPage = ref(1); // 全部文章时的当前页码

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
  goToArchivesPage('year', yearValue.replace('年', ''));
  // 滚动到 aside 位置
  nextTick(() => {
    setTimeout(() => {
      scrollToAside();
    }, 300);
  });
}

function selectAll() {
  goToArchivesPage();
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

// 获取某个年份的所有文章（扁平化，不分月份）
function getYearArticles(yearEntry: typeof archiveEntries.value[0]) {
  return yearEntry.months.flatMap(month => month.articles);
}

// 获取某个年份分页后的文章
function getPaginatedYearArticles(yearEntry: typeof archiveEntries.value[0]) {
  const allArticles = getYearArticles(yearEntry);
  const currentPage = yearPages.value[yearEntry.year] || 1;
  const start = (currentPage - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return allArticles.slice(start, end);
}

// 获取某个年份的总页数
function getYearTotalPages(yearEntry: typeof archiveEntries.value[0]) {
  const allArticles = getYearArticles(yearEntry);
  return Math.ceil(allArticles.length / articlesPerPage);
}

// 获取项目筛选时的所有文章（合并所有年份）
function getAllProjectArticles() {
  return archiveEntries.value.flatMap(yearEntry => getYearArticles(yearEntry));
}

// 获取项目筛选时分页后的文章
function getPaginatedProjectArticles() {
  const allArticles = getAllProjectArticles();
  const start = (projectPage.value - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return allArticles.slice(start, end);
}

// 获取项目筛选时的总页数
function getProjectTotalPages() {
  const allArticles = getAllProjectArticles();
  return Math.ceil(allArticles.length / articlesPerPage);
}

// 获取全部文章（合并所有年份）
function getAllArticles() {
  return archiveEntries.value.flatMap(yearEntry => getYearArticles(yearEntry));
}

// 获取全部文章分页后的文章
function getPaginatedAllArticles() {
  const allArticles = getAllArticles();
  const start = (allArticlesPage.value - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  return allArticles.slice(start, end);
}

// 获取全部文章的总页数
function getAllArticlesTotalPages() {
  const allArticles = getAllArticles();
  return Math.ceil(allArticles.length / articlesPerPage);
}

// 生成分页页码数组（智能分页，避免无限扩展）
function getPaginationPages(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    // 如果总页数小于等于7，显示所有页码
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages: (number | string)[] = [];
  
  // 总是显示第一页
  pages.push(1);
  
  if (currentPage <= 3) {
    // 当前页在前3页，显示前5页
    for (let i = 2; i <= 5; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    // 当前页在后3页，显示后5页
    pages.push('...');
    for (let i = totalPages - 4; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 当前页在中间，显示当前页前后各2页
    pages.push('...');
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  }
  
  return pages;
}

// 判断是否应该显示某个年份的section（按标签筛选时）
// 如果某个年份已经翻到第二页或更后面，则隐藏该年份之前（更早）的所有年份
function shouldShowYearSection(yearEntry: typeof archiveEntries.value[0]): boolean {
  // 如果不是按标签筛选，显示所有年份
  if (archiveType.value !== ArchiveType.Tag) {
    return true;
  }
  
  // 找到当前年份在列表中的索引
  // archiveEntries 是从新到旧排序的（2025, 2024, 2023...）
  const currentYearIndex = archiveEntries.value.findIndex(entry => entry.year === yearEntry.year);
  if (currentYearIndex === -1) return true;
  
  // 检查该年份之后（更新的年份）是否有年份已经翻到第二页或更后面
  // 如果有，说明用户已经看过了，应该隐藏当前年份（更早的年份）
  for (let i = 0; i < currentYearIndex; i++) {
    const newerYear = archiveEntries.value[i];
    const newerYearPage = yearPages.value[newerYear.year] || 1;
    if (newerYearPage > 1) {
      // 如果更新的年份已经翻到第二页，说明用户已经看过了，隐藏当前年份（更早的年份）
      return false;
    }
  }
  
  return true;
}

// 分页函数
function goToYearPage(year: string, page: number) {
  const yearEntry = archiveEntries.value.find(e => e.year === year);
  if (!yearEntry) return;
  
  const totalPages = getYearTotalPages(yearEntry);
  if (page >= 1 && page <= totalPages) {
    yearPages.value[year] = page;
    // 滚动到对应年份的标题位置
    nextTick(() => {
      setTimeout(() => {
        // 查找年份 section
        if (typeof document === 'undefined') return;
        const yearSection = document.querySelector<HTMLElement>(`[data-archive-year="${year}"]`);
        if (!yearSection) {
          console.warn(`Year section not found for year: ${year}`);
          return;
        }
        
        // 查找年份标题 header
        const yearHeader = yearSection.querySelector<HTMLElement>('.archives__content-header');
        if (!yearHeader) {
          console.warn(`Year header not found for year: ${year}`);
          return;
        }
        
        // 获取导航栏高度
        const navbar = document.querySelector<HTMLElement>('.VPNavBar');
        const localNav = document.querySelector<HTMLElement>('.VPLocalNav');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const localNavHeight = localNav ? localNav.offsetHeight : 0;
        const totalNavHeight = navbarHeight + localNavHeight;
        
        // 计算元素相对于文档顶部的绝对位置
        let elementTop = 0;
        let element = yearHeader as HTMLElement | null;
        while (element) {
          elementTop += element.offsetTop;
          element = element.offsetParent as HTMLElement | null;
        }
        
        // 计算目标滚动位置：元素顶部 - 导航栏高度
        const targetPosition = elementTop - totalNavHeight;
        
        // 滚动到目标位置（仅在客户端执行）
        if (typeof window !== 'undefined') {
          window.scrollTo({ 
            top: Math.max(0, targetPosition), 
            behavior: 'smooth' 
          });
        }
      }, 150);
    });
  }
}

function prevYearPage(year: string) {
  const currentPage = yearPages.value[year] || 1;
  if (currentPage > 1) {
    goToYearPage(year, currentPage - 1);
  }
}

function nextYearPage(year: string) {
  const yearEntry = archiveEntries.value.find(e => e.year === year);
  if (!yearEntry) return;
  const currentPage = yearPages.value[year] || 1;
  const totalPages = getYearTotalPages(yearEntry);
  if (currentPage < totalPages) {
    goToYearPage(year, currentPage + 1);
  }
}

// 项目分页函数 - 滚动到 aside 位置
function goToProjectPage(page: number) {
  const totalPages = getProjectTotalPages();
  if (page >= 1 && page <= totalPages) {
    projectPage.value = page;
    // 滚动到 aside 位置
    nextTick(() => {
      setTimeout(() => {
        scrollToAside();
      }, 150);
    });
  }
}

function prevProjectPage() {
  if (projectPage.value > 1) {
    goToProjectPage(projectPage.value - 1);
  }
}

function nextProjectPage() {
  const totalPages = getProjectTotalPages();
  if (projectPage.value < totalPages) {
    goToProjectPage(projectPage.value + 1);
  }
}

// 全部文章分页函数 - 滚动到 aside 位置
function goToAllArticlesPage(page: number) {
  const totalPages = getAllArticlesTotalPages();
  if (page >= 1 && page <= totalPages) {
    allArticlesPage.value = page;
    // 滚动到 aside 位置
    nextTick(() => {
      setTimeout(() => {
        scrollToAside();
      }, 150);
    });
  }
}

function prevAllArticlesPage() {
  if (allArticlesPage.value > 1) {
    goToAllArticlesPage(allArticlesPage.value - 1);
  }
}

function nextAllArticlesPage() {
  const totalPages = getAllArticlesTotalPages();
  if (allArticlesPage.value < totalPages) {
    goToAllArticlesPage(allArticlesPage.value + 1);
  }
}

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
    // 重置项目分页
    projectPage.value = 1;
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
    // 重置全部文章分页
    allArticlesPage.value = 1;
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
  // 在客户端初始化 URL 参数（避免 SSR 错误）
  if (typeof window !== 'undefined') {
    const projectParam = getQueryParam('project')?.trim();
    const tagParam = getQueryParam('tag')?.trim();
    const yearParam = getQueryParam('year')?.trim();
    
    condition.project = projectParam || '';
    condition.tag = tagParam || '';
    condition.year = yearParam || '';
    project.value = projectParam || '';
    tag.value = tagParam || '';
    year.value = yearParam || '';
  }
  
  initTimeLine();
  
  // 数据加载完成后，延迟一小段时间再隐藏 loading（确保渲染完成）
  nextTick(() => {
    setTimeout(() => {
      isLoading.value = false;
    }, 100);
  });
  
  // 如果是项目筛选或年份筛选，滚动到 aside 位置
  if (archiveType.value === ArchiveType.Project || archiveType.value === ArchiveType.Year) {
    nextTick(() => {
      setTimeout(() => {
        scrollToAside();
      }, 300);
    });
  }
});

// 滚动到 aside 位置的函数
function scrollToAside() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const aside = document.querySelector<HTMLElement>('.archives__aside');
  if (!aside) {
    return;
  }
  
  // 获取导航栏高度
  const navbar = document.querySelector<HTMLElement>('.VPNavBar');
  const localNav = document.querySelector<HTMLElement>('.VPLocalNav');
  const navbarHeight = navbar ? navbar.offsetHeight : 0;
  const localNavHeight = localNav ? localNav.offsetHeight : 0;
  const totalNavHeight = navbarHeight + localNavHeight;
  
  // 计算元素相对于文档顶部的绝对位置
  let elementTop = 0;
  let element = aside as HTMLElement | null;
  while (element) {
    elementTop += element.offsetTop;
    element = element.offsetParent as HTMLElement | null;
  }
  
  // 计算目标滚动位置：元素顶部 - 导航栏高度 - 额外偏移（让界面更美观）
  const extraOffset = 8; // 减少8px，让 aside 显示得更美观
  const targetPosition = elementTop - totalNavHeight - extraOffset;
  
  // 滚动到目标位置（仅在客户端执行）
  if (typeof window !== 'undefined') {
    window.scrollTo({ 
      top: Math.max(0, targetPosition), 
      behavior: 'smooth' 
    });
  }
}

watch(
  () => archiveEntries.value,
  (entries) => {
    if (!entries.length) {
      activeYear.value = null;
      return;
    }

    // 只有在有年份参数时才设置 activeYear，否则保持为 null（表示显示全部）
    if (condition.year) {
    if (!activeYear.value || !entries.some((item) => item.year === activeYear.value)) {
      activeYear.value = entries[0].year;
    }
    } else {
      activeYear.value = null;
    }
    
    // 初始化每个年份的页码为1
    entries.forEach(entry => {
      if (!yearPages.value[entry.year]) {
        yearPages.value[entry.year] = 1;
      }
    });
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
          <div class="archives__aside-header-left">
          <p class="archives__aside-title">
            <template v-if="archiveType === ArchiveType.All">年份导航</template>
              <template v-else-if="archiveType === ArchiveType.Project">
                <component :is="ProjectSvg" class="archives__project-icon" />
                {{ condition.project }}
              </template>
            <template v-else-if="archiveType === ArchiveType.Tag">#{{ condition.tag }}</template>
              <template v-else-if="archiveType === ArchiveType.Year">
                <component :is="yearIcon(condition.year)" class="archives__project-icon" />
                {{ condition.year }}年
              </template>
          </p>
            <div v-if="archiveType !== ArchiveType.All" class="archives__filter-stats">
              <span class="meta-pill">累计 {{ articles.length }} 篇文章</span>
              <span v-if="filteredLatestUpdated" class="meta-pill">最近更新 {{ filteredLatestUpdated }}</span>
            </div>
          </div>
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
        <div v-if="archiveType === ArchiveType.All" class="archives__aside-buttons">
          <button
            type="button"
            class="archives__year-button"
            :class="{ 'is-active': archiveType === ArchiveType.All && !condition.year }"
            @click="selectAll()"
          >
            <span class="archives__year-label">全部</span>
            <span class="archives__year-count">{{ totalArticlesCount }}</span>
          </button>
          <button
            v-for="yearEntry in archiveEntries"
            :key="yearEntry.year"
            type="button"
            class="archives__year-button"
            :class="{ 'is-active': condition.year && currentYearEntry && currentYearEntry.year === yearEntry.year }"
            @click="selectYear(yearEntry.year)"
          >
            <component :is="yearIcon(yearEntry.year)" class="archives__year-button-icon" />
            <span class="archives__year-label">{{ yearEntry.year }}</span>
            <span class="archives__year-count">{{ yearEntry.count }}</span>
          </button>
        </div>
      </aside>

      <!-- Loading 状态：当数据加载中或文章列表为空时显示 -->
      <div v-if="isLoading || !archiveEntries.length" class="archives__loading">
        <div class="archives__loading-spinner"></div>
        <p class="archives__loading-text">加载中...</p>
      </div>

      <div class="archives__layout" v-if="!isLoading && archiveEntries.length" ref="contentEl">
        <!-- 标签筛选：显示年份标题组块和按年份分页 -->
        <template v-if="archiveType === ArchiveType.Tag">
          <section 
            v-for="yearEntry in archiveEntries" 
            :key="yearEntry.year" 
            class="archives__content"
            :data-archive-year="yearEntry.year"
            v-show="shouldShowYearSection(yearEntry)"
          >
            <header class="archives__content-header">
              <component
                :is="yearIcon(yearEntry.year)"
                @click="handleYearIconClick(yearEntry.year)"
                class="archives__year-icon"
              />
              <div class="archives__block-meta">
                <h2>{{ yearEntry.year }}</h2>
                <p>{{ yearEntry.count }} 篇文章</p>
              </div>
            </header>

            <ul class="archives__article-list">
              <li v-for="article in getPaginatedYearArticles(yearEntry)" :key="article.path" class="archives__article-item">
                <ArticleMetadata :article="article" />
                <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
              </li>
            </ul>

            <!-- 年份分页器 -->
            <div v-if="getYearTotalPages(yearEntry) > 1" class="archives__year-pagination">
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': (yearPages[yearEntry.year] || 1) === 1 }"
                @click="prevYearPage(yearEntry.year)"
                :disabled="(yearPages[yearEntry.year] || 1) === 1"
                aria-label="上一页"
              >
                ‹
              </button>
              <div class="archives__pagination-pages">
                <template v-for="(page, index) in getPaginationPages(yearPages[yearEntry.year] || 1, getYearTotalPages(yearEntry))" :key="index">
                  <button
                    v-if="typeof page === 'number'"
                    type="button"
                    class="archives__pagination-page"
                    :class="{ 'is-active': page === (yearPages[yearEntry.year] || 1) }"
                    @click="goToYearPage(yearEntry.year, page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="archives__pagination-ellipsis">{{ page }}</span>
                </template>
              </div>
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': (yearPages[yearEntry.year] || 1) === getYearTotalPages(yearEntry) }"
                @click="nextYearPage(yearEntry.year)"
                :disabled="(yearPages[yearEntry.year] || 1) === getYearTotalPages(yearEntry)"
                aria-label="下一页"
              >
                ›
              </button>
            </div>
          </section>
        </template>

        <!-- 项目筛选：不显示年份标题组块，只显示合并后的文章列表和统一分页 -->
        <template v-else-if="archiveType === ArchiveType.Project">
          <section class="archives__content">
            <ul class="archives__article-list">
              <li v-for="article in getPaginatedProjectArticles()" :key="article.path" class="archives__article-item">
                <ArticleMetadata :article="article" />
                <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
              </li>
            </ul>

            <!-- 项目统一分页器 -->
            <div v-if="getProjectTotalPages() > 1" class="archives__year-pagination">
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': projectPage === 1 }"
                @click="prevProjectPage()"
                :disabled="projectPage === 1"
                aria-label="上一页"
              >
                ‹
              </button>
              <div class="archives__pagination-pages">
                <template v-for="(page, index) in getPaginationPages(projectPage, getProjectTotalPages())" :key="index">
                  <button
                    v-if="typeof page === 'number'"
                    type="button"
                    class="archives__pagination-page"
                    :class="{ 'is-active': page === projectPage }"
                    @click="goToProjectPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="archives__pagination-ellipsis">{{ page }}</span>
                </template>
              </div>
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': projectPage === getProjectTotalPages() }"
                @click="nextProjectPage()"
                :disabled="projectPage === getProjectTotalPages()"
                aria-label="下一页"
              >
                ›
              </button>
            </div>
          </section>
        </template>

        <!-- 全部文章：不显示年份标题组块，只显示合并后的文章列表和统一分页 -->
        <template v-else-if="archiveType === ArchiveType.All">
          <section class="archives__content">
            <ul class="archives__article-list">
              <li v-for="article in getPaginatedAllArticles()" :key="article.path" class="archives__article-item">
                <ArticleMetadata :article="article" />
                <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
              </li>
            </ul>

            <!-- 全部文章统一分页器 -->
            <div v-if="getAllArticlesTotalPages() > 1" class="archives__year-pagination">
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': allArticlesPage === 1 }"
                @click="prevAllArticlesPage()"
                :disabled="allArticlesPage === 1"
                aria-label="上一页"
              >
                ‹
              </button>
              <div class="archives__pagination-pages">
                <template v-for="(page, index) in getPaginationPages(allArticlesPage, getAllArticlesTotalPages())" :key="index">
                  <button
                    v-if="typeof page === 'number'"
                    type="button"
                    class="archives__pagination-page"
                    :class="{ 'is-active': page === allArticlesPage }"
                    @click="goToAllArticlesPage(page)"
                  >
                    {{ page }}
                  </button>
                  <span v-else class="archives__pagination-ellipsis">{{ page }}</span>
                </template>
              </div>
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': allArticlesPage === getAllArticlesTotalPages() }"
                @click="nextAllArticlesPage()"
                :disabled="allArticlesPage === getAllArticlesTotalPages()"
                aria-label="下一页"
              >
                ›
              </button>
            </div>
          </section>
        </template>

        <!-- 年份筛选：显示年份标题组块和按年份分页 -->
        <section v-else-if="archiveType === ArchiveType.Year && currentYearEntry" class="archives__content" :data-archive-year="currentYearEntry.year">
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

              <ul class="archives__article-list">
            <li v-for="article in getPaginatedYearArticles(currentYearEntry)" :key="article.path" class="archives__article-item">
                  <ArticleMetadata :article="article" />
                  <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                  <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
                </li>
              </ul>

          <!-- 年份分页器 -->
          <div v-if="getYearTotalPages(currentYearEntry) > 1" class="archives__year-pagination">
            <button 
              type="button"
              class="archives__pagination-btn"
              :class="{ 'is-disabled': (yearPages[currentYearEntry.year] || 1) === 1 }"
              @click="prevYearPage(currentYearEntry.year)"
              :disabled="(yearPages[currentYearEntry.year] || 1) === 1"
              aria-label="上一页"
            >
              ‹
            </button>
            <div class="archives__pagination-pages">
              <template v-for="(page, index) in getPaginationPages(yearPages[currentYearEntry.year] || 1, getYearTotalPages(currentYearEntry))" :key="index">
                <button
                  v-if="typeof page === 'number'"
                  type="button"
                  class="archives__pagination-page"
                  :class="{ 'is-active': page === (yearPages[currentYearEntry.year] || 1) }"
                  @click="goToYearPage(currentYearEntry.year, page)"
                >
                  {{ page }}
                </button>
                <span v-else class="archives__pagination-ellipsis">{{ page }}</span>
              </template>
            </div>
            <button 
              type="button"
              class="archives__pagination-btn"
              :class="{ 'is-disabled': (yearPages[currentYearEntry.year] || 1) === getYearTotalPages(currentYearEntry) }"
              @click="nextYearPage(currentYearEntry.year)"
              :disabled="(yearPages[currentYearEntry.year] || 1) === getYearTotalPages(currentYearEntry)"
              aria-label="下一页"
            >
              ›
            </button>
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
  background: rgba(24, 144, 255, 0.14);
  color: rgba(60, 90, 170, 0.82);
}

.archives__hero-card {
  position: relative;
  padding: 2.4rem 2.1rem 2.6rem;
  border-radius: 8px;
  border: 1px solid rgba(24, 144, 255, 0.22);
  background: rgba(240, 248, 255, 0.92);
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
  justify-content: flex-end;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 4px;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: rgba(55, 78, 135, 0.9);
  background: rgba(240, 248, 255, 0.72);
  border: 1px solid rgba(24, 144, 255, 0.24);
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
  border-bottom: 1px solid rgba(24, 144, 255, 0.15);
}

.archives__aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.archives__aside-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex: 1;
}

.archives__aside-title {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.archives__project-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--vp-c-text-3);
}

.archives__clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 1px solid rgba(24, 144, 255, 0.25);
  border-radius: 999px;
  background: rgba(240, 248, 255, 0.7);
  color: var(--vp-c-text-2);
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archives__clear-button:hover {
  border-color: var(--vp-c-brand-1);
  background: rgba(24, 144, 255, 0.12);
  color: var(--vp-c-brand-1);
}

.archives__filter-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin: 0;
}

.archives__aside-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.archives__year-button {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(240, 248, 255, 0.7);
  color: inherit;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.archives__year-button-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  display: block;
}

.archives__year-button:hover {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(240, 248, 255, 0.9);
}

.archives__year-button.is-active {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(24, 144, 255, 0.12);
  color: var(--vp-c-brand-1);
}

.archives__year-label {
  font-weight: 500;
}

.archives__year-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(24, 144, 255, 0.2);
}

.archives__pagination-btn {
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border-radius: 4px;
  border: 1px solid rgba(24, 144, 255, 0.25);
  background: rgba(240, 248, 255, 0.92);
  color: var(--vp-c-text-1);
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archives__pagination-btn:hover:not(.is-disabled) {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(245, 250, 255, 0.95);
}

.archives__pagination-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.archives__pagination-pages {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.archives__pagination-page {
  min-width: 2.2rem;
  height: 2.2rem;
  padding: 0 0.5rem;
  border-radius: 4px;
  border: 1px solid rgba(24, 144, 255, 0.25);
  background: rgba(240, 248, 255, 0.92);
  color: var(--vp-c-text-1);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.archives__pagination-page:hover {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(245, 250, 255, 0.95);
}

.archives__pagination-page.is-active {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(24, 144, 255, 0.12);
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.archives__pagination-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  user-select: none;
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
  background: rgba(24, 144, 255, 0.12);
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
    rgba(240, 248, 255, 0.92) 0%,
    rgba(245, 250, 255, 0.88) 45%,
    rgba(250, 252, 255, 0.85) 100%
  );
  border: 1px solid rgba(24, 144, 255, 0.2);
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
  gap: 1.2rem;
}

.archives__article-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.35rem 1.3rem;
  border-radius: 8px;
  background: rgba(240, 248, 255, 0.88);
  border: 1px solid rgba(24, 144, 255, 0.18);
  transition: transform 0.25s ease;
  margin-bottom: 1.2rem;
}

.archives__article-item:hover {
  transform: translateY(-2px);
}

.archives__article-item :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
}

.archives__article-excerpt {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--doc-text-color);
  overflow: hidden;
  font-family: "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  font-variant-ligatures: common-ligatures;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.archives__article-excerpt :deep(p) {
  margin: 0 0 1rem;
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--doc-text-color);
  font-weight: 400;
  letter-spacing: 0.015em;
}

.archives__article-excerpt :deep(p:last-child) {
  margin-bottom: 0;
}

.archives__article-excerpt :deep(h1) {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0.75rem 0 0.5rem;
  line-height: 1.4;
  color: var(--doc-text-color);
}

.archives__article-excerpt :deep(h2) {
  font-size: 1.0625rem;
  font-weight: 700;
  margin: 0.75rem 0 0.5rem;
  line-height: 1.4;
  color: var(--doc-text-color);
}

.archives__article-excerpt :deep(h3) {
  font-size: 1rem;
  font-weight: 650;
  margin: 0.75rem 0 0.45rem;
  line-height: 1.4;
  color: var(--doc-text-color);
}

.archives__article-excerpt :deep(h4),
.archives__article-excerpt :deep(h5),
.archives__article-excerpt :deep(h6) {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0.75rem 0 0.4rem;
  line-height: 1.4;
  color: var(--doc-text-color);
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
  font-family: 'Anonymous Pro', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', 'DejaVu Sans Mono', monospace;
  font-size: 0.9em;
  font-weight: normal;
  font-style: normal;
  color: #f8f8f2;
  background: #4d4d4d;
  padding: 0.2em 0.5em;
  margin: 0 0.2em;
  border-radius: 4px;
  border: none;
  vertical-align: baseline;
  line-height: 1.5;
  letter-spacing: 0;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.archives__article-excerpt :deep(ul),
.archives__article-excerpt :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 1.5rem;
  font-size: 0.9375rem;
  line-height: 1.8;
  color: var(--doc-text-color);
  font-weight: 400;
  letter-spacing: 0.015em;
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
  margin: 1rem 0;
  padding: 0.875rem 1rem;
  border-left: 4px solid rgba(24, 144, 255, 0.45);
  background: rgba(240, 248, 255, 0.6);
  border-radius: 12px;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--doc-text-color);
  font-style: normal;
  letter-spacing: 0.015em;
}

/* Support native collapsible sections in excerpts - 简约卡片样式 */
.archives__article-excerpt :deep(details) {
  margin: 0.75rem 0;
  padding: 0;
  border-radius: 8px;
  background: rgba(240, 248, 255, 0.6);
  border: 1px solid rgba(24, 144, 255, 0.25);
  overflow: hidden;
}

.archives__article-excerpt :deep(summary) {
  margin: 0;
  padding: 0.65rem 0.875rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  background: rgba(24, 144, 255, 0.05);
  border-bottom: 1px solid rgba(24, 144, 255, 0.2);
  user-select: none;
}

.archives__article-excerpt :deep(summary:hover) {
  background: rgba(24, 144, 255, 0.04);
}

.archives__article-excerpt :deep(summary::marker) {
  color: var(--vp-c-brand-1);
  font-size: 0.9em;
}

/* Archives Details 内容区域 */
.archives__article-excerpt :deep(details > *:not(summary)) {
  margin: 0;
  margin-left: 12px;
  color: var(--doc-text-color);
  line-height: 1.75;
  font-size: 0.9rem;
  letter-spacing: 0.015em;
}

/* Archives Details 内部的列表样式 - 简约风格 */
.archives__article-excerpt :deep(details > *:not(summary) ul),
.archives__article-excerpt :deep(details > *:not(summary) ol) {
  margin: 0 !important;
  padding-left: 0;
  list-style: none;
}

.archives__article-excerpt :deep(details > *:not(summary) li) {
  position: relative;
  margin: 0.4rem 0;
  line-height: 1.75;
  color: var(--doc-text-color);
}

/* 简约小圆点样式 */
.archives__article-excerpt :deep(details > *:not(summary) ul li::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

/* 有序列表样式 */
.archives__article-excerpt :deep(details > *:not(summary) ol) {
  counter-reset: list-counter;
}

.archives__article-excerpt :deep(details > *:not(summary) ol li) {
  counter-increment: list-counter;
}

.archives__article-excerpt :deep(details > *:not(summary) ol li::before) {
  content: counter(list-counter) '.';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  font-size: 0.9em;
  line-height: 1.75;
}

/* 嵌套列表 */
.archives__article-excerpt :deep(details > *:not(summary) ul ul),
.archives__article-excerpt :deep(details > *:not(summary) ol ol),
.archives__article-excerpt :deep(details > *:not(summary) ul ol),
.archives__article-excerpt :deep(details > *:not(summary) ol ul) {
  margin: 0.4rem 0 0.4rem 1rem;
  padding-left: 0;
}

.archives__article-excerpt :deep(details > *:not(summary) ul ul li::before) {
  width: 6px;
  height: 6px;
  background: var(--vp-c-brand-2);
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

/* Loading 状态样式 */
.archives__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 3rem 0;
  gap: 1.5rem;
}

.archives__loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(24, 144, 255, 0.15);
  border-top-color: var(--vp-c-brand-1);
  border-radius: 50%;
  animation: archives-spin 0.8s linear infinite;
}

.archives__loading-text {
  margin: 0;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

@keyframes archives-spin {
  to {
    transform: rotate(360deg);
  }
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
