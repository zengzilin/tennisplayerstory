# TennisHub Next.js 迁移 — 交接文档

> **最后更新**: 2026-04-13
> **迁移范围**: Vite+React SPA → Next.js 15 App Router + Hostinger VPS 部署
> **当前状态**: ✅ `npm run build` 通过，核心 UI 组件已迁移，约 18 个页面待迁移

---

## 一、项目概览

**TennisHub** 是一个多语言网球平台，功能包括：实时比赛比分、球员排名、多语言体育文章。

### 技术栈

| 层级 | 旧技术 | 目标技术 |
|------|--------|---------|
| 前端 | React 18 + Vite + React Router v7 | Next.js 15 App Router |
| API | Express v5 + Cheerio | Next.js Route Handlers (`app/api/`) |
| 定时任务 | node-cron | 独立 cron 脚本（通过 curl 调用 API） |
| 数据库 | PocketBase (外部服务) | 不变 |
| 样式 | Tailwind CSS v3 + shadcn/ui | 不变 |
| i18n | i18next | next-intl |
| 认证 | AuthContext | NextAuth.js (Auth.js) + PocketBase Provider |

### 语言路由

5 种语言，URL 本地化：`/en/`, `/zh/球员`, `/ja/プレイヤー`, `/es/jugadores`, `/fr/joueurs`

### 部署目标

Hostinger VPS，Node.js 20+，通过 PM2 管理进程。

---

## 二、已完成的迁移

### ✅ 项目初始化

- `apps/web/` 已创建为 Next.js 15 项目（TypeScript + Tailwind + ESLint + App Router + `src/` 目录）
- `src/` 目录下原有 React 代码已全部迁移进来
- `@/*` alias 已配置指向 `src/`
- `next.config.ts` 已配置
- `tailwind.config.ts` 和 `postcss.config.mjs` 已适配

### ✅ 核心配置

- **next-intl** 已配置（`src/i18n/`），语言文件结构为 `en.json` 等
- **middleware.ts** 已配置（语言路由重定向 + 认证保护占位）
- **环境变量** `.env.local` 已配置（`NEXT_PUBLIC_PB_URL`、`PB_URL` 等）

### ✅ 已迁移为 `.tsx` 的 UI 组件（3个）

| 组件 | 路径 | 说明 |
|------|------|------|
| Button | `src/components/ui/button.tsx` | 含 cva 变体、asChild 支持 |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Radix UI，Portal/Sub/RadioGroup 无 forwardRef |
| Sheet | `src/components/ui/sheet.tsx` | Radix Dialog 侧边抽屉 |

### ✅ 已迁移的 App Router 页面（2个）

| 页面 | 路径 | 说明 |
|------|------|------|
| 根布局 | `src/app/[lang]/layout.tsx` | 正确使用 `async ({ params })` + `await params` |
| 隐私政策 | `src/app/[lang]/privacy-policy/page.tsx` | 客户端组件，使用 `useParams()` |
| 服务条款 | `src/app/[lang]/terms-of-service/page.tsx` | 客户端组件，使用 `useParams()` |

### ✅ ESLint/TypeScript 问题修复（已完成）

- **`button.tsx`**: 移除 `[key: string]: unknown` index signature（导致 `cva()` 中 `className` 类型为 `unknown`）
- **`dropdown-menu.tsx`**: `DropdownMenuPortal`、`DropdownMenuSub`、`DropdownMenuRadioGroup` 改为纯函数组件（Radix 底层不支持 `ref`）
- **`privacy-policy/page.tsx`**: 移除 `async`，改用 `useParams()` hook
- **`terms-of-service/page.tsx`**: 同上
- **`Header.tsx`**: `getLocalizedRouteSegment` 参数加 `_` 前缀消除 ESLint unused var 警告
- **`use-toast.js`**: `actionTypes` 改名为 `_actionTypes`

---

## 三、关键技术与坑点

### 1. Next.js 15 `params` 类型

```typescript
// Server Component — 必须 async + await
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  // ...
}

// Client Component ('use client') — 必须用 useParams()，不能用 await
'use client';
import { useParams } from 'next/navigation';
const Page = () => {
  const params = useParams();
  const lang = params.lang as LangCode;
  // ...
};
```

**禁止**: 在客户端组件中 `async` + `await params` + `useTranslations()` — ESLint 会报错（hooks 不能在 async 函数中调用）。

### 2. `class-variance-authority` + TypeScript

```typescript
// ❌ 错误：有 index signature 时 className 类型为 unknown
type ButtonAllProps = VariantProps<typeof buttonVariants> & {
  [key: string]: unknown  // 不要加这个
  className?: string
  // ...
}

// ✅ 正确：显式列举每个属性
type ButtonAllProps = VariantProps<typeof buttonVariants> & {
  className?: string
  asChild?: boolean
  children?: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
}
```

### 3. Radix UI primitives + forwardRef

`@radix-ui/react-dropdown-menu` 的 `Portal`、`Sub`、`RadioGroup` 组件**不支持 `ref` prop**。对它们使用 `React.forwardRef` 会导致 TypeScript 报错。解决方案：使用纯函数组件包裹，不传递 ref。

```tsx
// ❌ 错误
const DropdownMenuPortal = React.forwardRef<...>(({ ...props }, ref) => (
  <DropdownMenuPrimitive.Portal ref={ref} {...props} />
))

// ✅ 正确
const DropdownMenuPortal = ({ ...props }: ...) => (
  <DropdownMenuPrimitive.Portal {...props} />
)
```

### 4. shadcn/ui 组件 `"use client"` 指令

所有需要交互的组件必须加 `"use client"`：
- button, input, textarea, select, checkbox, radio-group
- dialog, sheet, alert-dialog, popover, dropdown-menu
- toast, toaster, sonner
- tabs, accordion, collapsible
- slider, toggle, switch, carousel 等

纯展示型组件（Card, Badge, Avatar, Separator, etc.）不需要。

---

## 四、待完成的工作

### 🔴 高优先级（阻断构建）

**4.1 将剩余 18 个页面从 `pages-legacy/` 迁移到 App Router**

路径：`apps/web/src/app/[lang]/`

| 页面 | 原文件 | 目标文件 | 备注 |
|------|--------|---------|------|
| 首页 | `pages-legacy/HomePage.jsx` | `app/[lang]/page.tsx` | 覆盖现有占位页 |
| 球员列表 | `pages-legacy/PlayersPage.jsx` | `app/[lang]/players/page.tsx` | |
| 球员详情 | `pages-legacy/PlayerDetailPage.jsx` | `app/[lang]/players/[id]/page.tsx` | 动态路由 |
| 排名 | `pages-legacy/RankingsPage.jsx` | `app/[lang]/rankings/page.tsx` | |
| 直播比赛 | `pages-legacy/LiveMatchesPage.jsx` | `app/[lang]/live-matches/page.tsx` | |
| 文章列表 | `pages-legacy/StoriesPage.jsx` | `app/[lang]/stories/page.tsx` | |
| 写文章 | `pages-legacy/WriteArticlePage.jsx` | `app/[lang]/write-article/page.tsx` | 需要认证 |
| 我的文章 | `pages-legacy/MyArticlesPage.jsx` | `app/[lang]/my-articles/page.tsx` | 需要认证 |
| 用户资料 | `pages-legacy/UserProfilePage.jsx` | `app/[lang]/profile/page.tsx` | 需要认证 |
| 登录 | `pages-legacy/LoginPage.jsx` | `app/[lang]/login/page.tsx` | |
| 注册 | `pages-legacy/SignupPage.jsx` | `app/[lang]/signup/page.tsx` | |
| 忘记密码 | `pages-legacy/ForgotPasswordPage.jsx` | `app/[lang]/forgot-password/page.tsx` | |
| 重置密码 | `pages-legacy/ResetPasswordPage.jsx` | `app/[lang]/reset-password/page.tsx` | |
| 管理后台 | `pages-legacy/AdminDashboard.jsx` | `app/[lang]/admin/page.tsx` | Admin only |
| 爬虫管理 | `pages-legacy/AdminScrapingDashboard.jsx` | `app/[lang]/admin/scraping/page.tsx` | Admin only |
| 文章管理 | `pages-legacy/AdminArticlesPage.jsx` | `app/[lang]/admin/articles/page.tsx` | Admin only |
| 球员管理 | `pages-legacy/PlayerManagementPage.jsx` | `app/[lang]/admin/players/page.tsx` | Admin only |
| Sitemap | `pages-legacy/SitemapPage.jsx` | `app/sitemap.ts` | Server Component |

**迁移规则**：
1. `.jsx` → `.tsx`
2. 客户端组件（使用 hooks）加 `'use client'`；服务端数据获取改为 async/await
3. `useNavigate()` → `useRouter()` from `next/navigation`
4. `Navigate to` → `router.push()` 或 `redirect()`
5. `useParams()` 在客户端用 hook 获取，在服务端用 `await params`
6. `<SEOHelmet>` → Next.js Metadata API（`export const metadata` 或 `generateMetadata`）
7. 数据获取改为 async/await（Server Component）或保留 `useEffect`（Client Component）

**4.2 将剩余 ~53 个 UI 组件从 `.jsx` 转换为 `.tsx`**

路径：`apps/web/src/components/ui/`

使用脚本批量转换：
```bash
cd apps/web/src/components/ui
for f in *.jsx; do
  npx tsx --compilerOptions '{"jsx":"react-jsx"}' "$f" > "${f%.jsx}.tsx" 2>/dev/null || true
done
```

或者逐个手动转换，重点关注：
1. 添加 `"use client"` 指令（交互组件）
2. 类型化 props
3. 移除 `import React from 'react'`（Next.js 不需要）

**4.3 迁移 Express API → Next.js Route Handlers**

路径：`apps/web/src/app/api/`

| 原路由 | 目标文件 |
|--------|---------|
| `POST /scrape/all` | `app/api/scrape/route.ts` |
| `POST /scrape/atp` | `app/api/scrape/atp/route.ts` |
| `POST /scrape/wta` | `app/api/scrape/wta/route.ts` |
| `POST /scrape/itf` | `app/api/scrape/itf/route.ts` |
| `GET /scrape/status` | `app/api/scrape/status/route.ts` |
| `GET /scrape/logs` | `app/api/scrape/logs/route.ts` |
| `GET /scrape/stats` | `app/api/scrape/stats/route.ts` |
| `GET /health` | `app/api/health/route.ts` |

**4.4 删除遗留 Vite 文件**

构建验证通过后，删除：
```
apps/web/vite.config.js
apps/web/index.html
apps/web/src/main.jsx
apps/web/src/App.jsx
apps/web/src/pages-legacy/  （迁移完成后）
```

---

### 🟡 中优先级

**4.5 设置 NextAuth.js (Auth.js) 认证**

替换现有的 `AuthContext.jsx`：
- 配置 PocketBase Provider
- 设置 Session Provider
- 实现登录/注册/密码重置页面
- Admin 路由保护通过 middleware 实现

**4.6 迁移定时任务**

将 `apps/api/src/utils/scheduler.js` 的 node-cron 逻辑迁移到独立脚本：
```
scripts/cron-scrape.ts
```

通过 cron 调用 `POST /api/scrape/all`（带 `CRON_SECRET` 鉴权）。

**4.7 配置 sitemap.ts**

使用 Next.js 内置 sitemap 生成，替换现有的 `SitemapPage.jsx`。

---

### 🟢 低优先级

**4.8 设置 PM2 部署配置**

创建 `ecosystem.config.cjs`：
```javascript
module.exports = {
  apps: [{
    name: 'tennishub-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production', PORT: 3000 }
  }]
};
```

**4.9 迁移 SEO 实现**

将 `SEOHelmet.jsx` 组件替换为 Next.js Metadata API：
```typescript
export async function generateMetadata({ params }) {
  return {
    title: '...',
    description: '...',
  }
}
```

---

## 五、文件对照表

### 迁移前后对照

| 旧路径 | 新路径 | 状态 |
|--------|--------|------|
| `src/main.jsx` | `app/layout.tsx` | 待迁移 |
| `src/App.jsx` | `app/[lang]/page.tsx` 等 | 待迁移 |
| `src/lib/utils.js` | `src/lib/utils.ts` | 待迁移 |
| `src/lib/pocketbaseClient.js` | `src/lib/pocketbase.ts` | 待迁移 |
| `src/lib/structuredData.js` | `src/lib/structuredData.ts` | 待迁移 |
| `src/lib/apiServerClient.js` | 删除（不再需要） | 待删除 |
| `src/contexts/AuthContext.jsx` | NextAuth.js | 待迁移 |
| `src/i18n/i18n.ts` | next-intl 配置 | 已适配 |
| `apps/api/src/routes/scrape.js` | `app/api/scrape/route.ts` | 待迁移 |
| `apps/api/src/routes/health.js` | `app/api/health/route.ts` | 待迁移 |

---

## 六、环境变量

在 `.env.local` 中配置：

```env
# PocketBase
NEXT_PUBLIC_PB_URL=http://localhost:8090
PB_URL=http://localhost:8090
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=your-password

# NextAuth
NEXTAUTH_SECRET=generate-a-random-string
NEXTAUTH_URL=http://localhost:3000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron
CRON_SECRET=generate-a-random-secret
```

生产环境变量放在 `.env.production` 或 Hostinger 环境变量配置中。

---

## 七、验证清单

```bash
# 1. 构建测试
npm run build  # 必须无错误通过

# 2. 开发服务器
npm run dev    # 访问 http://localhost:3000

# 3. 多语言路由测试
curl http://localhost:3000/en/
curl http://localhost:3000/zh/
curl http://localhost:3000/ja/
curl http://localhost:3000/es/
curl http://localhost:3000/fr/

# 4. API 测试
curl http://localhost:3000/api/health

# 5. 认证流程测试
# 登录 → 访问 /admin → 登出

# 6. Hostinger 部署
pm2 start ecosystem.config.cjs
pm2 logs
```

---

## 八、已知限制

1. **shadcn/ui v0.x 不完全兼容 RSC** — 需要手动添加 `"use client"` 指令
2. **Next.js 15 `params` 是 Promise** — 所有 Server Component 必须 `await params`
3. **客户端组件不能是 async** — 需要路由参数的客户端组件必须用 `useParams()` hook
4. **React hooks 不能在 async 函数中调用** — ESLint 会报错
5. **Radix UI 某些 primitive 不支持 ref** — 不能对 Portal/Sub 等使用 `forwardRef`
6. **Hostinger Node.js 版本** — 需要 Node.js 20+，确保 Hostinger 使用正确版本
