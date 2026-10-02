# 球员和排名自动更新

`/zh/players` 与 `/zh/rankings` 共用 `players` 数据。API 服务每天 **02:00 UTC（北京时间 10:00）** 自动刷新 ATP、WTA；服务启动 5 秒后检查成功记录，超过 24 小时未更新则补跑。无需付费数据订阅或 API Key，使用现有 Node 服务与数据库。

| 来源 | 免费公开地址 | 当前覆盖范围 |
| --- | --- | --- |
| ATP | https://site.api.espn.com/apis/site/v2/sports/tennis/atp/rankings | ESPN 提供的前 150 名 |
| WTA | https://www.wtatennis.com/rankings/singles | 官网首屏前 50 名 |

同步姓名、国家、年龄、排名、积分、来源日期；ATP 还提供头像和资料页链接，WTA 提供参赛数量。来源排名发布日期与本网站同步时间分别保存和展示。上游更新频率决定排名新鲜度，公开接口或页面可能改变；这不是实时比分或完整历史排名服务。

## 运行条件

配置 `WEBSITE_DOMAIN`、`PB_SUPERUSER_EMAIL`、`PB_SUPERUSER_PASSWORD` 和生产环境现有 MySQL 连接变量。API 通过已有 `/hcgi/platform` 数据服务写入数据库。服务必须保持运行；休眠期间错过的任务在下一次启动时补跑。生产部署仍使用原有 GitHub → Hostinger 流程。

## 验证与手动触发

- `POST /hcgi/api/scrape/all`：刷新 ATP、WTA。
- `POST /hcgi/api/scrape/atp`、`POST /hcgi/api/scrape/wta`：单独刷新一个巡回赛。
- 添加 `?dryRun=true`：仅抓取并验证，不写入数据库或日志。
- `GET /hcgi/api/scrape/status`：最近成功同步时间与来源发布日期。
- `GET /hcgi/api/scrape/logs`：成功和失败记录。

```bash
node --test apps/api/tests/tennis-rankings.test.js
npm run lint --workspace=api
npm run lint --workspace=web
npm run typecheck --workspace=web
npm run build --workspace=web
```

## 故障和去重

每个来源请求最多尝试 3 次，单次 30 秒超时。写入前验证至少 50 个合法、不重复、包含前 50 名的记录，避免把验证码页或不完整页面当作排名。一个来源失败时继续尝试另一个来源，并记录失败而非成功。

以来源和上游球员 ID（旧记录按姓名匹配）更新既有记录，保留 ID、用户收藏和人工编辑字段。全部新数据写入成功后，离开当前覆盖范围的旧记录清空排名而不删除球员。页面只显示仍有排名的 ATP/WTA 球员。数据库逐条写入，途中故障可能留下部分更新；失败不会生成成功日志，下次任务会重试。

旧实现把 ESPN 女子排名标成 ITF，这是错误的。自动任务不再写入这类记录，`/scrape/itf` 返回 410。仓库中的 `scrape_tennis.py` 是旧手动工具，不等同于当前自动任务；不要用它执行生产 ITF 导入。
