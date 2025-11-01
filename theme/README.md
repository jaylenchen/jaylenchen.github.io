# Theme Package

`theme/src` 目录经过整理，按职责拆分如下：

- `components/`
  - `layout/`：自定义布局相关组件（`Layout.vue`、`Comment.vue`、`Copyright.vue`）。
  - `global/`：全局可复用组件（目前为 `ArticleMetadata.vue`）。
- `services/`
  - `http.ts`：Axios 实例封装。
  - `article.ts`：文章视图等业务请求封装。
  - `index.ts`：服务聚合导出，方便扩展更多业务服务。
- `assets/`：静态资源，例如 SVG 图标。
- `pages/`：VitePress 自定义页面（`Archives.vue`、`Home.vue`、`Tags.vue`）。
- `utils/`：通用工具方法。
- `layout/styles/`：主题相关样式（保持原目录，以确保向后兼容）。

公共入口在 `src/index.ts`，会注册布局和全局组件。新增组件或服务时，按照上述目录划分放置即可。

