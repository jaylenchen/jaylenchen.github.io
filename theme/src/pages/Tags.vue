<script lang="ts" setup>
import { computed, ref, inject, onMounted, onUnmounted } from 'vue';

import { getQueryParam, countUniqueArticles } from '@blog/theme/utils/utils';
import ArticleMetadata from '@blog/theme/components/ArticleMetadata.vue'
import EmptySvg from '@blog/theme/assets/svgs/empty.svg';

// @ts-ignore
import { data as articleData } from '@blog/docs/article.data'

// 注入 preview 引用和加载函数
const articlePreview = inject<{ value: any } | null>('articlePreview', null)
const loadArticleForPreview = inject<((path: string) => Promise<{ title: string; content: string } | null>) | null>('loadArticleForPreview', null)


const tagsMap = computed(() => initTags(articleData));

const tagEntries = computed(() => {
  const entries = Object.entries(tagsMap.value || {}) as [string, any[]][];

  return entries
    .map(([title, articles]) => ({
      title,
      articles,
      count: articles.length
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.title.localeCompare(b.title, 'zh-Hans-CN');
    });
});

const totalTagCount = computed(() => tagEntries.value.length);
// 统计唯一文章数（使用通用函数，避免多处维护）
const totalArticleCount = computed(() => countUniqueArticles(tagEntries.value.flatMap(e => e.articles)));
/**
 * 初始化标签数据
 * {tagTitle1: [article1, article2, ...}
 */
function initTags(articleData: string | any[]) {
  const tags: any = {};
  for (let i = 0; i < articleData.length; i++) {
    const article = articleData[i];
    const articleTags = article.tags;
    if (Array.isArray(articleTags)) {
      articleTags.forEach((articleTag) => {
        if (!tags[articleTag]) {
          tags[articleTag] = [];
        }
        tags[articleTag].push(article);
        // 文章按发布时间降序排序（从最新到最旧）
        tags[articleTag].sort((a: { date: any; }, b: { date: string; }) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    }
  }
  return tags;
}

// 点击指定Tag后进行选中
const selectTag = ref('');

const toggleTag = (tagTitle: string) => {
  const normalized = tagTitle.trim();
  if (!normalized) {
    return;
  }

  // 如果点击的是已选中的标签，则取消选中
  if (selectTag.value === normalized) {
    clearSelection();
    return;
  }

  selectTag.value = normalized;
  
  // 更新 URL 中的 tag 参数
  const url = new URL(window.location.href);
  url.searchParams.set('tag', normalized);
  window.history.pushState({}, '', url.toString());
};

const clearSelection = () => {
  selectTag.value = '';
  
  // 清除 URL 中的 tag 参数
  const url = new URL(window.location.href);
  url.searchParams.delete('tag');
  window.history.pushState({}, '', url.pathname);
};

const selectedTagArticles = computed(() => {
  if (!selectTag.value) {
    return [];
  }

  return tagsMap.value[selectTag.value] ?? [];
});

const selectedTagEntry = computed(() => {
  if (!tagEntries.value.length) {
    return null;
  }

  return tagEntries.value.find((entry) => entry.title === selectTag.value) ?? null;
});

// 如果URL路径有tag参数, 默认选中指定Tag, 例如: /tags?tag=Git
const initialTag = getQueryParam('tag')?.trim();
if (initialTag && initialTag !== '') {
  selectTag.value = initialTag;
}

// 处理文章链接点击
async function handleArticleClick(article: any) {
  if (!articlePreview?.value || !loadArticleForPreview) return
  
  const articlePath = article.path
  
  // 显示加载提示
  articlePreview.value.show('加载中...', '<p>正在加载文章内容...</p>')
  
  // 使用提供的加载函数
  const articleContent = await loadArticleForPreview(articlePath)
  
  if (articleContent) {
    articlePreview.value.show(articleContent.title, articleContent.content)
  } else {
    articlePreview.value.show('加载失败', '<p>无法加载文章内容，请检查链接是否正确。</p>')
  }
}

</script>

<template>
  <div class="tags">
    <div class="tags__inner">
      <div class="tags__layout" v-if="tagEntries.length">
        <section class="tags__content">
          <div v-if="!selectedTagEntry" class="tags__empty-state">
            <EmptySvg class="tags__empty-icon" />
            <p class="tags__empty-text">选个感兴趣的标签查看吧哥们儿...</p>
          </div>

          <template v-else>
          <header class="tags__content-header">
            <div>
              <h2>#{{ selectedTagEntry.title }}</h2>
              <p>{{ selectedTagEntry.count }} 篇文章</p>
            </div>
          </header>

          <div v-if="selectedTagEntry.articles.length" class="tags__list-wrapper">
            <div class="tags__timeline">
              <ul class="tags__timeline-list">
                <li
                  v-for="article in selectedTagEntry.articles"
                  :key="article.path"
                  class="tags__timeline-item"
                >
                  <span class="tags__timeline-dot"></span>
                  <div class="tags__article-item">
                    <a 
                      :href="article.path" 
                      target="_self" 
                      class="tags__article-link"
                      @click.prevent="handleArticleClick(article)"
                    >{{ article.title }}</a>
                    <ArticleMetadata :article="article" class="tags-meta" />
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <p v-else class="tags__empty">这个标签暂时没有文章。</p>
          </template>
        </section>

        <aside class="tags__aside" aria-label="标签导航">
          <div class="tags__list" aria-label="标签列表">
            <button
              v-for="entry in tagEntries"
              :key="entry.title"
              type="button"
              class="tags__item"
              :class="{ 'is-active': selectedTagEntry && selectedTagEntry.title === entry.title }"
              @click="toggleTag(entry.title)"
            >
              <span class="tags__item-name">#{{ entry.title }}</span>
              <span class="tags__item-count">{{ entry.count }}</span>
            </button>
          </div>
        </aside>
      </div>

      <p v-else class="tags__empty">暂无标签记录。</p>

    </div>
  </div>
</template>

<style scoped>
/* 确保 VitePress 容器链条都有明确的宽度 */
:global(.VPDoc:has(.vp-doc._tags)),
:global(.VPDoc:has(.vp-doc._tags) > *),
:global(.VPDoc:has(.vp-doc._tags) .container),
:global(.VPDoc:has(.vp-doc._tags) .content) {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:global(.vp-doc._tags) {
  height: auto;
  display: block;
  overflow: visible;
  padding-block: var(--vp-layout-top, 0) var(--vp-layout-bottom, 0);
  /* 确保 VitePress 容器有明确的宽度 */
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

:global(.vp-doc._tags > div) {
  display: block;
  /* 确保 VitePress 生成的容器有明确的宽度，不受子元素影响 */
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important; /* 允许收缩 */
  box-sizing: border-box !important;
  overflow: hidden !important;
}

:global(.vp-doc._tags .container),
:global(.vp-doc._tags .content),
:global(.vp-doc._tags .content-container),
:global(.vp-doc._tags .main) {
  padding: inherit;
  margin: inherit;
  display: block;
  min-height: auto;
  /* 确保 VitePress 生成的容器有明确的宽度，不受子元素影响 */
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important; /* 允许收缩 */
  box-sizing: border-box !important;
  overflow: hidden !important;
}

/* PC端固定高度，防止页面滚动 */
@media (min-width: 960px) {
  :global(body:has(.vp-doc._tags)),
  :global(html:has(.vp-doc._tags)) {
    overflow: hidden !important;
    height: 100vh !important;
    max-height: 100vh !important;
  }

  :global(.vp-doc._tags) {
    height: 100vh !important;
    max-height: 100vh !important;
    overflow: hidden !important;
  }

  :global(.vp-doc._tags > div),
  :global(.vp-doc._tags .container),
  :global(.vp-doc._tags .content),
  :global(.vp-doc._tags .content-container),
  :global(.vp-doc._tags .main) {
    height: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    /* 确保 VitePress 生成的容器有明确的宽度，不受子元素影响 */
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important; /* 允许收缩 */
    box-sizing: border-box !important;
  }
  
  /* 确保 VPDoc 容器本身也有明确的宽度 */
  :global(.VPDoc:has(.vp-doc._tags)) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  :global(.VPFooter) {
    display: none !important;
  }
}

.tags {
  max-width: 1200px;
  margin: 0 auto;
  color: var(--vp-c-text-1);
  /* 使用固定宽度计算，确保有有效值 */
  width: 100%;
  max-width: 100%; /* 确保不超过父容器 */
  min-width: 0; /* 允许收缩 */
  padding: 0 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden; /* 防止内容溢出 */
}

/* PC端固定高度，防止页面滚动 */
@media (min-width: 960px) {
  .tags {
    flex: 1 !important;
    overflow: hidden !important;
    min-height: 0 !important;
    max-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    padding-top: 1rem !important;
  }

  .tags__inner {
    flex: 1 !important;
    overflow: hidden !important;
    min-height: 0 !important;
    max-height: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    /* 确保宽度为 100%，不受子元素影响 */
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .tags__layout {
    flex: 1 !important;
    overflow: hidden !important;
    min-height: 0 !important;
    max-height: 100% !important;
    /* 最大容器固定为 100% 宽度，不受子元素影响 */
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    gap: 4.5rem !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }

  .tags__aside {
    /* 固定宽度 220px，不参与 flex 增长 */
    flex: 0 0 220px !important;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    width: 220px !important;
    max-height: 100%;
    overflow-y: auto;
    box-sizing: border-box !important;
  }

  .tags__aside::-webkit-scrollbar {
    width: 6px;
  }

  .tags__aside::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
  }

  .tags__aside::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
    transition: background 0.2s ease;
  }

  .tags__aside::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.6);
    opacity: 0.8;
  }

  .tags__content {
    /* 固定宽度 400px */
    flex: 0 0 400px !important;
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    max-height: 100% !important;
    box-sizing: border-box !important;
  }

  .tags__content-header {
    flex: 0 0 auto !important;
  }

  .tags__list-wrapper {
    flex: 1 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    min-height: 0 !important;
    max-height: 100% !important;
  }
}

.tags__inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  /* 确保宽度为 100%，不受子元素影响 */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* 防止内容溢出 */
}

.tags__layout {
  display: flex;
  gap: 4.5rem;
  align-items: flex-start;
  flex-direction: row;
  justify-content: center;
  /* 最大容器固定宽度，确保有有效值 */
  width: 100%;
  max-width: 100%;
  min-width: 0; /* 允许收缩 */
  box-sizing: border-box;
  /* 防止内容溢出 */
  overflow: hidden;
  /* 确保 flex 子元素不会撑开容器 */
  flex-wrap: nowrap;
}

.tags__aside {
  /* 固定宽度 220px，不参与 flex 增长 */
  flex: 0 0 220px;
  flex-shrink: 0;
  flex-grow: 0;
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  box-sizing: border-box;
}

.tags__kicker {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.tags__lede {
  margin: 0;
  font-size: 1rem;
  line-height: 1.8;
  color: var(--vp-c-text-2);
}

.tags__body {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: var(--vp-c-text-3);
}

.tags__list {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  background: #f8f9fa;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  max-height: 320px;
  overflow-y: auto;
}

.tags__list::-webkit-scrollbar {
  width: 6px;
}

.tags__list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.tags__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  border: none;
  background: #f8f9fa;
  color: rgba(0, 0, 0, 0.65);
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.15), 0 1px 5px -1px rgba(0, 0, 0, 0.12);
  transition: all 200ms ease;
  will-change: transform;
}

.tags__item:hover {
  background: rgba(74, 144, 226, 0.12);
  opacity: 0.8;
  transform: translateY(-1px);
}

.tags__item.is-active {
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
}

.tags__item-name {
  font-weight: 500;
}

.tags__item-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  background: rgba(74, 144, 226, 0.12);
  border-radius: 50%;
  margin-left: 0.4rem;
}


.tags__empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
  border: 2px dashed rgba(82, 82, 89, 0.32);
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

/* PC端 empty state 占据可用空间 */
@media (min-width: 960px) {
  .tags__empty-state {
    flex: 1;
    min-height: 0;
    width: 100%;
  }
}

.tags__empty-icon {
  width: 12rem;
  height: 12rem;
  opacity: 0.6;
}

.tags__empty-text {
  font-size: 1rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

.tags__content {
  /* 固定宽度 400px */
  flex: 0 0 400px;
  width: 400px;
  min-width: 400px;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  box-sizing: border-box;
  overflow: hidden; /* 防止内容溢出 */
}

.tags__content::-webkit-scrollbar {
  width: 6px;
}

.tags__content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.tags__content-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  overflow: hidden; /* 防止内容溢出撑开容器 */
  min-width: 0; /* 允许收缩 */
}

.tags__content-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.8rem;
  padding: 0;
  margin: 0;
  min-width: 0; /* 防止内容撑开容器 */
  width: 100%; /* 确保占据整个 content 宽度 */
}

.tags__content-header > div {
  min-width: 0; /* 允许内容收缩 */
  flex: 1; /* 占据可用空间 */
}

.tags__content-header h2 {
  margin: 0;
  padding: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  word-break: break-word; /* 允许长标题换行 */
  overflow-wrap: break-word; /* 防止溢出 */
}

.tags__content-header p {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}


.tags__articles {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  overflow-y: auto;
  padding-right: 0.2rem;
  min-height: 0;
}

.tags__articles::-webkit-scrollbar {
  width: 6px;
}

.tags__articles::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}

.tags__article {
  padding: 0.85rem 0.95rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.tags__article-title {
  margin: 0 0 0.35rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.tags__article-title a {
  color: inherit;
  text-decoration: none;
}

.tags__article-title a:hover {
  color: var(--vp-c-brand-1, #3e63dd);
}

.tags__article :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.76rem;
}

.tags__empty,
.tags__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.4rem;
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 1.8rem 1.1rem;
  border-radius: 8px;
  border: 1px dashed var(--vp-c-divider);
  background: rgba(0, 0, 0, 0.03);
}

.tags__placeholder-illustration {
  width: min(240px, 50vw);
  height: auto;
  opacity: 0.85;
}

.tags__placeholder-text {
  margin: 0;
  font-size: 0.9rem;
}

.tags__month-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tags__month {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.tags__list-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 0; /* 允许收缩 */
  overflow: hidden; /* 防止内容溢出撑开容器 */
}

/* PC端时间轴滚动条样式 */
@media (min-width: 960px) {
  .tags__list-wrapper::-webkit-scrollbar {
    width: 6px;
  }

  .tags__list-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 3px;
  }

  .tags__list-wrapper::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;
    transition: background 0.2s ease;
  }

  .tags__list-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.6);
    opacity: 0.8;
  }
}

.tags__timeline {
  position: relative;
  overflow: hidden; /* 防止内容溢出撑开容器 */
  min-width: 0; /* 允许收缩 */
}

.tags__timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
  overflow: hidden; /* 防止内容溢出撑开容器 */
  min-width: 0; /* 允许收缩 */
}

.tags__timeline-list::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0.35rem;
  width: 1px;
  background: rgba(0, 0, 0, 0.12);
}

.tags__timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 0.8rem 1fr;
  column-gap: 1rem;
  overflow: hidden; /* 防止内容溢出撑开容器 */
  min-width: 0; /* 允许 grid 子元素收缩 */
}

.tags__timeline-item > *:nth-child(2) {
  min-width: 0; /* 确保第二列（内容列）能够收缩 */
  max-width: 100%; /* 固定最大宽度 */
  overflow: hidden; /* 防止内容溢出 */
  width: 100%; /* 固定宽度为 100% */
  box-sizing: border-box;
}

.tags__timeline-dot {
  justify-self: center;
  align-self: center;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
  position: relative;
  z-index: 1;
}

.tags__article-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.3rem 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  transition: none;
  /* 固定宽度，确保不会因为内容变化而变化 */
  width: 100%;
  max-width: 100%;
  min-width: 0; /* 允许内容收缩 */
  overflow: hidden; /* 防止内容溢出 */
  box-sizing: border-box;
}

.tags__article-item:hover {
  transform: none;
  box-shadow: none;
}

.tags__article-link {
  color: #fff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: break-word;
  overflow-wrap: break-word; /* 防止溢出 */
  display: block;
  padding-bottom: 0.3rem;
  border-bottom: 2px solid rgba(74, 144, 226, 0.4);
  /* 固定宽度，确保不会因为标题长度变化而变化 */
  width: 100%;
  max-width: 100%;
  min-width: 0; /* 允许收缩 */
  box-sizing: border-box;
  overflow: hidden; /* 防止内容溢出 */
}

.tags__article-link:hover {
  color: var(--vp-c-brand-1, #3e63dd);
}

.tags__article-item :deep(.article-meta) {
  color: var(--vp-c-text-3);
  font-size: 0.85rem;
}

@media (max-width: 860px) {
  :global(.vp-doc._tags) {
    height: auto;
    overflow: visible;
    padding-block: var(--vp-layout-top, 0) var(--vp-layout-bottom, 0);
  }

  :global(.vp-doc._tags > div) {
    display: block;
  }

  .tags {
    padding: 1rem 1.25rem 2rem;
  }

  .tags__article-item {
    gap: 0.2rem;
    padding: 0.3rem 0;
  }

  .tags__inner {
    flex-direction: column;
    gap: 1rem;
    overflow: visible;
  }

  .tags__layout {
    flex-direction: column;
    gap: 1rem;
    overflow: visible;
    justify-content: flex-start; /* 移动端保持原有样式，不居中 */
  }

  .tags__aside {
    max-height: none;
    order: -1; /* 移动端：标签容器显示在上方 */
    width: 100% !important; /* 移动端：占据100%宽度 */
    flex: 0 0 auto !important; /* 移动端：自动宽度 */
  }

  .tags__list {
    max-height: 240px;
  }

  .tags__content {
    overflow: visible;
    width: 100% !important; /* 移动端：占据100%宽度 */
    flex: 0 0 auto !important; /* 移动端：自动宽度，覆盖PC端的固定宽度 */
    min-width: 0 !important; /* 移动端：允许收缩 */
    max-width: 100% !important; /* 移动端：不超过100% */
    order: 1; /* 移动端：内容区域显示在下方 */
  }


  .tags__empty-state {
    min-height: 250px;
    padding: 1rem;
  }

  .tags__empty-icon {
    width: 8rem;
    height: 8rem;
  }

  .tags__empty-text {
    font-size: 0.85rem;
  }

  .tags__content-inner {
    overflow: visible;
  }

  .tags__articles {
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .tags {
    margin: 0 auto;
    padding: 1.5rem 1.25rem 3rem;
  }

  .tags__article-link {
    font-size: 0.9rem;
  }

  .tags__article-item :deep(.article-meta) {
    font-size: 0.8rem;
  }
}

/* 白天主题 */
.tags {
  background: #d8e0e8;
}

.tags__list {
  background: #f8f9fa;
  border: none;
}

.tags__item {
  background: #f8f9fa;
  border: none;
  color: rgba(0, 0, 0, 0.65);
}

.tags__item:hover {
  border-color: rgba(74, 144, 226, 0.5);
  background: rgba(74, 144, 226, 0.12);
  opacity: 0.8;
}

.tags__item.is-active {
  border-color: rgba(74, 144, 226, 0.6);
  background: rgba(74, 144, 226, 0.2);
  color: #4a90e2;
}


.tags__content-header h2 {
  color: rgba(0, 0, 0, 0.85);
}

.tags__article-count {
  color: rgba(0, 0, 0, 0.45);
}

.tags__timeline-list::before {
  background: rgba(0, 0, 0, 0.12);
}

.tags__timeline-dot {
  background: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.2);
}

.tags__article-link {
  color: rgba(0, 0, 0, 0.85);
}

.tags__article-link::after {
  background: #4a90e2;
}

.tags__empty-state {
  color: rgba(0, 0, 0, 0.45);
}

.tags__empty-message {
  color: rgba(0, 0, 0, 0.65);
}

@media (min-width: 861px) {
  .tags__list-wrapper::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.06);
  }

  .tags__list-wrapper::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
  }

  .tags__list-wrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.6);
    opacity: 0.8;
  }

  .tags__aside::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.06);
  }

  .tags__aside::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
  }

  .tags__aside::-webkit-scrollbar-thumb:hover {
    background: rgba(74, 144, 226, 0.6);
    opacity: 0.8;
  }
}
</style>
