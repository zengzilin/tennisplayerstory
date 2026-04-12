# 网球排名手动抓取脚本

`scrape_tennis.py` 是一个手动备用抓取脚本，用于在网站自动抓取任务失败时，手动从 ATP、WTA、ITF 官方渠道获取最新球员排名，并同步至 PocketBase 数据库、导出为 Excel 文件供手动上传。

其逻辑与 `apps/api/src/routes/scrape.js` 中的 `/scrape/all` 接口完全等效。

---

## 数据来源

| 来源 | 抓取地址 | 说明 |
|------|----------|------|
| ATP  | `https://www.espn.com/tennis/rankings` | ATP 官网屏蔽服务器请求，改用 ESPN |
| WTA  | `https://www.wtatennis.com/rankings/singles` | WTA 官网直接抓取 |
| ITF  | `https://www.espn.com/tennis/rankings/_/type/wta` | ITF 官网屏蔽服务器请求，改用 ESPN |

每次抓取最多返回 150 名球员（ESPN），WTA 官网视分页情况而定。

---

## 环境要求

- Python 3.10+
- 依赖库：`requests`、`beautifulsoup4`、`openpyxl`

推荐使用虚拟环境（macOS 系统 Python 默认不允许全局安装包）：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install requests beautifulsoup4 openpyxl
```

---

## 环境变量配置

脚本会自动读取以下位置的 `.env` 文件（按顺序，先找到先用）：

1. 项目根目录 `.env`
2. `apps/api/.env`

也可以直接在 shell 中 export：

```bash
export WEBSITE_DOMAIN=your-domain.com
export PB_SUPERUSER_EMAIL=admin@example.com
export PB_SUPERUSER_PASSWORD=your-password
```

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `WEBSITE_DOMAIN` | PocketBase 域名，不含 `https://` | `example.com` |
| `PB_SUPERUSER_EMAIL` | PocketBase 超级用户邮箱 | `admin@example.com` |
| `PB_SUPERUSER_PASSWORD` | PocketBase 超级用户密码 | `your-password` |

> 若以上变量未配置，脚本会自动以 `--dry-run` 模式运行，只抓取并导出 Excel，不写入数据库。

---

## 使用方式

```bash
# 抓取全部来源（ATP + WTA + ITF），写入数据库并导出 Excel
python scrape_tennis.py

# 只抓取某一个来源
python scrape_tennis.py --source atp
python scrape_tennis.py --source wta
python scrape_tennis.py --source itf

# 仅抓取并导出 Excel，不写入数据库
python scrape_tennis.py --dry-run

# 指定 Excel 输出路径（默认在当前目录生成 players_export_YYYY-MM-DD.xlsx）
python scrape_tennis.py --output /path/to/output.xlsx

# 不导出 Excel
python scrape_tennis.py --no-export

# 指定 .env 文件路径
python scrape_tennis.py --env /path/to/.env
```

使用虚拟环境时，将 `python` 替换为 `.venv/bin/python`：

```bash
.venv/bin/python scrape_tennis.py --dry-run
```

---

## Excel 导出格式

导出文件包含 **4 个 Sheet**：

| Sheet | 内容 |
|-------|------|
| `All` | 全部来源汇总（按来源 + 排名排序） |
| `ATP` | ATP 球员（深蓝表头） |
| `WTA` | WTA 球员（紫色表头） |
| `ITF` | ITF 球员（绿色表头） |

每个 Sheet 的列与参考 CSV 格式一致：

| Name | Ranking | Country | Points | Age | Source |
|------|---------|---------|--------|-----|--------|
| Carlos Alcaraz | 1 | Spain | 13590 | 22 | ATP |
| … | … | … | … | … | … |

导出文件默认命名为 `players_export_YYYY-MM-DD.xlsx`，生成在当前目录。

---

## 输出示例

```
[19:55:44] [INFO ] ===== 开始抓取 ATP =====
[19:55:46] [INFO ] 成功提取 150 名 ATP 球员
[19:55:48] [INFO ] 成功提取 50 名 WTA 球员
[19:55:50] [INFO ] 成功提取 150 名 ITF 球员
[19:55:50] [INFO ] Excel 已导出: players_export_2026-04-11.xlsx（共 350 条记录）

============================================================
抓取汇总
============================================================
  ATP: 成功（共 150 名球员 | 新建 0 | 更新 150）
  WTA: 成功（共 50 名球员 | 新建 0 | 更新 50）
  ITF: 成功（共 150 名球员 | 新建 0 | 更新 150）

总计: 3 成功 / 0 失败
============================================================
```

---

## 同步逻辑

以球员 `name + source` 作为唯一键进行去重：

- 已存在 → 更新 `ranking`、`points`、`country`、`profile_url`、`age`、`last_updated`
- 不存在 → 创建新记录

每次抓取结束后，结果会写入 PocketBase `scrape_logs` 集合（`status` 为 `success` 或 `failed`）。

---

## 错误处理

- 每个请求最多重试 **3 次**，间隔为 1s → 2s → 4s（指数退避）
- 单个来源失败不影响其他来源继续执行
- 即使数据库同步失败，Excel 仍会正常导出
- 全部失败时脚本以非零状态码退出（可用于 shell 脚本判断）

---

## 与自动抓取的对应关系

| Python 脚本 | JS 原版（`scrape.js`） |
|---|---|
| `parse_espn_rankings()` | `parseEspnRankings()` |
| `parse_wta_rankings()` | WTA 内联解析逻辑 |
| `sync_players()` | `syncPlayerData()`（`playerDataSync.js`） |
| `log_scrape()` | `pb.collection('scrape_logs').create()` |
| `export_to_excel()` | —（Python 脚本新增功能） |
| 指数退避重试 | `fetchWithRetry()` |
