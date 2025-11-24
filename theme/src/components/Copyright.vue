<script lang="ts" setup>
import { ref } from 'vue'
import { useData } from 'vitepress'

const { theme, frontmatter } = useData()

// 使用可选链和默认值，避免初始化顺序问题
const isOriginal = ref(frontmatter.value?.isOriginal ?? true)
const author = ref(frontmatter.value?.author ?? theme.value?.customConfig?.articleMetadataConfig?.author ?? '')
const authorLink = ref(frontmatter.value?.authorLink ?? theme.value?.customConfig?.articleMetadataConfig?.authorLink ?? '')
const licenseLink = ref('https://creativecommons.org/licenses/by-nc-nd/4.0/deed.en')
const licenseText = ref(theme.value?.customConfig?.copyrightConfig?.license ?? '')
const licenseDisplay = '自由转载-非商用-非衍生-保持署名（创意共享4.0许可证）'
</script>

<template>
  <div class="copyright">
    <div class="content">
      <!-- 作品协议 -->
      <div class="item">
        <div class="item-heading">
          <div class="icon-wrapper">
            <svg class="icon" viewBox="0 0 64 64" aria-hidden="true">
              <title>作品协议</title>
              <circle cx="32" cy="32" r="30" fill="#FFF4E3" />
              <path
                d="M45 18H19a2 2 0 0 0-2 2v22.4c0 1 .4 2 1.1 2.7l7.8 7.9a3 3 0 0 0 4.3 0l2.4-2.4a2.4 2.4 0 0 1 3.4 0l2.4 2.4a3 3 0 0 0 4.3 0l7.8-7.9c.7-.7 1.1-1.7 1.1-2.7V20a2 2 0 0 0-2-2Z"
                fill="#F4B455" />
              <path
                d="M32 38.5a1.6 1.6 0 0 1-1.5-.9l-2.2-4.4-4.9-.7a1.6 1.6 0 0 1-.9-2.7l3.6-3.5-.9-4.9a1.6 1.6 0 0 1 2.3-1.7L32 21l4.4-2.3a1.6 1.6 0 0 1 2.3 1.7l-.9 4.9 3.6 3.5a1.6 1.6 0 0 1-.9 2.7l-4.9.7-2.2 4.4a1.6 1.6 0 0 1-1.4.9Z"
                fill="#FFF7E8" />
            </svg>
          </div>
          <span class="label">版权：</span>
        </div>
        <div class="item-body">
          <span class="value">
            自由转载-非商用-非衍生-保持署名（<a
              :href="licenseLink"
              target="_blank"
              rel="noopener"
            >创意共享4.0许可证</a>）
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.copyright {
  margin: 2rem auto 0;
  padding: 1rem 1.2rem;
  max-width: 760px;
  background: #f8f9fa;
  border: none;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 5px -1px rgba(0, 0, 0, 0.08), 0 1px 5px -1px rgba(0, 0, 0, 0.08);
  transition: all 200ms ease;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  word-break: break-word;
}

.item-heading {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}

.item-body {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex: 1 1 auto;
  min-width: 0;
  flex-wrap: wrap;
}

.value {
  display: inline;
  white-space: normal;
}

.icon-wrapper {
  width: 24px;
  height: 24px;
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
  border-bottom: 1px solid rgba(74, 144, 226, 0.4);
  padding-bottom: 1px;
}

a:hover {
  color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .copyright {
    padding: 0.8rem 1rem;
    border-radius: 8px;
    margin: 1.5rem auto 0;
  }

  .item {
    align-items: flex-start;
    gap: 0.4rem;
  }

  .item-heading {
    gap: 0.25rem;
  }

  .item-body {
    font-size: 0.85rem;
  }
}
</style>