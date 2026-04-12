#!/usr/bin/env python3
"""
Tennis Rankings Manual Scraper
===============================
手动备用脚本：当网站自动抓取失败时使用。
等效于 apps/api/src/routes/scrape.js 中的 /scrape/all 逻辑。

依赖安装：
    pip install requests beautifulsoup4 openpyxl

使用方式：
    # 抓取全部 (ATP + WTA + ITF)，写入数据库并导出 Excel
    python scrape_tennis.py

    # 只抓取某个来源
    python scrape_tennis.py --source atp
    python scrape_tennis.py --source wta
    python scrape_tennis.py --source itf

    # 不写入数据库，只抓取并导出 Excel
    python scrape_tennis.py --dry-run

    # 指定 Excel 输出路径（默认在当前目录生成带日期的文件名）
    python scrape_tennis.py --output /path/to/output.xlsx

    # 不导出 Excel
    python scrape_tennis.py --no-export

环境变量（可写在 .env 文件或直接 export）：
    WEBSITE_DOMAIN        PocketBase 域名，不含 https://
    PB_SUPERUSER_EMAIL    PocketBase 超级用户邮箱
    PB_SUPERUSER_PASSWORD PocketBase 超级用户密码

    若以上变量未设置，脚本将仅打印结果，不写入数据库（等同 --dry-run）。
"""

import argparse
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)
ACCEPT_LANGUAGE = "en-US,en;q=0.9"
REQUEST_TIMEOUT = 30          # 秒
MAX_RETRIES = 3
RETRY_DELAYS = [1, 2, 4]     # 指数退避（秒）

SOURCES = {
    "atp": {
        "url": "https://www.espn.com/tennis/rankings",
        "referer": "https://www.espn.com/tennis/",
        "parser": "espn",
        "label": "ATP",
    },
    "wta": {
        "url": "https://www.wtatennis.com/rankings/singles",
        "referer": "https://www.wtatennis.com/",
        "parser": "wta",
        "label": "WTA",
    },
    "itf": {
        "url": "https://www.espn.com/tennis/rankings/_/type/wta",
        "referer": "https://www.espn.com/tennis/",
        "parser": "espn",
        "label": "ITF",
    },
}


# ---------------------------------------------------------------------------
# 工具函数
# ---------------------------------------------------------------------------

def log(level: str, msg: str) -> None:
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] [{level.upper():5}] {msg}", flush=True)


def info(msg):  log("INFO",  msg)
def warn(msg):  log("WARN",  msg)
def error(msg): log("ERROR", msg)
def debug(msg): log("DEBUG", msg)


def fetch_with_retry(url: str, referer: str) -> str:
    """抓取 URL，带重试与指数退避，返回 HTML 字符串。"""
    headers = {
        "User-Agent": USER_AGENT,
        "Accept-Language": ACCEPT_LANGUAGE,
        "Referer": referer,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    last_exc = None
    for attempt in range(MAX_RETRIES):
        try:
            info(f"请求 {url}（第 {attempt + 1}/{MAX_RETRIES} 次）")
            resp = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            info(f"响应状态: {resp.status_code}")
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            last_exc = exc
            warn(f"第 {attempt + 1} 次请求失败: {exc}")
            if attempt < MAX_RETRIES - 1:
                delay = RETRY_DELAYS[attempt]
                info(f"等待 {delay} 秒后重试...")
                time.sleep(delay)
    raise RuntimeError(f"请求失败（{MAX_RETRIES} 次均失败）: {last_exc}")


def clean_int(text: str) -> int | None:
    """从字符串中提取整数，失败返回 None。"""
    digits = re.sub(r"[^0-9]", "", str(text).strip())
    return int(digits) if digits else None


def validate_player(player: dict) -> bool:
    """校验球员数据完整性（与 JS 版 validatePlayerData 等效）。"""
    return bool(
        player.get("name") and
        isinstance(player["name"], str) and
        player["name"].strip() and
        player.get("ranking") and
        player["ranking"] > 0 and
        player.get("country") and
        isinstance(player["country"], str) and
        player["country"].strip() and
        player.get("points") is not None and
        player["points"] >= 0
    )


# ---------------------------------------------------------------------------
# 解析器
# ---------------------------------------------------------------------------

def parse_espn_rankings(html: str, source: str) -> list[dict]:
    """解析 ESPN 网球排名页（ATP 和 ITF 共用）。"""
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.select("tr[data-idx]")
    info(f"找到 {len(rows)} 行数据（ESPN 选择器 tr[data-idx]）")

    players = []
    for i, row in enumerate(rows):
        try:
            # 排名
            rank_span = row.select_one("span.rank_column")
            ranking = clean_int(rank_span.get_text()) if rank_span else None

            # 姓名 & 个人主页
            anchor = row.select_one("a.AnchorLink")
            name = anchor.get_text(strip=True) if anchor else ""
            href = anchor.get("href", "") if anchor else ""
            if href.startswith("http"):
                profile_url = href
            elif href:
                profile_url = f"https://www.espn.com{href}"
            else:
                profile_url = ""

            # 国籍（img title）
            country_img = row.select_one("img.Logo__sm")
            country = (country_img.get("title") or "").strip() if country_img else ""

            # 积分 & 年龄（td > span[class=""]）
            plain_spans = row.select('td.Table__TD span[class=""]')
            points = clean_int(plain_spans[0].get_text()) if len(plain_spans) > 0 else None
            age_text = plain_spans[1].get_text(strip=True) if len(plain_spans) > 1 else ""
            age = clean_int(age_text) if age_text else None

            player = {
                "name": name,
                "ranking": ranking or 0,
                "country": country,
                "points": points if points is not None else 0,
                "age": age,
                "profile_url": profile_url,
                "source": source,
            }

            if validate_player(player):
                debug(f"提取球员: {player['name']} (排名: {player['ranking']}, 国家: {player['country']}, 积分: {player['points']})")
                players.append(player)
            else:
                warn(f"数据无效，跳过: {player}")

        except Exception as exc:
            error(f"解析第 {i} 行时出错: {exc}")

    return players


def parse_wta_rankings(html: str) -> list[dict]:
    """解析 WTA 官网排名页。"""
    soup = BeautifulSoup(html, "html.parser")

    rows = soup.select("tr.player-row")
    info(f"找到 {len(rows)} 行数据（WTA 选择器 tr.player-row）")

    if not rows:
        rows = soup.select("tbody tr")
        info(f"改用备用选择器 tbody tr，找到 {len(rows)} 行")

    if not rows:
        raise RuntimeError("未找到排名表格（已尝试: tr.player-row, tbody tr）")

    players = []
    for i, row in enumerate(rows):
        try:
            ranking_td = row.select_one("td.player-row__cell--rank")
            ranking = clean_int(ranking_td.get_text()) if ranking_td else None

            name = (row.get("data-player-name") or "").strip()

            country_span = row.select_one("span.player-cell__country")
            country = country_span.get_text(strip=True) if country_span else ""

            points_td = row.select_one("td.player-row__cell--points")
            points = clean_int(points_td.get_text()) if points_td else None

            age_td = row.select_one("td.player-row__cell--age")
            age_text = age_td.get_text(strip=True) if age_td else ""
            age = clean_int(age_text) if age_text else None

            player = {
                "name": name,
                "ranking": ranking or 0,
                "country": country,
                "points": points if points is not None else 0,
                "age": age,
                "profile_url": "",
                "source": "WTA",
            }

            if validate_player(player):
                debug(f"提取球员: {player['name']} (排名: {player['ranking']}, 国家: {player['country']}, 积分: {player['points']})")
                players.append(player)
            else:
                warn(f"数据无效，跳过: {player}")

        except Exception as exc:
            error(f"解析第 {i} 行时出错: {exc}")

    return players


# ---------------------------------------------------------------------------
# PocketBase 同步
# ---------------------------------------------------------------------------

class PocketBaseClient:
    """轻量级 PocketBase REST API 客户端（无需 SDK）。"""

    def __init__(self, base_url: str, email: str, password: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.email = email
        self.password = password
        self.token: str = ""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def authenticate(self) -> None:
        url = f"{self.base_url}/api/collections/_superusers/auth-with-password"
        resp = self.session.post(
            url,
            json={"identity": self.email, "password": self.password},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        self.token = resp.json()["token"]
        self.session.headers["Authorization"] = self.token
        info("PocketBase 认证成功")

    def get_list(self, collection: str, page: int = 1, per_page: int = 1,
                 filter_str: str = "") -> dict:
        params = {"page": page, "perPage": per_page}
        if filter_str:
            params["filter"] = filter_str
        resp = self.session.get(
            f"{self.base_url}/api/collections/{collection}/records",
            params=params,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def create(self, collection: str, data: dict) -> dict:
        resp = self.session.post(
            f"{self.base_url}/api/collections/{collection}/records",
            json=data,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()

    def update(self, collection: str, record_id: str, data: dict) -> dict:
        resp = self.session.patch(
            f"{self.base_url}/api/collections/{collection}/records/{record_id}",
            json=data,
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()


def sync_players(pb: PocketBaseClient, players: list[dict], source: str) -> dict:
    """
    将球员数据同步至 PocketBase players 集合。
    逻辑与 playerDataSync.js 中的 syncPlayerData() 完全对应。
    """
    results = {"created": 0, "updated": 0, "failed": 0}
    info(f"开始同步 {len(players)} 名 {source} 球员...")

    for player in players:
        escaped_name = player["name"].replace('"', '\\"')
        filter_str = f'name = "{escaped_name}" && source = "{source}"'
        try:
            existing = pb.get_list("players", filter_str=filter_str)
            now = datetime.now(timezone.utc).isoformat()

            if existing["items"]:
                record_id = existing["items"][0]["id"]
                pb.update("players", record_id, {
                    "ranking": player["ranking"],
                    "points": player["points"],
                    "country": player["country"],
                    "profile_url": player["profile_url"],
                    "age": player["age"],
                    "last_updated": now,
                })
                results["updated"] += 1
                debug(f"更新球员: {player['name']} (排名: {player['ranking']})")
            else:
                pb.create("players", {
                    "name": player["name"],
                    "ranking": player["ranking"],
                    "country": player["country"],
                    "points": player["points"],
                    "profile_url": player["profile_url"],
                    "age": player["age"],
                    "source": source.lower(),
                    "last_updated": now,
                })
                results["created"] += 1
                debug(f"新建球员: {player['name']} (排名: {player['ranking']})")

        except Exception as exc:
            error(f"同步球员 {player['name']} 失败: {exc}")
            results["failed"] += 1

    info(f"{source} 同步完成: 新建 {results['created']}，更新 {results['updated']}，失败 {results['failed']}")
    return results


def log_scrape(pb: PocketBaseClient, source: str, status: str,
               players_created: int = 0, players_updated: int = 0,
               error_msg: str = "") -> None:
    """写入 scrape_logs 集合。"""
    data: dict = {
        "source": source,
        "status": status,
        "players_created": players_created,
        "players_updated": players_updated,
    }
    if error_msg:
        data["error_message"] = error_msg
    try:
        pb.create("scrape_logs", data)
        info(f"已写入抓取日志: source={source}, status={status}")
    except Exception as exc:
        warn(f"写入抓取日志失败（不影响数据同步）: {exc}")


# ---------------------------------------------------------------------------
# Excel 导出
# ---------------------------------------------------------------------------

# 每个来源对应的 sheet 标题行颜色（与网球主题配色）
SHEET_COLORS = {
    "ATP": "1A5276",   # 深蓝
    "WTA": "7D3C98",   # 紫色
    "ITF": "1E8449",   # 绿色
}

COLUMNS = [
    ("Name",    30),
    ("Ranking",  9),
    ("Country", 18),
    ("Points",  10),
    ("Age",      6),
    ("Source",   8),
]


def _header_style(header_color: str) -> tuple:
    font   = Font(bold=True, color="FFFFFF", size=11)
    fill   = PatternFill("solid", fgColor=header_color)
    align  = Alignment(horizontal="center", vertical="center")
    border = Border(
        bottom=Side(style="medium", color="FFFFFF"),
    )
    return font, fill, align, border


def _thin_border() -> Border:
    side = Side(style="thin", color="D5D8DC")
    return Border(left=side, right=side, top=side, bottom=side)


def export_to_excel(all_players: dict[str, list[dict]], output_path: str) -> None:
    """
    将所有来源的球员数据写入 Excel 文件。
    - 每个来源（ATP/WTA/ITF）单独一个 Sheet
    - 另有一个「All」Sheet 汇总全部数据
    列顺序与参考 CSV 一致：Name, Ranking, Country, Points, Age, Source
    """
    wb = Workbook()
    wb.remove(wb.active)  # 删除默认空 sheet

    thin = _thin_border()
    zebra_fill = PatternFill("solid", fgColor="EBF5FB")   # 斑马纹浅蓝

    def write_sheet(ws, players: list[dict], color: str) -> None:
        font, fill, align, border = _header_style(color)

        # 写表头
        for col_idx, (col_name, col_width) in enumerate(COLUMNS, start=1):
            cell = ws.cell(row=1, column=col_idx, value=col_name)
            cell.font = font
            cell.fill = fill
            cell.alignment = align
            cell.border = border
            ws.column_dimensions[get_column_letter(col_idx)].width = col_width

        ws.row_dimensions[1].height = 22
        ws.freeze_panes = "A2"

        # 写数据行
        for row_idx, p in enumerate(players, start=2):
            row_data = [
                p["name"],
                p["ranking"],
                p["country"],
                p["points"],
                p["age"],
                p["source"],
            ]
            use_zebra = (row_idx % 2 == 0)
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.border = thin
                cell.alignment = Alignment(vertical="center")
                if use_zebra:
                    cell.fill = zebra_fill
                # 数字列居中
                if col_idx in (2, 4, 5):
                    cell.alignment = Alignment(horizontal="center", vertical="center")

    # 各来源单独 sheet
    all_combined: list[dict] = []
    for key in ["atp", "wta", "itf"]:
        label = SOURCES[key]["label"]
        players = all_players.get(key, [])
        if not players:
            continue
        ws = wb.create_sheet(title=label)
        color = SHEET_COLORS[label]
        write_sheet(ws, players, color)
        all_combined.extend(players)

    # 汇总 sheet（按 source 再按 ranking 排序）
    if all_combined:
        ws_all = wb.create_sheet(title="All", index=0)
        sorted_all = sorted(all_combined, key=lambda p: (p["source"], p["ranking"]))
        write_sheet(ws_all, sorted_all, "2C3E50")

    wb.save(output_path)
    info(f"Excel 已导出: {output_path}（共 {len(all_combined)} 条记录）")


# ---------------------------------------------------------------------------
# 主逻辑
# ---------------------------------------------------------------------------

def scrape_source(key: str, pb_client: PocketBaseClient | None, dry_run: bool) -> dict:
    """
    执行单个数据源的抓取 + 同步。
    返回: {"success": bool, "count": int, "created": int, "updated": int,
           "error": str, "players": list}
    """
    cfg = SOURCES[key]
    label = cfg["label"]
    info(f"===== 开始抓取 {label} =====")

    try:
        html = fetch_with_retry(cfg["url"], cfg["referer"])
        info(f"HTML 前 200 字符: {html[:200]!r}")

        if cfg["parser"] == "espn":
            players = parse_espn_rankings(html, label)
        else:
            players = parse_wta_rankings(html)

        if not players:
            raise RuntimeError(f"未从 {label} 页面提取到有效球员数据")

        info(f"成功提取 {len(players)} 名 {label} 球员")

        if dry_run or pb_client is None:
            info(f"[DRY-RUN] 前 5 条数据预览:")
            for p in players[:5]:
                info(f"  {p['ranking']:>4}. {p['name']:<30} {p['country']:<20} 积分:{p['points']}")
            return {"success": True, "count": len(players), "created": 0, "updated": 0,
                    "error": "", "players": players}

        sync_result = sync_players(pb_client, players, label)
        log_scrape(pb_client, label, "success",
                   players_created=sync_result["created"],
                   players_updated=sync_result["updated"])

        return {
            "success": True,
            "count": len(players),
            "created": sync_result["created"],
            "updated": sync_result["updated"],
            "error": "",
            "players": players,
        }

    except Exception as exc:
        error(f"{label} 抓取失败: {exc}")
        if pb_client and not dry_run:
            log_scrape(pb_client, label, "failed", error_msg=str(exc))
        return {"success": False, "count": 0, "created": 0, "updated": 0,
                "error": str(exc), "players": []}


def build_pb_client() -> PocketBaseClient | None:
    """从环境变量构建 PocketBase 客户端，缺少配置则返回 None。"""
    domain = os.environ.get("WEBSITE_DOMAIN", "")
    email = os.environ.get("PB_SUPERUSER_EMAIL", "")
    password = os.environ.get("PB_SUPERUSER_PASSWORD", "")

    if not all([domain, email, password]):
        warn("未设置 WEBSITE_DOMAIN / PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD，将以 dry-run 模式运行（不写入数据库）")
        return None

    base_url = f"https://{domain}/hcgi/platform"
    client = PocketBaseClient(base_url, email, password)
    try:
        client.authenticate()
        return client
    except Exception as exc:
        error(f"PocketBase 认证失败: {exc}")
        warn("将以 dry-run 模式继续（不写入数据库）")
        return None


def load_dotenv(path: str = ".env") -> None:
    """简单解析 .env 文件（不依赖 python-dotenv）。"""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="手动执行网球排名抓取并同步至 PocketBase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--source",
        choices=["atp", "wta", "itf", "all"],
        default="all",
        help="指定要抓取的数据源（默认: all）",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="仅抓取并导出 Excel，不写入数据库",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Excel 输出路径（默认: players_export_YYYY-MM-DD.xlsx）",
    )
    parser.add_argument(
        "--no-export",
        action="store_true",
        help="不导出 Excel 文件",
    )
    parser.add_argument(
        "--env",
        default=".env",
        help="指定 .env 文件路径（默认: .env）",
    )
    args = parser.parse_args()

    # 加载环境变量
    load_dotenv(args.env)
    # 也尝试加载 api/.env
    load_dotenv(os.path.join("apps", "api", ".env"))

    pb_client: PocketBaseClient | None = None
    if not args.dry_run:
        pb_client = build_pb_client()

    targets = list(SOURCES.keys()) if args.source == "all" else [args.source]

    all_results: dict[str, dict] = {}
    for key in targets:
        result = scrape_source(key, pb_client, dry_run=args.dry_run)
        all_results[key] = result

    # 导出 Excel
    if not args.no_export:
        all_players_by_source = {
            key: result["players"]
            for key, result in all_results.items()
            if result["success"] and result["players"]
        }
        if all_players_by_source:
            today = datetime.now().strftime("%Y-%m-%d")
            output_path = args.output or f"players_export_{today}.xlsx"
            try:
                export_to_excel(all_players_by_source, output_path)
            except Exception as exc:
                error(f"Excel 导出失败: {exc}")
        else:
            warn("无可导出数据（所有来源均抓取失败）")

    # 汇总
    print("\n" + "=" * 60)
    print("抓取汇总")
    print("=" * 60)
    success_count = sum(1 for r in all_results.values() if r["success"])
    fail_count = len(all_results) - success_count

    for key, result in all_results.items():
        label = SOURCES[key]["label"]
        if result["success"]:
            if args.dry_run or pb_client is None:
                print(f"  {label}: 成功（共 {result['count']} 名球员，dry-run 未写库）")
            else:
                print(f"  {label}: 成功（共 {result['count']} 名 | 新建 {result['created']} | 更新 {result['updated']}）")
        else:
            print(f"  {label}: 失败 — {result['error']}")

    print(f"\n总计: {success_count} 成功 / {fail_count} 失败")
    print("=" * 60)

    sys.exit(0 if fail_count == 0 else 1)


if __name__ == "__main__":
    main()
