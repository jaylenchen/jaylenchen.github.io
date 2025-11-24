# Vercel 部署说明

本文档详细说明如何将博客部署到 Vercel。

## 📋 前置要求

### 1. Vercel 账户

- ✅ 已注册 Vercel 账户
- ✅ 已登录 Vercel Dashboard

### 2. Vercel 项目

有两种方式创建 Vercel 项目：

- **方式一（推荐）**：通过 GitHub 集成导入项目（会自动触发第一次构建）
- **方式二**：通过 Vercel CLI 手动创建项目

### 3. 获取 Vercel 凭证

需要以下三个凭证：

1. **VERCEL_TOKEN** - Vercel API Token
2. **VERCEL_ORG_ID** - Vercel Team/Organization ID
3. **VERCEL_PROJECT_ID** - Vercel Project ID

---

## 🚀 完整设置流程

### 步骤 1: 创建 Vercel Token

在创建项目之前，先获取 Token：

1. 访问 [Vercel Settings > Tokens](https://vercel.com/account/tokens)
2. 点击 **"Create Token"**
3. 输入 Token 名称（如：`github-actions-deploy`）
4. 设置过期时间（建议：`No Expiration`）
5. 点击 **"Create"**
6. **复制并保存 Token**（只显示一次，非常重要！）

### 步骤 2: 创建 Vercel 项目

#### 方法一：通过 GitHub 集成导入（推荐）

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 如果还没有连接 GitHub，点击 **"Import Git Repository"** 并授权 GitHub
4. 找到你的 GitHub 仓库，点击 **"Import"**
5. 配置项目：
   - **Project Name**: 会自动填充，可以修改
   - **Framework Preset**: 选择 `Other` 或 `Vite`（不重要，因为我们使用 `vercel.json` 配置）
   - **Root Directory**: 保持默认或设置为 `./`（如果配置文件在根目录）
   - **Build and Output Settings**: 保持默认（我们会在 `vercel.json` 中配置）
6. 点击 **"Deploy"**
7. **等待第一次部署完成**（这会自动触发构建）

#### 方法二：通过 Vercel CLI（可选）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 在项目根目录执行，创建新项目
vercel

# 按照提示选择：
# - Set up and deploy? Yes
# - Which scope? 选择你的账户或团队
# - Link to existing project? No
# - What's your project's name? 输入项目名称
# - In which directory is your code located? ./
# - Want to override the settings? No

# 项目创建后，会在 .vercel 目录生成配置文件
```

### 步骤 3: 获取 Project ID 和 Org ID

**⚠️ 重要**：项目创建后（无论是通过哪种方式），都需要获取 Project ID 和 Org ID。

#### 方法一：通过 Vercel Dashboard（最简单）

1. 进入你的项目页面（在 Vercel Dashboard 中点击项目）
2. 点击 **"Settings"** 标签页
3. 在左侧菜单中选择 **"General"**
4. 找到以下信息：

   - **Project ID** → 这就是 `VERCEL_PROJECT_ID`
     - 格式：`prj_xxxxxxxxxxxxx`
     - 示例：`prj_abc123def456`
   
   - **Team ID** 或 **Personal Account ID** → 这就是 `VERCEL_ORG_ID`
     - 如果是个人账户：格式为 `xxxxxxxxxxxxx`（纯字符串，没有前缀）
     - 如果是团队账户：格式为 `team_xxxxxxxxxxxxx`
     - 在页面上可能显示为：
       - "Team ID: team_xxxxx" 或
       - "Account ID: xxxxx"

5. **复制这两个 ID** 并保存

**截图说明**：
- 在 Settings → General 页面，向下滚动可以看到：
  - `Project ID` 在 "Project Information" 部分
  - `Team ID` 或 `Account ID` 在 "Team" 或 "Account" 部分

#### 方法二：通过 Vercel CLI（如果使用方法二创建项目）

如果你已经通过 CLI 创建了项目，配置文件会自动生成：

```bash
# 查看 Project ID
cat .vercel/project.json
# 输出示例：
# {
#   "projectId": "prj_xxxxxxxxxxxxx",
#   "orgId": "team_xxxxxxxxxxxxx" 或 "xxxxxxxxxxxxx"
# }

# 查看 Org ID（如果在团队中）
cat .vercel/org.json
# 输出示例：
# {
#   "id": "team_xxxxxxxxxxxxx"
# }
```

**注意**：
- 如果 `project.json` 中的 `orgId` 存在，就使用它
- 如果不存在，使用 `org.json` 中的 `id`
- 个人账户的 Org ID 没有 `team_` 前缀，团队账户有 `team_` 前缀

#### 方法三：通过 Vercel API（高级）

如果你已经有 Token，也可以通过 API 获取：

```bash
# 获取所有项目列表（会包含 Project ID）
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v9/projects

# 获取团队/账户信息（会包含 Org ID）
curl -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  https://api.vercel.com/v2/teams
```

---

## 📝 获取凭证总结

### 快速检查清单

完成以下步骤后，你应该拥有：

- [ ] ✅ **VERCEL_TOKEN**: 从 [Settings > Tokens](https://vercel.com/account/tokens) 获取
- [ ] ✅ **VERCEL_PROJECT_ID**: 从项目 Settings → General 获取（格式：`prj_xxx`）
- [ ] ✅ **VERCEL_ORG_ID**: 从项目 Settings → General 获取（可能是 `team_xxx` 或纯字符串）

### 常见问题

**Q: 我还没有在 Vercel 创建项目，能先获取 Project ID 吗？**

A: **不能**。Project ID 只有在项目创建后才会生成。建议流程：
1. 先创建 Token（可以在任何时候创建）
2. 通过 GitHub 集成导入项目（会自动创建项目并触发第一次构建）
3. 在项目 Settings → General 页面获取 Project ID 和 Org ID

**Q: 通过 GitHub 集成导入会触发构建，但我还没配置好，怎么办？**

A: 没关系！第一次构建可能会失败或使用默认配置，这不会影响你获取 Project ID 和 Org ID。你可以：
1. 先导入项目（创建项目）
2. 获取 Project ID 和 Org ID
3. 在 GitHub Secrets 中配置
4. 后续的部署会使用 GitHub Actions 工作流，而不是 Vercel 的自动构建

**Q: 我的项目已经存在了，在哪里找 Project ID？**

A: 在 Vercel Dashboard → 选择项目 → Settings → General 页面，向下滚动即可看到。

---

## 🔐 配置 GitHub Secrets

在 GitHub 仓库中配置 Vercel 凭证：

1. 进入仓库设置：`Settings` → `Secrets and variables` → `Actions`
2. 点击 **"New repository secret"**
3. 添加以下三个 Secrets：

   | Secret 名称 | 说明 | 示例值 |
   |------------|------|--------|
   | `VERCEL_TOKEN` | Vercel API Token | `xxxxxxxxxxxxxxxxxxxx` |
   | `VERCEL_ORG_ID` | Vercel Team/Org ID | `team_xxxxxxxxxxxx` 或 `xxxxxxxxxxxx` |
   | `VERCEL_PROJECT_ID` | Vercel Project ID | `prj_xxxxxxxxxxxx` |

4. 点击 **"Add secret"** 保存

---

## 🔧 工作流文件

### 部署工作流 (`deploy-vercel.yml`)

**位置**: `.github/workflows/deploy-vercel.yml`

**功能**: 可复用的 Vercel 部署任务

**触发方式**: 
- 自动触发：Push 到 `main` 分支
- 手动触发：通过 `deploy.yml` 调用（选择 `vercel`）

**执行步骤**:

1. **检出代码**
   - 从 GitHub 仓库检出最新代码

2. **安装 Vercel CLI**
   - 全局安装最新版本的 Vercel CLI

3. **拉取环境信息**
   - 使用 Vercel CLI 拉取项目配置和环境变量

4. **构建项目产物**
   - 使用 Vercel CLI 构建项目（优化构建）

5. **部署到 Vercel**
   - 部署构建产物到 Vercel 生产环境

---

## ⚙️ Vercel 配置文件

### `vercel.json`

**位置**: 项目根目录 `vercel.json`

**配置内容**:

```json
{
  "buildCommand": "yarn install && yarn build:docs",
  "outputDirectory": "docs/.vitepress/dist",
  "framework": null,
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot))",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**配置说明**:

- `buildCommand`: 构建命令，用于本地构建验证
- `outputDirectory`: 构建输出目录
- `cleanUrls`: 启用无扩展名 URL（如 `/about` 而非 `/about.html`）
- `trailingSlash`: 禁用尾部斜杠
- `headers`: 安全头和缓存策略
  - 所有路由添加安全头
  - 静态资源设置长期缓存

### `.vercelignore`

**位置**: 项目根目录 `.vercelignore`

**作用**: 指定 Vercel 部署时忽略的文件和目录

**配置内容**:

```
node_modules
.git
.github
.vscode
*.log
.DS_Store
.env.local
.env.*.local
```

---

## 🚀 部署流程

### 自动触发

当推送代码到 `main` 分支时，会自动触发 Vercel 部署：

```bash
git push origin main
```

### 手动触发

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 选择 **"Deploy Blog"** 工作流
3. 点击右上角 **"Run workflow"** 按钮
4. 在部署目标下拉菜单中选择 **`vercel`**（默认）
5. 点击 **"Run workflow"** 开始部署

### 部署流程

```mermaid
flowchart TD
    Start([Push 到 main 或手动触发])
    Start --> AutoCheck{触发方式}
    AutoCheck -->|Push| AutoDeploy[自动部署到 Vercel]
    AutoCheck -->|手动| ManualSelect[选择 vercel]
    ManualSelect --> ManualDeploy[手动部署到 Vercel]
    
    AutoDeploy --> Deploy[执行部署任务<br/>deploy-vercel.yml]
    ManualDeploy --> Deploy
    
    Deploy --> Checkout[检出代码仓库]
    Checkout --> InstallCLI[安装 Vercel CLI]
    InstallCLI --> PullEnv[拉取 Vercel 环境信息]
    PullEnv --> Build[构建项目产物<br/>Vercel 优化]
    Build --> DeployVercel[部署到 Vercel 生产环境]
    DeployVercel --> Success[✅ 部署成功<br/>https://jaylenchen.vercel.app]
    
    style Start fill:#e1f5ff
    style Success fill:#d4edda
    style Build fill:#fff3cd
    style Deploy fill:#f8d7da
```

---

## 🌐 访问地址

部署成功后，博客将在以下地址可访问：

### 默认地址

- **生产环境**: `https://jaylenchen.vercel.app`
- **预览环境**: 每次部署会生成唯一的预览 URL

### 自定义域名

如果配置了自定义域名，可通过该域名访问。

**配置自定义域名**:

1. 进入 Vercel Dashboard → `Project Settings` → `Domains`
2. 点击 **"Add Domain"**
3. 输入你的域名（如：`blog.example.com`）
4. 按照提示配置 DNS 记录
5. 等待 DNS 生效（通常几分钟到几小时）

---

## 🔍 故障排除

### 问题 1: 部署失败，提示 "Invalid token"

**原因**: `VERCEL_TOKEN` 无效或已过期

**解决方案**:

1. 访问 [Vercel Settings > Tokens](https://vercel.com/account/tokens)
2. 检查 Token 是否仍然有效
3. 如果无效，创建新 Token
4. 更新 GitHub Secrets 中的 `VERCEL_TOKEN`

### 问题 2: 部署失败，提示 "Project not found"

**原因**: `VERCEL_ORG_ID` 或 `VERCEL_PROJECT_ID` 不正确

**解决方案**:

1. 确认项目是否存在于 Vercel
2. 重新获取 `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`
3. 检查 GitHub Secrets 中的值是否正确
4. 注意：如果是团队项目，`VERCEL_ORG_ID` 应为团队 ID

### 问题 3: 构建失败

**可能原因**:

1. **构建命令错误**
   - 检查 `vercel.json` 中的 `buildCommand`
   - 本地测试构建命令是否成功

2. **依赖安装失败**
   - 检查 `package.json` 和 `yarn.lock`
   - 确保所有依赖版本兼容

3. **Node.js 版本不匹配**
   - Vercel 默认使用 Node.js 18
   - 可在 `package.json` 中指定版本：
     ```json
     {
       "engines": {
         "node": "20"
       }
     }
     ```

**解决方案**:

```bash
# 本地测试构建
yarn install
yarn build:docs

# 本地测试 Vercel CLI
vercel login
vercel build --prod
```

### 问题 4: 部署成功但页面显示错误

**可能原因**:

1. **输出目录不正确**
   - 检查 `vercel.json` 中的 `outputDirectory`
   - 确保与构建输出路径一致

2. **路由配置问题**
   - VitePress 的 `base` 配置可能与 Vercel 不匹配
   - 检查 `docs/.vitepress/config.ts` 中的 `base` 设置

3. **环境变量缺失**
   - 检查 Vercel Dashboard 中的环境变量
   - 确保生产环境变量已配置

**解决方案**:

1. 检查 Vercel 部署日志中的错误信息
2. 在 Vercel Dashboard 中查看函数日志
3. 使用 Vercel CLI 本地测试：

```bash
vercel dev
```

### 问题 5: 资源加载失败（404）

**原因**: 静态资源路径不正确

**解决方案**:

1. 检查 `vercel.json` 中的 `headers` 配置
2. 确保静态资源路径在构建输出中存在
3. 检查 VitePress 的 `base` 配置是否正确

---

## ✅ 验证部署

### 1. 检查 Actions 日志

1. 进入 **Actions** 标签页
2. 查看最新的工作流运行
3. 确认所有步骤都显示 ✅ 绿色

### 2. 检查 Vercel Dashboard

1. 进入 Vercel Dashboard
2. 查看项目的 **Deployments** 标签页
3. 确认最新部署状态为 ✅ Ready

### 3. 访问网站

在浏览器中访问部署地址，确认：
- ✅ 页面正常加载
- ✅ 样式正确显示
- ✅ 链接正常工作
- ✅ 图片正常显示
- ✅ 路由跳转正常

---

## 🔄 环境变量配置

### 在 Vercel Dashboard 中配置

1. 进入项目设置：`Project Settings` → `Environment Variables`
2. 点击 **"Add New"**
3. 输入变量名称和值
4. 选择应用环境（Production, Preview, Development）
5. 点击 **"Save"**

### 在 GitHub Actions 中使用

如果需要在部署时使用环境变量，可以在 `deploy-vercel.yml` 中配置：

```yaml
steps:
  - name: Deploy project artifacts to Vercel
    run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      # 添加其他环境变量
      MY_ENV_VAR: ${{ secrets.MY_ENV_VAR }}
```

---

## 📚 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [VitePress 部署文档](https://vitepress.dev/guide/deploy)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ⚠️ 注意事项

1. **Token 安全**: 永远不要在代码中硬编码 `VERCEL_TOKEN`，始终使用 GitHub Secrets

2. **构建时间**: Vercel 免费账户有构建时间限制，注意控制构建频率

3. **并发部署**: `deploy.yml` 中已配置并发控制，同一时间只允许一个部署运行

4. **预览部署**: Vercel 会为每个 Pull Request 创建预览部署，这不会消耗生产环境的配额

5. **自定义域名**: 使用自定义域名时，确保 DNS 配置正确，并等待 DNS 生效

6. **环境变量**: 敏感信息应使用 Vercel Dashboard 的环境变量功能，而非硬编码在代码中

7. **构建缓存**: Vercel 会自动缓存依赖和构建产物以加速后续部署

