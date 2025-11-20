<script lang="ts" setup>
import { computed, ref } from 'vue';

import { getQueryParam, countUniqueArticles } from '@blog/theme/utils/utils';
import ArticleMetadata from '@blog/theme/components/ArticleMetadata.vue'
import EmptySvg from '@blog/theme/assets/svgs/empty.svg';

// @ts-ignore
import { data as articleData } from '@blog/docs/article.data'


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
        // 文章按发布时间降序排序
        tags[articleTag].sort((a: { date: any; }, b: { date: string; }) => b.date.localeCompare(a.date));
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

  selectTag.value = normalized;
};

const clearSelection = () => {
  selectTag.value = '';
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

  return (
    tagEntries.value.find((entry) => entry.title === selectTag.value) ??
    tagEntries.value[0]
  );
});

// 如果URL路径有tag参数, 默认选中指定Tag, 例如: /tags?tag=Git
const initialTag = getQueryParam('tag')?.trim();
if (initialTag && initialTag !== '') {
  selectTag.value = initialTag;
}

</script>

<template>
  <div class="tags">
    <div class="tags__inner">
      <div class="tags__layout" v-if="tagEntries.length">
        <aside class="tags__aside" aria-label="标签导航">
          <p class="tags__kicker">tags</p>
          <p class="tags__lede">共 {{ totalTagCount }} 个标签 · {{ totalArticleCount }} 篇文章</p>
          <p class="tags__body">选择一个标签，在左侧查看对应文章列表。</p>

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

        <section class="tags__content" v-if="selectedTagEntry">
          <header class="tags__content-header">
            <div>
              <h2>#{{ selectedTagEntry.title }}</h2>
              <p>{{ selectedTagEntry.count }} 篇文章</p>
            </div>
            <button type="button" class="tags__clear" v-if="selectTag" @click="clearSelection">清除选择</button>
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
                    <a :href="article.path" target="_self" class="tags__article-link">{{ article.title }}</a>
                    <ArticleMetadata :article="article" class="tags-meta" />
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <p v-else class="tags__empty">这个标签暂时没有文章。</p>
        </section>
      </div>

      <p v-else class="tags__empty">暂无标签记录。</p>

    </div>
  </div>
</template>

<style scoped>
:global(.vp-doc._tags) {
  height: auto;
  display: block;
  overflow: visible;
  padding-block: var(--vp-layout-top, 0) var(--vp-layout-bottom, 0);
}

:global(.vp-doc._tags > div) {
  display: block;
}

:global(.vp-doc._tags .container),
:global(.vp-doc._tags .content),
:global(.vp-doc._tags .content-container),
:global(.vp-doc._tags .main) {
  padding: inherit;
  margin: inherit;
  display: block;
  min-height: auto;
}

.tags {
  max-width: 1200px;
  margin: 1.5rem auto 2.2rem;
  color: var(--vp-c-text-1);
  width: 100%;
  padding: 0 1.5rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
}

.tags__inner {
  display: flex;
  flex-direction: column;
  gap: 2.2rem;
}

.tags__layout {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  flex-direction: row-reverse;
}

.tags__aside {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
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
  border: 1px solid rgba(24, 144, 255, 0.25);
  border-radius: 8px;
  background: rgba(240, 248, 255, 0.9);
  box-shadow: 0 12px 24px rgba(24, 144, 255, 0.12);
  backdrop-filter: blur(6px);
  max-height: 320px;
  overflow-y: auto;
}

.tags__list::-webkit-scrollbar {
  width: 6px;
}

.tags__list::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.18);
  border-radius: 999px;
}

.tags__item {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  border: 1px solid rgba(24, 144, 255, 0.25);
  background: rgba(240, 248, 255, 0.92);
  color: inherit;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
}

.tags__item:hover {
  border-color: rgba(24, 144, 255, 0.35);
  background: rgba(245, 250, 255, 0.9);
}

.tags__item.is-active {
  border-color: rgba(24, 144, 255, 0.5);
  background: rgba(24, 144, 255, 0.12);
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
  background: rgba(24, 144, 255, 0.12);
  border-radius: 50%;
  margin-left: 0.4rem;
}

.tags__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.tags__content::-webkit-scrollbar {
  width: 6px;
}

.tags__content::-webkit-scrollbar-thumb {
  background: rgba(24, 144, 255, 0.18);
  border-radius: 999px;
}

.tags__content-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  overflow: hidden;
}

.tags__content-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.8rem;
}

.tags__content-header h2 {
  margin: 0;
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
}

.tags__content-header p {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.tags__clear {
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(24, 144, 255, 0.25);
  background: rgba(240, 248, 255, 0.92);
  color: var(--vp-c-text-2);
  font-size: 0.78rem;
  cursor: pointer;
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
  background: rgba(24, 144, 255, 0.18);
  border-radius: 999px;
}

.tags__article {
  padding: 0.85rem 0.95rem;
  border-radius: 0.85rem;
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
  border-radius: 1.1rem;
  border: 1px dashed var(--vp-c-divider);
  background: rgba(24, 144, 255, 0.05);
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
}

.tags__timeline {
  position: relative;
  padding: 0.6rem 0 0.6rem 1.4rem;
}

.tags__timeline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.tags__timeline-list::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0.35rem;
  width: 2px;
  background: rgba(24, 144, 255, 0.18);
}

.tags__timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 0.7rem 1fr;
  column-gap: 1rem;
}

.tags__timeline-dot {
  justify-self: center;
  align-self: center;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 0 4px rgba(45, 45, 45, 0.18);
}

.tags__article-item {
  display: grid;
  grid-template-columns: 1fr max-content;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0;
  border-radius: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  transition: none;
}

.tags__article-item:hover {
  transform: none;
  box-shadow: none;
}

.tags__article-link {
  color: inherit;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: -0.01em;
  word-break: break-word;
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
    padding: 1.5rem 1.25rem 2.5rem;
  }

  .tags__article-item {
    grid-template-columns: 1fr;
    gap: 0.4rem;
  }

  .tags__inner {
    flex-direction: column;
    gap: 2rem;
    overflow: visible;
  }

  .tags__layout {
    flex-direction: column;
    gap: 2rem;
    overflow: visible;
  }

  .tags__aside {
    max-height: none;
  }

  .tags__list {
    max-height: 240px;
  }

  .tags__content {
    overflow: visible;
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
</style>
