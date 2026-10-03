# GSC 与 AdSense 整改记录 — 2026-10-03

## GSC 基线

直接读取已登录的 Search Console，属性为 https://tennisplayerstory.com/。最长可选范围为16个月，实际有数据的日期为2026-03-09至2026-09-29。未下载完整历史 CSV；以下为界面可见汇总和全部表格行。

- 搜索：0点击、63展示、CTR 0%、平均排名76.6。
- 页面：/es/stories 59展示，根路径4展示。
- 21个查询，最高为 historia del tenis mundial（22展示），其次 tenista famoso（4），el tenista de cracovia / jugador de tenis（各3）。其余查询各1–2展示。
- 国家14个：西班牙42，墨西哥/美国各3，英国/阿根廷/乌拉圭/哥伦比亚各2，其余各1。
- 设备：桌面47，手机15，平板1。
- 索引（9月21日更新）：已索引2，未索引12。正确规范页的替代页6、未指定规范页的重复页3、重定向1、已抓取未索引2。
- 替代页样本：/fr/、/en/stories、/en/、/es/、/fr/stories、/ja/stories。
- 重复页样本：/zh/privacy-policy、/en/privacy-policy、/fr/privacy-policy。
- 已抓取未索引：/de/privacy-policy、/es/live-matches。
- sitemap.xml：成功，5月2日提交，5月25日最后读取，发现170页。
- 人工处置、安全问题均无问题；HTTPS 2页、非HTTPS 0页；面包屑2有效0无效。
- 核心网页指标两种设备均因流量不足没有数据，这不是“通过”评级。
- 外链0，内链目标2（根路径和 /es/stories）。

## 整改

1. 首页、故事列表、公共信息页与文章正文进入初始 HTML；真实404，私有页面和演示比分 noindex；无广告文件时 ads.txt 返回404。
2. 每个语言页面使用自己的规范网址；缺失的文章翻译指向原语言规范页；法律页只有中英文进入 sitemap。根路径与已知页面末尾斜线301规范化。
3. 静态和动态 sitemap 共用实际公开路线，过滤未审核文章、演示页与空视频栏目；不再给静态页面伪造每日修改日期。数据库异常返回503，不发布残缺清单。
4. 删除虚构首页统计、伪造排名趋势、失效图像与不存在的搜索结构化数据；直达网址优先决定界面语言。
5. 自动生成文章只保存 pending 草稿。后台审批提示要求核实事实、来源、版权、独立价值和完整翻译。
6. 五篇重复或缺乏可靠来源的自动文章保留记录并转 pending。五篇人物文章更正事实、清除生成标记、补官方来源和明确历史统计范围。
7. 新增中英西三语网球历史指南，针对主要搜索意图解释公开赛年代、赛事历史与纪录口径。研究辅助写作有明确说明。
8. 浏览器核对文章加载、规范页和 en/zh/es hreflang；390px手机视口无水平溢出。修复登录、注册和找回密码的语言链接，并移除登录密码日志。

公开修订稿在 editorial-corrections.json 与 history-guide.json；修改前数据库记录保存于被 Git 忽略的 content-backup.private.json（仅本机）。未删除文章或修改作者账号。

## 验证与申请边界

- npm run typecheck、npm run lint、npm run build。
- node --test apps/api/tests/*.test.js apps/web/tests/*.test.*：38通过、0失败、1跳过（独立 MySQL fixture 未配置）。运行环境 Node 24.14.0；项目指定的 Node 20.19.1 没有在本机找到，需以 Hostinger 部署日志补充该版本验证。
- 回归覆盖：初始 HTML、真实404、规范页/翻译、sitemap 与自动文章待审核及幂等行为。
- 线上检查与部署结果另见 live-checks.json；上线不会即时改变 GSC 历史报告。

AdSense 由 Google 审核内容与政策合规性，没有官方最低点击数或“多少篇文章就保证通过”的规则。整改提供可申请的技术和内容基础，不代表已获批准。

申请时需要站主在 AdSense 账户添加网站并取得自己的验证代码/发布商ID；这次未提交申请、接受条款或伪造 pub-ID。启用广告前，应按实际服务更新隐私声明，针对欧洲经济区、英国和瑞士流量配置 Google 认证的同意管理平台，再部署账户提供的 ads.txt。

官方依据：
- https://support.google.com/adsense/answer/9724?hl=en
- https://support.google.com/adsense/answer/7299563?hl=en
- https://support.google.com/publisherpolicies/answer/11112688?hl=en
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/specialty/international/localized-versions
