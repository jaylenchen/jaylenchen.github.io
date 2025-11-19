<script lang="ts" setup>
import { reactive, toRefs, onMounted, onBeforeUnmount } from 'vue';
import { useData } from 'vitepress';
import md5 from 'blueimp-md5';

// 定义属性
const props = defineProps({
  commentConfig: Object,
});

const data = reactive({
  type: props.commentConfig?.type ?? 'gitalk',
})
const { type } = toRefs(data);

const { page } = useData();

// 延迟加载 Gitalk 和相关依赖
let gitalk: any = null;
let $: any = null;
let message: any = null;

// 渲染评论组件
onMounted(async () => {
  if (type.value && type.value == 'gitalk') {
    // 动态导入 Gitalk 和相关依赖
    const [{ default: Gitalk }, { default: jQuery }, { message: antdMessage }] = await Promise.all([
      import('gitalk'),
      import('jquery'),
      import('ant-design-vue')
    ]);
    
    // 动态导入 CSS
    await import('../styles/gitalk.css');
    
    $ = jQuery;
    message = antdMessage;
    
    gitalk = new Gitalk({
      clientID: 'Ov23ctNqkutw4PpaBPRA',
      clientSecret: 'ad3ee60be331e7aef649191ee9ba212f0d9eda2c',
      repo: 'jaylenchen.github.io',
      owner: 'jaylenchen',
      admin: ['jaylenchen'],
      id: md5(page.value.relativePath),
      language: 'zh-CN',
      distractionFreeMode: true,
    });
    
    gitalk.render('comment-container')

    // 如果点赞，先判断有没有登录
    const $gc = $('#comment-container');
    $gc.on('click', '.gt-comment-like', function () {
      if (typeof window !== 'undefined' && !window.localStorage.getItem('GT_ACCESS_TOKEN')) {
        message.warning({
          content: '点赞前请先使用Github进行登录~',
        })

        return false
      }
      return true
    })
    // 提交评论后输入框高度没有重置bug
    $gc.on('click', '.gt-header-controls .gt-btn-public', function () {
      const $gt = $('.gt-header-textarea')
      $gt.css('height', '72px')
    })
    // 点击预览时，隐藏评论按钮
    $gc.on('click', '.gt-header-controls .gt-btn-preview', function () {
      $('.gt-header-controls .gt-btn-public').css('display', 'none')
    })
  }
})

onBeforeUnmount(() => {
  // 清理事件监听
  if ($ && gitalk) {
    const $gc = $('#comment-container');
    $gc.off('click', '.gt-comment-like');
    $gc.off('click', '.gt-header-controls .gt-btn-public');
    $gc.off('click', '.gt-header-controls .gt-btn-preview');
  }
})
</script>

<template>
  <section class="comment">
    <div id="comment-container"></div>
  </section>
</template>

<style scoped>
.comment {
  margin-top: 48px;
}
</style>
