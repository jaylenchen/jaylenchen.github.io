<script lang="ts" setup>
import { ref } from 'vue'
import { useData } from 'vitepress'

const { theme, frontmatter } = useData()

const isOriginal = ref(frontmatter.value?.isOriginal ?? true)
const author = ref(frontmatter.value?.author ?? theme.value.customConfig.articleMetadataConfig.author)
const authorLink = ref(frontmatter.value?.authorLink ?? theme.value.customConfig.articleMetadataConfig.authorLink)
const licenseLink = ref(theme.value.customConfig.copyrightConfig?.licenseLink)
const licenseText = ref(theme.value.customConfig.copyrightConfig?.license)
</script>

<template>
  <div class="copyright">
    <div class="content">
      <!-- 版权属于 -->
      <div class="item">
        <div class="icon-wrapper">
          <svg class="icon" width="22" height="22" viewBox="0 0 1024 1024">
            <title>原创作者</title>
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64"
              fill="#EBF2FF" />
            <path
              d="M542.7 352c0-86-69.7-155.7-155.7-155.7S231.3 266 231.3 352c0 86 69.7 155.7 155.7 155.7S542.7 438 542.7 352"
              fill="#8CAAF4" />
            <path
              d="M701.3 668.2c-67.2-8.7-98.7-4.3-176-4.3-141.3 0-232.5 113.8-229.5 255 0 12.8 6.4 23.5 17.9 30.7 13.6 9 31.5 12.3 49.6 14 57.5 5.9 115 5.9 182.5 5.9 37.3 0 86.1-2 123.5-3.9 23.1 0 43-3.9 63.1-13.1 15.4-6.9 24-15.7 26-30.7 7-123-81.6-239.2-157.6-253.6z"
              fill="#5C8EF3" />
          </svg>
        </div>
        <span class="label">作者：</span>
        <span>
          <a v-if="isOriginal" :href="authorLink" title="进入作者主页" target="_blank">{{ author }}</a>
          <span v-else :title="author">{{ author }}</span>
        </span>
      </div>
      <!-- 作品协议 -->
      <div class="item">
        <div class="icon-wrapper">
          <svg class="icon" viewBox="0 0 1024 1024">
            <title>作品协议</title>
            <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64" fill="#FFF4DC" />
            <path
              d="M342.4 512a90.1 90.1 0 1 0 180.2 0 90.1 90.1 0 1 0-180.2 0zM598.9 323.6a90.1 90.1 0 1 0 180.2 0 90.1 90.1 0 1 0-180.2 0zM598.9 688.1a90.1 90.1 0 1 0 180.2 0 90.1 90.1 0 1 0-180.2 0z"
              fill="#F5B956" />
            <path d="M359.4 480.4l257.3-175.7 27.7 40.6-257.3 175.7z" fill="#F5B956" />
            <path d="M367.4 488.5 620.3 670.6l-28.7 39.9L338.6 528.3z" fill="#F5B956" />
          </svg>
        </div>
        <span class="label">版权：</span>
        <span><a :href="licenseLink" target="_self">{{ licenseText }}</a> 许可协议授权</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.copyright {
  margin: 3rem auto 0;
  padding: 1.4rem 1.6rem;
  max-width: 760px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(120, 150, 220, 0.25);
  border-radius: 18px;
  color: var(--vp-c-text-2);
  font-size: 0.98rem;
  backdrop-filter: blur(6px);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  word-break: break-word;
}

.icon-wrapper {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon {
  width: 100%;
  height: 100%;
}

.label {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

a {
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-bottom: 1px solid rgba(120, 150, 220, 0.4);
  padding-bottom: 1px;
}

a:hover {
  color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .copyright {
    padding: 1.2rem 1.3rem;
    border-radius: 16px;
  }
}
</style>
