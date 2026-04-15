# TennisHub Next.js 迁移 — 交接文档

> **最后更新**: 2026-04-14
> **迁移范围**: Vite+React SPA → Next.js 15 App Router + Hostinger VPS 部署
> **当前状态**: ✅ 大部分页面已迁移，仅 3 个页面待迁移，新增 NextAuth + Prisma + PostgreSQL 认证体系

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
- **middleware.ts** 已配置于 `apps/web/middleware.ts`（next-intl 语言路由重定向）
- **环境变量** `.env.local` 已配置（`NEXT_PUBLIC_PB_URL`、`PB_URL` 等）

### ✅ 已迁移为 `.tsx` 的 UI 组件（5个）

| 组件 | 路径 | 说明 |
|------|------|------|
| Button | `src/components/ui/button.tsx` | 含 cva 变体、asChild 支持 |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Radix UI，Portal/Sub/RadioGroup 无 forwardRef |
| Sheet | `src/components/ui/sheet.tsx` | Radix Dialog 侧边抽屉 |
| Badge | `src/components/ui/badge.tsx` | 已迁移为 TypeScript |
| Card | `src/components/ui/card.tsx` | 已迁移为 TypeScript |

> 注意：还有 ~52 个 UI 组件仍为 `.jsx`，待批量转换。

### ✅ 已迁移的 App Router 页面（17个）

| 页面 | 路径 | 说明 |
|------|------|------|
| 根布局 | `src/app/[lang]/layout.tsx` | 正确使用 `async ({ params })` + `await params` |
| 首页 | `src/app/[lang]/page.tsx` | 配合 `HomePageClient` 客户端组件 |
| 登录 | `src/app/[lang]/login/page.tsx` | 配合 `LoginPageClient` |
| 注册 | `src/app/[lang]/signup/page.tsx` | 配合 `SignupPageClient` |
| 忘记密码 | `src/app/[lang]/forgot-password/page.tsx` | 配合 `ForgotPasswordPageClient` |
| 重置密码（带 token） | `src/app/[lang]/reset-password/[token]/page.tsx` | 配合 `ResetPasswordPageClient` |
| 隐私政策 | `src/app/[lang]/privacy/page.tsx` + `privacy-policy/page.tsx` | 配合 `PrivacyPageClient` |
| 服务条款 | `src/app/[lang]/terms/page.tsx` + `terms-of-service/page.tsx` | 配合 `TermsPageClient` |
| 用户资料 | `src/app/[lang]/profile/page.tsx` | 配合 `ProfilePageClient`，需要认证 |
| 写文章 | `src/app/[lang]/write-article/page.tsx` | 配合 `WriteArticlePageClient`，需要认证 |
| 我的文章 | `src/app/[lang]/my-articles/page.tsx` | 配合 `MyArticlesPageClient`，需要认证 |
| 文章列表 | `src/app/[lang]/stories/page.tsx` | 配合 `StoriesPageClient` |
| 球员列表 | `src/app/[lang]/players/page.tsx` | 配合 `PlayersPageClient` |
| 排名 | `src/app/[lang]/rankings/page.tsx` | 配合 `RankingsPageClient` |
| 直播比赛 | `src/app/[lang]/live-matches/page.tsx` | 配合 `LiveMatchesPageClient` |
| 管理后台 | `src/app/[lang]/admin/page.tsx` | 配合 `AdminDashboardClient`，Admin only |
| 文章管理 | `src/app/[lang]/admin/articles/page.tsx` | Admin only |
| 球员管理 | `src/app/[lang]/admin/players/page.tsx` | Admin only |
| 爬虫管理 | `src/app/[lang]/admin/scraping/page.tsx` | Admin only |

> 注：`privacy-policy/page.tsx` 和 `terms-of-service/page.tsx` 是遗留路由（大小写路径不同），建议后续重定向到 `privacy/` 和 `terms/` 后删除。

### ✅ NextAuth.js + Prisma 认证体系（新增）

- **`src/lib/auth.ts`** — NextAuth 配置，支持 Google OAuth + Credentials（邮箱密码），使用 PrismaAdapter，JWT session
- **`src/lib/prisma.ts`** — Prisma client 单例
- **`src/contexts/AuthContext.tsx`** — 已迁移为 TypeScript，基于 `useSession` + `signIn/signOut`，接口兼容旧版
- **`src/lib/api.js`** — 新的 API fetch 封装（用于客户端调用 Next.js Route Handlers）
- **`prisma/schema.prisma`** — PostgreSQL schema，包含 User, Account, Session, VerificationToken, Player, Article, ScrapeLog 模型（从 PocketBase 迁移）
- **`prisma.config.ts`** — Prisma 配置

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

### 2. NextAuth.js + Prisma 认证体系

认证架构已从 `AuthContext` + PocketBase 迁移到 **NextAuth.js v5 + Prisma + PostgreSQL**：

```typescript
// src/lib/auth.ts — NextAuth 配置
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),  // 使用 Prisma 适配器
  providers: [
    GoogleProvider({ ... }),       // Google OAuth
    CredentialsProvider({ ... }),   // 邮箱+密码登录
  ],
  session: { strategy: "jwt" },
});

// src/contexts/AuthContext.tsx — 与旧版兼容的 Context wrapper
// AuthProvider wraps SessionProvider + AuthContext
// useAuth() hook 返回与旧版相同的接口 (currentUser, isAdmin, login, logout 等)
```

**关键文件**:
- `src/lib/auth.ts` — NextAuth 配置
- `src/lib/prisma.ts` — Prisma 客户端
- `src/lib/api.js` — API fetch 封装（客户端用）
- `src/contexts/AuthContext.tsx` — 兼容层

**环境变量**（需要补充）：
```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
```

### 3. `class-variance-authority` + TypeScript

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

### 4. Radix UI primitives + forwardRef

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

### 5. shadcn/ui 组件 `"use client"` 指令

所有需要交互的组件必须加 `"use client"`：
- button, input, textarea, select, checkbox, radio-group
- dialog, sheet, alert-dialog, popover, dropdown-menu
- toast, toaster, sonner
- tabs, accordion, collapsible
- slider, toggle, switch, carousel 等

纯展示型组件（Card, Badge, Avatar, Separator, etc.）不需要。

---

## 四、待完成的工作

> 以下状态基于 **2026-04-14** 更新。大部分页面已迁移完毕，剩余工作大幅减少。

### 🔴 高优先级（阻断构建）

**4.1 将剩余 3 个页面从 `pages-legacy/` 迁移到 App Router**

路径：`apps/web/src/app/[lang]/`

| 页面 | 原文件 | 目标文件 | 状态 |
|------|--------|---------|------|
| ~~首页~~ | ~~`pages-legacy/HomePage.jsx`~~ | ~~`app/[lang]/page.tsx`~~ | ✅ 已完成 |
| ~~球员列表~~ | ~~`pages-legacy/PlayersPage.jsx`~~ | ~~`app/[lang]/players/page.tsx`~~ | ✅ 已完成 |
| 球员详情 | `pages-legacy/PlayerDetailPage.jsx` | `app/[lang]/players/[id]/page.tsx` | ⬜ 待迁移（动态路由） |
| ~~排名~~ | ~~`pages-legacy/RankingsPage.jsx`~~ | ~~`app/[lang]/rankings/page.tsx`~~ | ✅ 已完成 |
| ~~直播比赛~~ | ~~`pages-legacy/LiveMatchesPage.jsx`~~ | ~~`app/[lang]/live-matches/page.tsx`~~ | ✅ 已完成 |
| ~~文章列表~~ | ~~`pages-legacy/StoriesPage.jsx`~~ | ~~`app/[lang]/stories/page.tsx`~~ | ✅ 已完成 |
| ~~写文章~~ | ~~`pages-legacy/WriteArticlePage.jsx`~~ | ~~`app/[lang]/write-article/page.tsx`~~ | ✅ 已完成 |
| ~~我的文章~~ | ~~`pages-legacy/MyArticlesPage.jsx`~~ | ~~`app/[lang]/my-articles/page.tsx`~~ | ✅ 已完成 |
| ~~用户资料~~ | ~~`pages-legacy/UserProfilePage.jsx`~~ | ~~`app/[lang]/profile/page.tsx`~~ | ✅ 已完成 |
| ~~登录~~ | ~~`pages-legacy/LoginPage.jsx`~~ | ~~`app/[lang]/login/page.tsx`~~ | ✅ 已完成 |
| ~~注册~~ | ~~`pages-legacy/SignupPage.jsx`~~ | ~~`app/[lang]/signup/page.tsx`~~ | ✅ 已完成 |
| ~~忘记密码~~ | ~~`pages-legacy/ForgotPasswordPage.jsx`~~ | ~~`app/[lang]/forgot-password/page.tsx`~~ | ✅ 已完成 |
| ~~重置密码~~ | ~~`pages-legacy/ResetPasswordPage.jsx`~~ | ~~`app/[lang]/reset-password/page.tsx`~~ | ✅ 已完成 |
| ~~管理后台~~ | ~~`pages-legacy/AdminDashboard.jsx`~~ | ~~`app/[lang]/admin/page.tsx`~~ | ✅ 已完成 |
| ~~爬虫管理~~ | ~~`pages-legacy/AdminScrapingDashboard.jsx`~~ | ~~`app/[lang]/admin/scraping/page.tsx`~~ | ✅ 已完成 |
| ~~文章管理~~ | ~~`pages-legacy/AdminArticlesPage.jsx`~~ | ~~`app/[lang]/admin/articles/page.tsx`~~ | ✅ 已完成 |
| ~~球员管理~~ | ~~`pages-legacy/PlayerManagementPage.jsx`~~ | ~~`app/[lang]/admin/players/page.tsx`~~ | ✅ 已完成 |
| ~~隐私政策~~ | ~~`pages-legacy/PrivacyPolicyPage.jsx`~~ | ~~`app/[lang]/privacy/page.tsx`~~ | ✅ 已完成 |
| ~~服务条款~~ | ~~`pages-legacy/TermsOfServicePage.jsx`~~ | ~~`app/[lang]/terms/page.tsx`~~ | ✅ 已完成 |
| Sitemap | `pages-legacy/SitemapPage.jsx` | `app/sitemap.ts` | ⬜ 待迁移 |

**4.2 清理重复路由**

当前存在两套隐私政策和服务条款路由，建议删除旧的并重定向：
- `privacy-policy/page.tsx` → 重定向到 `privacy/`
- `terms-of-service/page.tsx` → 重定向到 `terms/`

```typescript
// apps/web/src/app/[lang]/privacy-policy/page.tsx
// 替换为 redirect
import { redirect } from 'next/navigation';
export default function Page({ params }) { redirect(`/${params.lang}/privacy`); }
```

**4.3 添加 Admin 路由中间件保护**

当前 `apps/web/middleware.ts` 仅处理语言路由重定向，**未实现 Admin 路由保护**。需要添加：

```typescript
// apps/web/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAdmin = req.auth?.user?.role === "admin";
  const isAdminRoute = req.nextUrl.pathname.includes("/admin");

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return;
});
```

**4.4 迁移 Express API → Next.js Route Handlers（爬虫相关）**

| 原路由 | 目标文件 | 状态 |
|--------|---------|------|
| ~~`GET /api/articles`~~ | ~~`app/api/articles/route.ts`~~ | ✅ 已完成 |
| ~~`GET/PATCH/DELETE /api/articles/[id]`~~ | ~~`app/api/articles/[id]/route.ts`~~ | ✅ 已完成 |
| ~~`GET /api/players`~~ | ~~`app/api/players/route.ts`~~ | ✅ 已完成 |
| ~~`GET /api/players/[id]`~~ | ~~`app/api/players/[id]/route.ts`~~ | ✅ 已完成 |
| ~~`GET/PATCH /api/users/[id]`~~ | ~~`app/api/users/[id]/route.ts`~~ | ✅ 已完成 |
| ~~`POST /api/auth/register`~~ | ~~`app/api/auth/register/route.ts`~~ | ✅ 已完成 |
| ~~`POST /api/auth/password-reset`~~ | ~~`app/api/auth/password-reset/route.ts`~~ | ✅ 已完成 |
| ~~`POST /api/auth/reset-password`~~ | ~~`app/api/auth/reset-password/route.ts`~~ | ✅ 已完成 |
| ~~`GET/POST /api/auth/[...nextauth]`~~ | ~~`app/api/auth/[...nextauth]/route.ts`~~ | ✅ 已完成 |
| `POST /scrape/all` | `app/api/scrape/route.ts` | ⬜ 待迁移 |
| `POST /scrape/atp` | `app/api/scrape/atp/route.ts` | ⬜ 待迁移 |
| `POST /scrape/wta` | `app/api/scrape/wta/route.ts` | ⬜ 待迁移 |
| `POST /scrape/itf` | `app/api/scrape/itf/route.ts` | ⬜ 待迁移 |
| `GET /scrape/status` | `app/api/scrape/status/route.ts` | ⬜ 待迁移 |
| `GET /scrape/logs` | `app/api/scrape/logs/route.ts` | ⬜ 待迁移 |
| `GET /scrape/stats` | `app/api/scrape/stats/route.ts` | ⬜ 待迁移 |
| `GET /health` | `app/api/health/route.ts` | ⬜ 待迁移 |

---

### 🟡 中优先级

**4.5 将剩余 ~50 个 UI 组件从 `.jsx` 转换为 `.tsx`**

路径：`apps/web/src/components/ui/`

当前状态：36 个 `.tsx` + 52 个 `.jsx`。批量转换参考：
```bash
cd apps/web/src/components/ui
for f in *.jsx; do
  npx tsx --compilerOptions '{"jsx":"react-jsx"}' "$f" > "${f%.jsx}.tsx" 2>/dev/null || true
done
```

重点关注交互组件（需要 `"use client"`）：input, textarea, select, dialog, tabs, accordion, tooltip, carousel 等。

**4.6 配置 sitemap.ts**

使用 Next.js 内置 sitemap 生成，替换现有的 `SitemapPage.jsx`：
```typescript
// apps/web/src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'http://localhost:3000';
  const langs = ['en', 'zh', 'ja', 'es', 'fr'];
  // 动态生成各语言路由...
}
```

**4.7 迁移定时任务**

将 `apps/api/src/utils/scheduler.js` 的 node-cron 逻辑迁移到独立脚本：
```
scripts/cron-scrape.ts
```
通过 cron 调用 `POST /api/scrape/all`（带 `CRON_SECRET` 鉴权）。

---

### 🟢 低优先级

**4.8 删除遗留 Vite 文件**

构建验证通过后，删除：
```
apps/web/vite.config.js
apps/web/index.html
apps/web/src/main.jsx
apps/web/src/App.jsx
apps/web/src/pages-legacy/  （迁移完成后）
```

**4.9 迁移 SEO 实现**

将 `SEOHelmet.jsx` 组件替换为 Next.js Metadata API（已部分完成，部分页面使用 `generateMetadata`）。

**4.10 设置 PM2 部署配置**

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

---

## 五、文件对照表

### 迁移前后对照

| 旧路径 | 新路径 | 状态 |
|--------|--------|------|
| `src/main.jsx` | `app/layout.tsx` | ✅ 已完成 |
| `src/App.jsx` | `app/[lang]/page.tsx` 等 | ✅ 已完成 |
| `src/lib/utils.js` | `src/lib/utils.ts` | ✅ 已完成 |
| `src/lib/pocketbaseClient.js` | `src/lib/pocketbase.ts` | ✅ 已完成 |
| `src/lib/structuredData.js` | `src/lib/structuredData.ts` | ✅ 已完成 |
| `src/lib/apiServerClient.js` | 删除（不再需要） | ✅ 已完成 |
| `src/lib/api.js` | `src/lib/api.js` | ✅ 新建完成 |
| `src/lib/auth.ts` | `src/lib/auth.ts` | ✅ 新建完成 |
| `src/lib/prisma.ts` | `src/lib/prisma.ts` | ✅ 新建完成 |
| `src/contexts/AuthContext.jsx` | `src/contexts/AuthContext.tsx` | ✅ 已迁移为 NextAuth |
| `src/i18n/i18n.ts` | next-intl 配置 | ✅ 已适配 |
| `apps/api/src/routes/scrape.js` | `app/api/scrape/route.ts` | ⬜ 待迁移 |
| `apps/api/src/routes/health.js` | `app/api/health/route.ts` | ⬜ 待迁移 |

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
