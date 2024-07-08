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
        <svg class="icon" width="20" height="20" viewBox="0 0 1024 1024">
          <title>原创作者</title>
          <path
            d="M614.72 554.538c-49.086-6.399-100.27-2.1-149.256-2.1-119.465 0-209.04 95.972-206.84 215.437 0 17.095 8.498 31.99 23.493 40.488 14.896 10.697 34.09 14.896 53.285 17.095 61.882 6.398 123.664 6.398 198.342 6.398 40.488 0 93.872-2.1 142.858-4.298 27.692 0 53.284-4.3 78.877-14.896 19.194-8.498 29.89-19.194 31.99-40.488 8.498-104.57-72.478-204.84-172.75-217.636zM680.8 375.39c0-87.474-74.678-162.053-164.251-162.053-89.574 0-162.053 74.679-162.053 162.053-2.1 87.474 74.678 164.252 162.053 164.252 89.673 0 164.252-74.678 164.252-164.252z"
            fill="#FFF" />
          <path
            d="M512.35 0C228.733 0 .5 228.233.5 511.85s228.233 511.85 511.85 511.85 511.85-228.233 511.85-511.85S795.967 0 512.35 0zm275.12 772.074c-2.1 21.294-12.797 31.99-31.991 40.488-25.593 10.697-51.185 14.896-78.877 14.896-49.086 2.099-102.37 4.298-142.858 4.298-74.678 0-136.46 0-198.342-6.398-19.195-2.1-38.389-6.398-53.285-17.095-14.895-8.497-23.493-23.493-23.493-40.488-2.1-119.465 87.475-215.437 206.84-215.437 49.085 0 100.27-4.299 149.256 2.1 100.27 12.896 181.247 113.166 172.75 217.636zM354.495 375.39c0-87.474 72.479-162.053 162.053-162.053S680.8 288.016 680.8 375.39c0 89.574-74.679 164.252-164.252 164.252-87.375 0-164.152-76.778-162.053-164.252z"
            fill="#249FF8" />
        </svg>
        <span>作者：</span>
        <span>
          <a v-if="isOriginal" :href="authorLink" title="进入作者主页" target="_blank">{{ author }}</a>
          <span v-else :title="author">{{ author }}</span>
        </span>
      </div>
      <!-- 作品协议 -->
      <div class="item">
        <svg class="icon" viewBox="0 0 1024 1024">
          <title>作品协议</title>
          <path d="M0 512a512 512 0 1 0 1024 0A512 512 0 1 0 0 512z" fill="#F3B243" />
          <path
            d="M540.672 323.584a90.112 90.112 0 1 0 180.224 0 90.112 90.112 0 1 0-180.224 0zM540.672 688.128a90.112 90.112 0 1 0 180.224 0 90.112 90.112 0 1 0-180.224 0zM229.376 512a90.112 90.112 0 1 0 180.224 0 90.112 90.112 0 1 0-180.224 0z"
            fill="#FFF" />
          <path d="M341.037 480.37l257.344-175.718 27.713 40.592-257.34 175.718z" fill="#FFF" />
          <path d="M349.053 488.452L601.907 670.56l-28.725 39.887L320.307 528.34z" fill="#FFF" />
        </svg>
        <span>版权：</span>
        <span><a :href="licenseLink" target="_self">{{ licenseText }}</a> 许可协议授权</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.copyright {
  border-color: var(--vp-custom-block-tip-border);
  background-color: var(--vp-custom-block-tip-bg);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 15px;
  margin-top: 50px;
}

.copyright .content {

  padding: 13px 16px;
}

.copyright .content .item {
  margin-bottom: 5px;
  word-break: break-word;
  line-height: 22px;
}

.copyright .content .item .icon {
  display: inline-block;
  height: 16px;
  width: 16px;
  margin-right: .375rem;
  vertical-align: -2.5px;
}

a {
  font-weight: 400;
  color: var(--vp-c-text-2);
  text-decoration: none;
}

a:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}
</style>
