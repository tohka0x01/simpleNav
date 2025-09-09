## Autoread — 部署到 Cloudflare Pages（Vue 3 + Functions + KV）

一个极简的导航站点：前端使用 Vite + Vue 3，后端使用 Cloudflare Pages Functions 提供 API，并通过 Cloudflare KV 存储站点与分类数据。

特性概览：
- 前端目录在 `web/`，生产构建输出到 `web/dist`
- 无服务器 API 位于 `web/functions/`（Pages Functions 自动路由到 `/api/*`）
- 数据存储使用 KV 命名空间绑定为 `SITES`
- 管理台路由 `/admin`，通过环境变量 `ADMIN_KEY` 简单鉴权

---

### 目录结构
```
.
├─ web/
│  ├─ src/                 # Vue 3 源码
│  │  ├─ pages/            # Home/Admin 页面
│  │  └─ ui/               # 组件
│  ├─ functions/           # Cloudflare Pages Functions（API）
│  ├─ public/              # 静态资源
│  ├─ index.html           # Vite 入口
│  ├─ package.json         # 前端依赖与脚本
│  └─ dist/                # 构建输出（CI/CD 生成）
└─ README.md
```

### 在线部署（Cloudflare Pages + Git）
1) 在 GitHub 上 Fork/导入本仓库。
2) 打开 Cloudflare Dashboard → Pages → Create a project → Connect to Git。
3) 选择你的仓库，进入构建设置：
   - Framework preset: None（或保持自动）
   - Root directory: `web`（重要：这样会自动识别 `web/functions/` 为 Functions）
   - Build command: `npm ci && npm run build`
   - Build output directory: `dist`
4) 创建项目完成后，Cloudflare 将自动首发到 `*.pages.dev` 预览域名。

> 如果不设置 Root directory，Pages 会在仓库根查找 `functions` 目录，可能导致未拾取 `web/functions/` 中的 API。请按上方设置为 `web`。

### 绑定 KV（SITES）
后端 API 使用 Cloudflare KV 存储数据。请在 Pages 项目中绑定一个命名空间：
1) Cloudflare Dashboard → Pages → 你的项目 → Settings → Functions → KV Bindings → Add binding。
2) Variable name 填写：`SITES`（必须与代码一致）。
3) 选择或创建一个 KV Namespace。
4) 初始化数据（推荐）：进入 Workers & Pages → KV → 打开你的命名空间 → Add key-value，添加：
   - Key: `sites`，Value: `[]`
   - Key: `categories`，Value: `[]`

### 配置环境变量（ADMIN_KEY）
管理台与写入类 API 通过简单的 Bearer Token 校验：
- 位置：Pages → 你的项目 → Settings → Environment variables
- 新增变量：`ADMIN_KEY = <生成一串强随机密钥>`（建议 32+ 字符）
- 若使用预览环境（Preview），可在 “Preview” 选项卡中同步设置相同变量。

前端使用本地存储保存该 Key：
- 首页右上角点击“⚙️”或直接访问 `/admin`，按提示输入 `ADMIN_KEY` 后即可管理站点。

### 路由与 API 说明
- 页面路由：
  - `/` 公开主页
  - `/admin` 管理台（需要输入 `ADMIN_KEY` 才能访问写入接口）

- 公开 API（无需鉴权）：
  - `GET /api/categories/list` → `{ categories: Array<{name, desc}> }`
  - `GET /api/sites/public` → `{ sites: Array<Site> }`
  - `POST /api/sites/click` → `{ ok, clicks }`（记录点击次数）

- 受保护 API（需请求头 `Authorization: Bearer <ADMIN_KEY>`）：
  - `GET /api/sites/list` → 管理台使用，列出所有站点
  - `POST /api/sites/add`
  - `POST /api/sites/update`
  - `POST /api/sites/delete`
  - `POST /api/categories/add`
  - `POST /api/categories/update`
  - `POST /api/categories/delete`
  - `GET  /api/auth/verify` → 校验 key 是否有效

示例（将 KEY 替换为你的 `ADMIN_KEY`）：
```bash
curl -H "Authorization: Bearer KEY" https://<your>.pages.dev/api/sites/list
curl -X POST -H "content-type: application/json" -H "Authorization: Bearer KEY" \
  -d '{"title":"Google","url":"https://google.com","category":"工具"}' \
  https://<your>.pages.dev/api/sites/add
```

### 本地开发
- 仅前端（Vite）：
  ```bash
  cd web
  npm i
  npm run dev
  # 访问 http://localhost:5173 （仅前端，API 不可用）
  ```

- 使用 Cloudflare 预览 Functions（推荐：通过 Pages 预览环境）：
  推送到 Git 即会触发 Pages 预览部署，预览环境会继承你设置的 KV 绑定与环境变量。

> 也可使用 Wrangler 在本地模拟 Pages/Functions；不同版本命令略有差异，请参考 Cloudflare 官方文档（wrangler pages dev）。

### 自定义域名（可选）
Pages 项目 → Custom domains 绑定你自己的域名，按指引添加 DNS 记录并完成验证即可。

### 常见问题（FAQ）
- 访问 `/admin` 提示未授权/无法保存：
  - 确认已在 Pages 环境变量里设置 `ADMIN_KEY`，且输入一致
  - 确认 KV 已绑定到变量名 `SITES`
- API 返回 404/500：
  - 检查是否将 Root directory 配置为 `web`，从而正确加载 `web/functions/`
  - 在 KV 中初始化 `sites=[]` 与 `categories=[]`
- 看不到 Functions 生效：
  - Pages 只识别项目 Root 的 `functions` 目录。务必按照上文将 Root directory 设置为 `web`

### 安全提示
- `ADMIN_KEY` 为简单 Bearer 鉴权，请务必设置为强随机值并妥善保管。
- 也可在 Cloudflare Zero Trust 中对路由 `/admin` 配置 Access 规则，进一步限制可访问的账号范围（与代码鉴权可叠加使用）。

### 许可证
本项目用于演示与自部署，按你的仓库策略选择合适的 License。

