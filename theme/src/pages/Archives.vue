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
const articlesPerPage = 6; // 每页显示6篇文章

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

// 拆分excerpt，提取标题和内容
function handleYearIconClick(newYear: string | number) {
  const normalizedYear = normalizeYear(newYear);
  if (!normalizedYear) {
    selectAll();
    return;
  }

  const yearValue = `${normalizedYear}年`;
  selectYear(yearValue);
}

function resetCurrentPage() {
  selectAll()
}

function selectYear(yearValue: string) {
  const yearNum = yearValue.replace('年', '');
  condition.year = yearNum;
  year.value = yearNum;
  initTimeLine();
  
  // DOM 更新后平滑滚动到顶部
  nextTick(() => {
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function selectAll() {
  condition.year = '';
  year.value = '';
  initTimeLine();
  
  // DOM 更新后平滑滚动到顶部
  nextTick(() => {
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function clearProject() {
  condition.project = '';
  project.value = '';
  initTimeLine();
  
  // 清除 URL 中的 project 参数
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('project');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
  }
  
  // DOM 更新后平滑滚动到顶部
  nextTick(() => {
    requestAnimationFrame(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
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

// 项目文章数和最近更新时间
const projectArticlesCount = computed(() => {
  if (archiveType.value !== ArchiveType.Project || !condition.project) {
    return 0;
  }
  return getAllProjectArticles().length;
})

const projectLastUpdated = computed(() => {
  if (archiveType.value !== ArchiveType.Project || !condition.project) {
    return '';
  }
  const articles = getAllProjectArticles();
  if (!articles.length) {
    return '';
  }
  const latestDate = articles[0].date;
  if (!latestDate) {
    return '';
  }
  const date = new Date(latestDate);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
})

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
  if (totalPages <= 5) {
    // 如果总页数小于等于5，显示所有页码
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages: (number | string)[] = [];
  
  // 总是显示第一页
  pages.push(1);
  
  if (currentPage <= 3) {
    // 当前页在前3页，显示前4页
    for (let i = 2; i <= 4; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(totalPages);
  } else if (currentPage >= totalPages - 2) {
    // 当前页在后3页，显示后4页
    pages.push('...');
    for (let i = totalPages - 3; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 当前页在中间，显示当前页前后各1页
    pages.push('...');
    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
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
    
    // DOM 更新后平滑滚动到顶部
    nextTick(() => {
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
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

// 项目分页函数 - 滚动到顶部
function goToProjectPage(page: number) {
  const totalPages = getProjectTotalPages();
  if (page >= 1 && page <= totalPages) {
    projectPage.value = page;
    
    // DOM 更新后平滑滚动到顶部
    nextTick(() => {
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
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

// 全部文章分页函数 - 滚动到顶部
function goToAllArticlesPage(page: number) {
  const totalPages = getAllArticlesTotalPages();
  if (page >= 1 && page <= totalPages) {
    allArticlesPage.value = page;
    
    // DOM 更新后平滑滚动到顶部
    nextTick(() => {
      requestAnimationFrame(() => {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
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

// 所有年份的列表（用于年份导航按钮，始终显示所有年份）
const allYearEntries = computed(() => {
  const allYearData: { [x: string]: { [x: string]: any[]; } } = {};
  
  // 基于所有文章数据生成年份列表
  for (let i = 0; i < articleData.length; i++) {
    const article = articleData[i];
    const date = new Date(article.date);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const yearKey = `${date.getFullYear()}年`;
    const monthKey = `${date.getMonth() + 1}月`;

    if (!allYearData[yearKey]) {
      allYearData[yearKey] = {};
    }

    if (!allYearData[yearKey][monthKey]) {
      allYearData[yearKey][monthKey] = [];
    }

    allYearData[yearKey][monthKey].push(article);
  }

  return Object.keys(allYearData)
    .sort((a, b) => {
      const yearA = normalizeYear(a) ?? 0;
      const yearB = normalizeYear(b) ?? 0;
      return yearB - yearA;
    })
    .map((yearKey) => {
      const months = allYearData[yearKey];
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

      <!-- 项目信息卡片 -->
      <div class="archives__project-filter" v-if="archiveType === ArchiveType.Project && condition.project">
        <div class="archives__project-header">
          <div class="archives__project-info">
            <component :is="ProjectSvg" class="archives__project-icon" />
            <span class="archives__project-name">{{ condition.project }}</span>
          </div>
          <button
            type="button"
            class="archives__project-close"
            @click="clearProject"
            aria-label="退出项目筛选"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="archives__project-meta">
          <span class="archives__project-count">累计总共 {{ projectArticlesCount }} 篇文章</span>
          <span class="archives__project-separator">·</span>
          <span class="archives__project-update">最近更新于 {{ projectLastUpdated }}</span>
        </div>
      </div>

      <!-- 年份导航筛选栏 -->
      <div class="archives__year-filter" v-else-if="allYearEntries.length">
        <button
          type="button"
          class="archives__year-button"
          :class="{ 'is-active': !condition.year }"
          @click="selectAll()"
        >
          <span class="archives__year-label">全部</span>
          <span class="archives__year-count">{{ totalArticlesCount }}</span>
        </button>
        <button
          v-for="yearEntry in allYearEntries"
          :key="yearEntry.year"
          type="button"
          class="archives__year-button"
          :class="{ 'is-active': condition.year === yearEntry.year.replace('年', '') }"
          @click="selectYear(yearEntry.year)"
        >
          <span class="archives__year-label">{{ yearEntry.year.replace('年', '') }}</span>
          <span class="archives__year-count">{{ yearEntry.count }}</span>
        </button>
      </div>

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
                <a :href="article.path" class="archives__article-title-link">
                  <h3 class="archives__article-title">{{ article.title }}</h3>
                </a>
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
              </button>
            </div>
          </section>
        </template>

        <!-- 项目筛选：不显示年份标题组块，只显示合并后的文章列表和统一分页 -->
        <template v-else-if="archiveType === ArchiveType.Project">
          <section class="archives__content">
            <ul class="archives__article-list">
              <li v-for="article in getPaginatedProjectArticles()" :key="article.path" class="archives__article-item">
                <a :href="article.path" class="archives__article-title-link">
                  <h3 class="archives__article-title">{{ article.title }}</h3>
                </a>
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
              </button>
            </div>
          </section>
        </template>

        <!-- 全部文章：不显示年份标题组块，只显示合并后的文章列表和统一分页 -->
        <template v-else-if="archiveType === ArchiveType.All">
          <section class="archives__content">
            <ul class="archives__article-list">
              <li v-for="article in getPaginatedAllArticles()" :key="article.path" class="archives__article-item">
                <a :href="article.path" class="archives__article-title-link">
                  <h3 class="archives__article-title">{{ article.title }}</h3>
                </a>
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
              </button>
            </div>
          </section>
        </template>

        <!-- 年份筛选：不显示年份标题组块，只显示合并后的文章列表和统一分页 -->
        <template v-else-if="archiveType === ArchiveType.Year && currentYearEntry">
          <section class="archives__content">
            <ul class="archives__article-list">
              <li v-for="article in getPaginatedYearArticles(currentYearEntry)" :key="article.path" class="archives__article-item">
                <a :href="article.path" class="archives__article-title-link">
                  <h3 class="archives__article-title">{{ article.title }}</h3>
                </a>
                <ArticleMetadata :article="article" />
                <div v-if="article.excerpt" class="archives__article-excerpt" v-html="article.excerpt"></div>
                <a :href="article.path" target="_self" class="archives__article-read-more">阅读全文 →</a>
              </li>
            </ul>

            <!-- 年份统一分页器 -->
            <div v-if="getYearTotalPages(currentYearEntry) > 1" class="archives__year-pagination">
              <button 
                type="button"
                class="archives__pagination-btn"
                :class="{ 'is-disabled': (yearPages[currentYearEntry.year] || 1) === 1 }"
                @click="prevYearPage(currentYearEntry.year)"
                :disabled="(yearPages[currentYearEntry.year] || 1) === 1"
                aria-label="上一页"
              >
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
              </button>
            </div>
          </section>
        </template>
      </div>

      <p v-else class="archives__empty">暂无文章记录。</p>
    </div>
  </div>
</template>

<style scoped>
.archives {
  max-width: 1400px;
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
  padding-top: 1.8rem; /* 为固定的年份导航留出空间 */
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
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.65);
}

.archives__hero-card {
  position: relative;
  padding: 1.4rem 1.8rem 1.6rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  gap: 0.3rem;
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
  color: rgba(0, 0, 0, 0.85);
  background: #f8f9fa;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
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

  .meta-pill {
    font-size: 0.8rem;
    padding: 0.35rem 0.75rem;
  }

  .archives__year-pagination {
    gap: 0.35rem;
  }

  .archives__pagination-btn {
    width: 1.8rem;
    height: 1.8rem;
    min-width: 1.8rem;
    min-height: 1.8rem;
  }

  .archives__pagination-btn::before {
    width: 0.4rem;
    height: 0.4rem;
  }

  .archives__pagination-page {
    min-width: 1.8rem;
    height: 1.8rem;
    min-height: 1.8rem;
    padding: 0.25rem 0.4rem;
    font-size: 0.72rem;
  }

  .archives__pagination-ellipsis {
    min-width: 1.2rem;
    height: 1.8rem;
    font-size: 0.75rem;
  }

  .archives__pagination-pages {
    gap: 0.25rem;
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
  max-width: 100%; /* 文章卡片容器宽度 */
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.archives__aside {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 0;
  margin-top: 0;
  align-self: flex-start;
  max-width: 280px;
}

.archives__aside-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.2rem;
  gap: 0.5rem;
}

.archives__aside-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex: 1;
}

.archives__aside-title {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
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
  border: none;
  border-radius: 999px;
  background: rgba(74, 144, 226, 0.12);
  color: rgba(0, 0, 0, 0.65);
  font-size: 1rem;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archives__clear-button:hover {
  border-color: rgba(74, 144, 226, 0.5);
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
}

.archives__filter-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
}

.archives__project-filter {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  /* 根据内容自适应宽度 */
  width: fit-content;
  max-width: min(1400px, calc(100vw - 3rem)); /* 不超过文章卡片宽度，也不超过视口 */
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  background: #f8f9fa;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  transition: all 200ms ease;
}

.archives__project-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.archives__project-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}

.archives__project-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.archives__project-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.archives__project-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
  flex-wrap: wrap;
  margin-left: calc(1.25rem + 0.5rem);
}

.archives__project-separator {
  color: var(--vp-c-text-3);
}

.archives__project-close {
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: none;
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  flex-shrink: 0;
}

.archives__project-close:hover {
  border-color: rgba(74, 144, 226, 0.3);
  background: rgba(74, 144, 226, 0.2);
  color: var(--vp-c-brand-1);
  transform: rotate(90deg);
}

.archives__year-filter {
  position: fixed;
  top: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  /* 根据内容自适应宽度 */
  width: fit-content;
  max-width: min(1400px, calc(100vw - 3rem)); /* 不超过文章卡片宽度，也不超过视口 */
  display: flex;
  flex-wrap: nowrap; /* 单行，不换行 */
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.7rem;
  border: none;
  border-radius: 8px; /* 更紧凑的圆角 */
  background: #f8f9fa;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  box-sizing: border-box;
  /* 横向滚动 */
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.archives__year-filter::-webkit-scrollbar {
  height: 0; /* 隐藏滚动条，但保持滚动功能 */
}

.archives__year-filter::-webkit-scrollbar-track {
  background: transparent;
}

.archives__year-filter::-webkit-scrollbar-thumb {
  background: transparent;
}

.archives__year-filter::-webkit-scrollbar-thumb:hover {
  background: transparent;
}


.archives__aside-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: flex-start;
}

.archives__year-button {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px; /* 与标签页一致 */
  border: none;
  background: #f8f9fa;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.72rem;
  font-weight: 500;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.15), 0 1px 5px -1px rgba(0, 0, 0, 0.12);
  transition: all 200ms ease;
  will-change: transform;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.archives__year-button-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  display: block;
}

.archives__year-button:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  opacity: 0.8;
  transform: translateY(-1px);
}

.archives__year-button.is-active {
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
  font-weight: 600;
}

.archives__year-label {
  font-weight: 500;
  color: inherit;
  font-size: inherit;
}

.archives__year-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.archives__pagination-btn {
  width: 2rem;
  height: 2rem;
  min-width: 2rem;
  min-height: 2rem;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: #f8f9fa;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0;
  cursor: pointer;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  box-sizing: border-box;
}

.archives__pagination-btn::before {
  content: '';
  width: 0.5rem;
  height: 0.5rem;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(-45deg);
  transition: all 0.2s ease;
}

.archives__year-pagination > .archives__pagination-btn:last-child::before,
.archives__pagination-btn[aria-label="下一页"]::before {
  transform: rotate(135deg);
}

.archives__pagination-btn:hover:not(.is-disabled) {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  opacity: 0.8;
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
  min-width: 2rem;
  min-height: 2rem;
  height: 2rem;
  padding: 0.3rem 0.45rem;
  border-radius: 999px;
  border: none;
  background: rgba(74, 144, 226, 0.12);
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 200ms ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.archives__pagination-page:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  opacity: 0.8;
}

.archives__pagination-page.is-active {
  border-color: rgba(74, 144, 226, 0.5);
  background: rgba(74, 144, 226, 0.2);
}

.archives__pagination-ellipsis {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 2rem;
  padding: 0 0.25rem;
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  user-select: none;
}

.archives__year-filter {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-right: 0;
}

.archives__year-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1rem;
  height: 1rem;
  padding: 0 0.2rem;
  font-size: 0.6rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
  background: rgba(74, 144, 226, 0.12);
  border-radius: 4px; /* 更紧凑的圆角 */
  margin-left: 0.15rem;
}

.archives__year-button:hover .archives__year-count {
  background: rgba(74, 144, 226, 0.25);
  color: #4a90e2;
}

.archives__year-button.is-active .archives__year-count {
  background: rgba(74, 144, 226, 0.3);
  color: #4a90e2;
  font-weight: 700;
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
  background: #f8f9fa;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
  transition: all 200ms ease;
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

.archives__article-list .archives__article-item + .archives__article-item {
  margin-top: 0;
}

.archives__article-item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
  border-radius: 8px;
  background: #f8f9fa;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
}

.archives__article-item:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

/* 文章标题样式 - 适合卡片展示 */
.archives__article-title-link {
  text-decoration: none;
  color: inherit;
}

.archives__article-title {
  margin: 0;
  padding: 0 0 0.5rem;
  border-bottom: 2px solid rgba(74, 144, 226, 0.4);
  font-weight: 600;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.85) !important;
  font-size: 1.05rem;
  transition: color 0.2s ease;
}

.archives__article-title-link:hover .archives__article-title {
  color: #4a90e2;
}

/* Metadata样式 - 卡片中不需要上下 margin */
.archives__article-item :deep(.meta-wrapper) {
  margin-top: 0;
  margin-bottom: 0;
}

.archives__article-item :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
  margin: 0 0 0.25rem;
}

.archives__article-excerpt {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.8;
  color: var(--doc-text-color);
  overflow: hidden;
  font-family: 'TsangerJinKai02', "PingFang SC", Avenir, Tahoma, Arial, "Lantinghei SC", "Microsoft Yahei", "Hiragino Sans GB", "Microsoft Sans Serif", "WenQuanYi Micro Hei", Helvetica, sans-serif;
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
  color: #333;
  background: #f0f0f0;
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
  border-radius: 8px;
  margin: 0.6rem 0;
}

.archives__article-excerpt :deep(pre) {
  margin: 0.6rem 0;
  padding: 0.65rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.75rem;
}

.archives__article-excerpt :deep(blockquote) {
  margin: 1rem 0;
  padding: 0.875rem 1rem;
  border-left: 4px solid rgba(74, 144, 226, 0.6);
  background: #f8f8f8;
  border-radius: 8px;
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
  background: #f8f8f8;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.archives__article-excerpt :deep(summary) {
  margin: 0;
  padding: 0.65rem 0.875rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  background: rgba(74, 144, 226, 0.08);
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
  user-select: none;
}

.archives__article-excerpt :deep(summary:hover) {
  background: rgba(74, 144, 226, 0.06);
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
  border: 4px solid rgba(0, 0, 0, 0.08);
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

/* PC端一行展示两个卡片 */
@media (min-width: 861px) {
  .archives__article-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
  }
}

@media (max-width: 860px) {
  .archives {
    max-width: 100%;
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .archives__inner {
    padding-top: 2.2rem; /* 移动端间距 */
  }

  .archives__layout {
    gap: 2rem;
    max-width: 100%; /* 移动端占满容器 */
  }

  .archives__year-filter {
    max-width: min(1400px, calc(100vw - 2.5rem)); /* 取两者中较小的值 */
  }

  .archives__project-filter {
    max-width: min(1400px, calc(100vw - 2.5rem));
  }

  .archives__content {
    gap: 2rem;
  }

  .archives__aside-buttons {
    gap: 0.5rem;
  }

  .archives__year-button {
    font-size: 0.72rem;
    padding: 0.25rem 0.5rem;
  }
}

@media (max-width: 600px) {
  .archives {
    max-width: 100%;
    padding: 1.5rem 1.1rem 2.2rem;
  }

  .archives__inner {
    padding-top: 2.4rem; /* 小屏移动端间距 */
  }

  .archives__year-filter {
    max-width: min(1400px, calc(100vw - 2.2rem)); /* 取两者中较小的值 */
  }

  .archives__project-filter {
    max-width: min(1400px, calc(100vw - 2.2rem));
    padding: 0.5rem 0.6rem;
    gap: 0.4rem;
  }

  .archives__month {
    padding: 0.85rem 0.95rem;
  }

  .archives__project-header {
    gap: 0.5rem;
  }

  .archives__project-info {
    gap: 0.5rem;
  }

  .archives__project-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .archives__project-name {
    font-size: 0.85rem;
  }

  .archives__project-meta {
    font-size: 0.7rem;
    gap: 0.3rem;
    margin-left: calc(1.25rem + 0.5rem);
  }

  .archives__project-close {
    width: 1.5rem;
    height: 1.5rem;
  }

  .archives__year-button {
    font-size: 0.72rem;
    padding: 0.25rem 0.5rem;
  }
}

/* 白天主题 */
.archives {
  background: #d8e0e8;
}

.archives__year-filter,
.archives__project-filter {
  background: #f8f9fa;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
}

.archives__year-button {
  background: #f8f9fa;
  border: none;
  color: rgba(0, 0, 0, 0.65);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
}

.archives__year-button:hover {
  background: rgba(74, 144, 226, 0.15);
  color: #4a90e2;
  opacity: 0.8;
  transform: translateY(-1px);
}

.archives__year-button.is-active {
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
  font-weight: 600;
}

.archives__project-name,
.archives__project-count,
.archives__project-update {
  color: rgba(0, 0, 0, 0.65);
}

.archives__project-close {
  background: rgba(74, 144, 226, 0.15);
  border-color: rgba(74, 144, 226, 0.4);
  color: #4a90e2;
}

.archives__project-close:hover {
  border-color: rgba(74, 144, 226, 0.6);
  background: rgba(74, 144, 226, 0.2);
}

.archives__clear-button {
  background: #f8f9fa;
  border: none;
  color: rgba(0, 0, 0, 0.65);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
  will-change: transform;
}

.archives__clear-button:hover {
  background: rgba(74, 144, 226, 0.15);
  border-color: rgba(74, 144, 226, 0.5);
  color: #4a90e2;
  opacity: 0.8;
}

.archives__article-header {
  background: #f8f9fa;
  border: none;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
}

.archives__year-heading {
  color: rgba(0, 0, 0, 0.85);
}

.archives__article-item {
  background: #f8f9fa;
  border: none;
}

.archives__article-item:hover {
  opacity: 0.8;
  transform: scale(1.02);
}

.archives__article-title {
  color: rgba(0, 0, 0, 0.85) !important;
  border-bottom-color: rgba(74, 144, 226, 0.4) !important;
}

.archives__article-excerpt {
  color: rgba(0, 0, 0, 0.65);
}

.archives__article-read-more {
  color: #4a90e2;
}

.archives__empty {
  background: #f8f9fa;
  border: none;
  color: rgba(0, 0, 0, 0.45);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
}

.archives__empty-title {
  color: rgba(0, 0, 0, 0.65);
}

.archives__pagination-btn,
.archives__pagination-page {
  background: #f8f9fa;
  border: none;
  color: rgba(0, 0, 0, 0.65);
}

.archives__pagination-btn:hover:not(:disabled),
.archives__pagination-page:hover {
  background: rgba(74, 144, 226, 0.15);
  border-color: rgba(74, 144, 226, 0.5);
  color: #4a90e2;
  opacity: 0.8;
}

.archives__pagination-page.is-active {
  background: rgba(74, 144, 226, 0.2);
  border-color: rgba(74, 144, 226, 0.6);
  color: #4a90e2;
  font-weight: 600;
}

.archives__article-count {
  background: rgba(74, 144, 226, 0.12);
  color: rgba(0, 0, 0, 0.65);
}
</style>
