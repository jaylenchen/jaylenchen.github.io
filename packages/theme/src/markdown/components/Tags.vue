<script lang="ts" setup>
import { computed, ref } from 'vue';
import md5 from 'blueimp-md5';
import { getQueryParam } from '../../utils/utils';
// @ts-ignore
import { data as articleData } from '../../../../../config/article.data'
import { Row, Col, Tag, Card, List, ListItem } from 'ant-design-vue'
import ArticleMetadata from '../../global/components/ArticleMetadata.vue'

import ArticleSvg from '../../assets/svgs/article.svg';
import EmptySvg from '../../assets/svgs/empty.svg';


const tags = computed(() => initTags(articleData));
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
let selectTag = ref('');
const toggleTag = (tagTitle: string) => {
  if (selectTag.value && selectTag.value == tagTitle) {
    selectTag.value = '';
  } else {
    selectTag.value = tagTitle;
  }
}

// 如果URL路径有tag参数, 默认选中指定Tag, 例如: /tags?tag=Git
let tag = getQueryParam('tag');
if (tag && tag.trim() != '') {
  toggleTag(tag);
}

</script>

<template>
  <div class="main-container-tag">
    <!-- 内容 -->
    <div>
      <!-- 标签云 -->
      <Row :gutter="24">
        <!-- 标签列表区域 -->
        <Col :span="24">
        <Card :style="{ width: '100%', marginBottom: '20px' }">
          <Tag @click="toggleTag(String(tagTitle))" v-for="(tag, tagTitle) in tags"
            :class="selectTag === String(tagTitle) ? 'tag-checkable-checked tag-item' : 'tag-item'">
            <span class="tag-title">{{ tagTitle }}</span>
            <span>{{ tag.length }}</span>
          </Tag>
        </Card>
        </Col>

        <!-- 文章列表区域 -->
        <Col :span="24">
        <List v-if="selectTag" :style="{ width: '100%' }">
          <template #header>
            共 {{ tags[selectTag].length }} 篇文章
          </template>
          <ListItem v-for="(article) in tags[selectTag]" :key="article.path">
            <div class="result-item">
              <h3 class="result-item-title">
                <ArticleSvg class="title"></ArticleSvg>
                <a :href="article.path" class="title" target="_self">{{ article.title }}</a>
              </h3>
              <!-- 文章元数据信息 -->
              <ArticleMetadata :article="article" :key="md5(article.date)" />
            </div>
          </ListItem>
        </List>
        <Card :style="{ width: '100%' }" class="no-result" v-if="!selectTag">
          <EmptySvg></EmptySvg>
          <p>点击上方标签，查看标签下的所有文章</p>
        </Card>
        </Col>
      </Row>
    </div>
  </div>
</template>

<style scoped>
/** ---------------Arco样式--------------- */
/** 卡片样式 */
:deep(.arco-card) {
  background: var(--vp-c-bg);
}

:deep(.arco-card-bordered) {
  border: 1px solid var(--vp-c-gutter);
}

:deep(.arco-card-body) {
  color: var(--vp-c-text-1);
}

/** 列表样式 */
:deep(.arco-list) {
  color: var(--vp-c-text-1);
}

:deep(.arco-list-bordered) {
  border: 1px solid var(--vp-c-gutter);
}

:deep(.arco-list-split .arco-list-header) {
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-gutter);
}

:deep(.arco-list-split .arco-list-item:not(:last-child)) {
  border-bottom: 1px solid var(--vp-c-gutter);
}

/** 标签样式 */
:deep(.arco-tag) {
  background-color: var(--vp-c-bg);
}

:deep(.tag-item) {
  padding: 0 7px !important;
}

/** ---------------自定义样式--------------- */
/** 头部样式 */
.main-container-tag .tag-header-wrapper {
  padding: 24px 0;
  margin-bottom: 24px;
  box-shadow: 0 1px 0 0 var(--vp-c-gutter);
  -webkit-box-shadow: 0 1px 0 0 var(--vp-c-gutter);
}

.main-container-tag .tag-header-wrapper .tag-breadcrumb-icon {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.main-container-tag .tag-header-wrapper .tag-breadcrumb-icon .icon-svg {
  position: absolute;
  left: 50%;
  top: 50%;
  margin-left: -8px;
  margin-top: -8px;
  fill: #bec0bf;
}

svg:not(:root) {
  overflow: hidden;
}

.main-container-tag .tag-header-wrapper .tag-breadcrumb-item {
  vertical-align: middle;
  display: inline-block;
  font-size: 16px;
  margin-left: 16px;
}

/** 标签样式 */
.main-container-tag .tag-item {
  color: var(--vp-c-text-1);
  border-radius: 50px;
  line-height: 24px;
  padding: 12px 12px;
  margin: 8px 8px 0 0;
  cursor: pointer;
  border: 1px solid var(--vp-c-gutter);
}

.main-container-tag .tag-title {
  margin-right: 6px;
  word-break: normal;
  white-space: pre-wrap;
}

.main-container-tag .tag-checkable-checked {
  border-color: #3384f5;
  color: #1672f3;
}

.main-container-tag .card-header {
  color: var(--vp-c-text-1);
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (min-width: 1440px) {
  :deep(.VPDoc:not(.has-sidebar) .content) {
    max-width: 1104px;
  }
}

@media (min-width: 960px) {
  :deep(.VPDoc:not(.has-sidebar) .content) {
    max-width: 1104px;
  }
}

:deep(.content-container) {
  max-width: 1104px;
}

/** 文章列表样式 */
.main-container-tag .no-result {
  text-align: center;
}

.main-container-tag .no-result svg {
  height: 300px;
  width: 300px;
  margin: 40px auto 20px;
}

.result-item-title {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  line-height: 22px;
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 16px;
    height: 16px;
  }
}

.result-item-description {
  word-wrap: break-word;
  line-height: 22px;
  font-size: 14px;
  margin: 8px 0;
}

.vp-doc a {
  font-weight: 400;
  font-size: 14px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}

.vp-doc a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.meta-content a {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
</style>
