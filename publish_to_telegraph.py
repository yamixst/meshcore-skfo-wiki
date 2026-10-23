#!/usr/bin/env python3
"""
Публикует локальную Wiki (wiki/*.md) на telegra.ph.

Использование:
  python3 publish_to_telegraph.py [--token ACCESS_TOKEN] [--update]
"""

import os
import re
import sys
import json
import time
import argparse

from telegraph import Telegraph

WIKI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wiki")
TOKEN_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "telegraph_token.txt")
URLS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "telegraph_urls.json")

PUBLISH_ORDER = [
    "hardware/boards-comparison.md",
    "hardware/antennas-and-rf.md",
    "hardware/power-and-solar.md",
    "hardware/enclosures-and-weatherproofing.md",
    "network/frequencies-and-presets.md",
    "network/repeater-configuration.md",
    "network/routing-and-scopes.md",
    "network/mqtt-and-observers.md",
    "firmware-and-software/meshtastic-vs-meshcore.md",
    "firmware-and-software/flashing-guide.md",
    "firmware-and-software/client-apps.md",
    "topology-and-geography/regional-backbone.md",
    "topology-and-geography/city-clusters.md",
    "topology-and-geography/records-and-propagation.md",
    "guides-and-faq/quick-start.md",
    "guides-and-faq/troubleshooting.md",
    "guides-and-faq/legal-aspects.md",
    "index.md",
]


# ---------------------------------------------------------------------------
# Конвертер Markdown → Telegraph Nodes (без промежуточного HTML)
# ---------------------------------------------------------------------------

def md_to_nodes(md_text: str, url_map: dict = None) -> list:
    """
    Конвертирует Markdown в список Telegraph Node объектов.
    Telegraph Node: строка | {"tag": str, "children": [...], "attrs": {...}}
    """
    url_map = url_map or {}

    def resolve_link(href: str) -> str:
        # Нормализуем href: убираем file:// абсолютный путь до wiki/
        clean = href
        # file:///absolute/path/wiki/section/page.md  →  section/page.md
        clean = re.sub(r"^file://[^\s]*?/wiki/", "", clean)
        # ../wiki/section/page.md или wiki/section/page.md
        clean = re.sub(r"^(\.\./)*wiki/", "", clean)
        clean = clean.lstrip("/")
        # Убираем якоря (#section)
        clean = clean.split("#")[0]
        # Убираем хвостовые слэши (ссылки на папку → на index раздела, не поддерживается)
        clean = clean.rstrip("/")
        if clean in url_map:
            return url_map[clean]
        return href

    def inline_parse(text: str, depth: int = 0) -> list:
        """Парсим инлайн-разметку в список нод Telegraph."""
        if depth > 4 or not text:
            return [text] if text else []
        nodes = []
        # Обрабатываем последовательно по позиции
        pos = 0
        length = len(text)
        while pos < length:
            # Ищем первый специальный символ
            best_start = length
            best_tag = None
            best_end = None
            best_inner = None
            best_href = None

            # Проверяем каждый паттерн от текущей позиции
            # 1. Ссылка [text](url) — ищем первую [
            bracket = text.find("[", pos)
            if bracket != -1:
                m = re.match(r'\[([^\]]+)\]\(([^)]*(?:\([^)]*\))?[^)]*)\)', text[bracket:])
                if m and bracket < best_start:
                    best_start = bracket
                    best_tag = "a"
                    best_end = bracket + m.end()
                    best_inner = m.group(1)
                    best_href = resolve_link(m.group(2))

            # 2. Жирный **text**
            bb = text.find("**", pos)
            if bb != -1:
                m = re.match(r'\*\*([^*]+)\*\*', text[bb:])
                if m and bb < best_start:
                    best_start = bb
                    best_tag = "strong"
                    best_end = bb + m.end()
                    best_inner = m.group(1)

            # 3. Курсив *text* (только одинарная *)
            eb = pos
            while eb < length:
                eb = text.find("*", eb)
                if eb == -1:
                    break
                if text[eb:eb+2] == "**":
                    eb += 2
                    continue
                m = re.match(r'\*([^*\n]+)\*', text[eb:])
                if m and eb < best_start:
                    best_start = eb
                    best_tag = "em"
                    best_end = eb + m.end()
                    best_inner = m.group(1)
                break

            # 4. Инлайн-код `code`
            bt = text.find("`", pos)
            if bt != -1:
                m = re.match(r'`([^`\n]+)`', text[bt:])
                if m and bt < best_start:
                    best_start = bt
                    best_tag = "code"
                    best_end = bt + m.end()
                    best_inner = m.group(1)

            # 5. Зачёркнутый ~~text~~
            st = text.find("~~", pos)
            if st != -1:
                m = re.match(r'~~([^~]+)~~', text[st:])
                if m and st < best_start:
                    best_start = st
                    best_tag = "s"
                    best_end = st + m.end()
                    best_inner = m.group(1)

            if best_tag is None:
                # Ничего не нашли — весь остаток как текст
                nodes.append(text[pos:])
                break

            # Текст до найденного паттерна
            if best_start > pos:
                nodes.append(text[pos:best_start])

            # Добавляем ноду
            if best_tag == "a":
                nodes.append({"tag": "a", "attrs": {"href": best_href},
                              "children": [best_inner]})
            elif best_tag == "code":
                nodes.append({"tag": "code", "children": [best_inner]})
            else:
                nodes.append({"tag": best_tag,
                              "children": inline_parse(best_inner, depth + 1)})
            pos = best_end

        return nodes if nodes else ([text] if text else [])

    lines = md_text.splitlines()
    nodes = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Заголовки
        hm = re.match(r"^(#{1,6})\s+(.+)", line)
        if hm:
            level = len(hm.group(1))
            tag = "h3" if level <= 2 else "h4"
            nodes.append({"tag": tag, "children": inline_parse(hm.group(2).strip())})
            i += 1
            continue

        # HR
        if re.match(r"^[-*_]{3,}\s*$", line):
            nodes.append({"tag": "hr"})
            i += 1
            continue

        # Блоки кода (```)
        if line.startswith("```"):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1  # skip closing ```
            # Переносим строки длиннее 68 символов
            wrapped = []
            for cl in code_lines:
                if len(cl) <= 68:
                    wrapped.append(cl)
                else:
                    # Жёсткий перенос по 68 символов с индикатором продолжения
                    while len(cl) > 68:
                        wrapped.append(cl[:67] + "↵")
                        cl = "  " + cl[67:]
                    wrapped.append(cl)
            code_text = "\n".join(wrapped)
            nodes.append({"tag": "pre", "children": [{"tag": "code", "children": [code_text]}]})
            continue

        # Blockquote
        if line.startswith(">"):
            bq_lines = []
            while i < len(lines) and (lines[i].startswith(">") or lines[i].strip() == ""):
                bq_lines.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            inner = md_to_nodes("\n".join(bq_lines), url_map)
            nodes.append({"tag": "blockquote", "children": inner})
            continue

        # Неупорядоченный список
        if re.match(r"^[\s]*[-*+]\s+", line):
            items = []
            while i < len(lines) and re.match(r"^[\s]*[-*+]\s+", lines[i]):
                item_text = re.sub(r"^[\s]*[-*+]\s+", "", lines[i])
                items.append({"tag": "li", "children": inline_parse(item_text)})
                i += 1
            nodes.append({"tag": "ul", "children": items})
            continue

        # Упорядоченный список
        if re.match(r"^[\s]*\d+\.\s+", line):
            items = []
            while i < len(lines) and re.match(r"^[\s]*\d+\.\s+", lines[i]):
                item_text = re.sub(r"^[\s]*\d+\.\s+", "", lines[i])
                items.append({"tag": "li", "children": inline_parse(item_text)})
                i += 1
            nodes.append({"tag": "ol", "children": items})
            continue

        # Таблицы Markdown → <pre>
        if "|" in line and i + 1 < len(lines) and re.match(r"^\|?[-:| ]+\|", lines[i + 1]):
            table_lines = []
            while i < len(lines) and "|" in lines[i]:
                # Skip separator rows
                if not re.match(r"^\|?[-:| ]+\|", lines[i]):
                    cells = [c.strip() for c in lines[i].strip("|").split("|")]
                    table_lines.append("  ".join(cells))
                i += 1
            if table_lines:
                nodes.append({"tag": "pre", "children": ["\n".join(table_lines)]})
            continue

        # Пустая строка
        if line.strip() == "":
            i += 1
            continue

        # Обычный параграф (собираем все непустые строки без спецсимволов)
        para_lines = []
        while i < len(lines) and lines[i].strip() != "" and not re.match(
            r"^(#{1,6}\s|```|>|[\s]*[-*+]\s|\d+\.\s|[-*_]{3,})", lines[i]
        ) and not ("|" in lines[i] and i + 1 < len(lines) and re.match(r"^\|?[-:| ]+\|", lines[i + 1])):
            para_lines.append(lines[i])
            i += 1
        if para_lines:
            para_text = " ".join(para_lines)
            children = inline_parse(para_text)
            if children:
                nodes.append({"tag": "p", "children": children})

    return nodes


def extract_title(md_text: str, filepath: str) -> str:
    m = re.search(r"^#\s+(.+)", md_text, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return os.path.splitext(os.path.basename(filepath))[0].replace("-", " ").title()


def publish_wiki(token=None, update=False):
    t = Telegraph(access_token=token)
    if not token:
        print("📡 Создаём аккаунт на telegra.ph...")
        t.create_account(
            short_name="MeshcoreSKFO",
            author_name="Meshcore СКФО Wiki",
            author_url="https://t.me/meshcore_skfo",
        )
        token = t.get_access_token()
        with open(TOKEN_FILE, "w") as f:
            f.write(token)
        print(f"✅ Токен сохранён: {TOKEN_FILE}")
    else:
        print(f"🔑 Используем существующий токен")

    url_map = {}
    page_path_map = {}
    if os.path.exists(URLS_FILE):
        with open(URLS_FILE) as f:
            saved = json.load(f)
            url_map = saved.get("urls", {})
            page_path_map = saved.get("paths", {})

    for rel_path in PUBLISH_ORDER:
        if rel_path == "index.md":
            abs_path = os.path.join(WIKI_DIR, "index.md")
        else:
            abs_path = os.path.join(WIKI_DIR, rel_path)

        if not os.path.exists(abs_path):
            print(f"⚠️  Пропускаем (не найден): {rel_path}")
            continue

        with open(abs_path, encoding="utf-8") as f:
            md_text = f.read()

        title = extract_title(md_text, abs_path)
        # Убираем первый заголовок из тела — Telegraph показывает title отдельно
        md_body = re.sub(r"^#[^#][^\n]*\n", "", md_text, count=1)
        nodes = md_to_nodes(md_body, url_map)

        if not nodes:
            nodes = [{"tag": "p", "children": ["(страница пуста)"]}]

        already_published = rel_path in url_map

        try:
            if already_published and update:
                page_path = page_path_map.get(rel_path, "")
                if page_path:
                    print(f"🔄 Обновляем: {rel_path} ...", end=" ", flush=True)
                    resp = t.edit_page(
                        path=page_path,
                        title=title,
                        content=nodes,
                        author_name="Meshcore СКФО Wiki",
                    )
                else:
                    already_published = False

            if not already_published:
                print(f"📤 Публикуем: {rel_path} ...", end=" ", flush=True)
                resp = t.create_page(
                    title=title,
                    content=nodes,
                    author_name="Meshcore СКФО Wiki",
                )

            page_url = resp["url"]
            page_path_saved = resp["path"]
            url_map[rel_path] = page_url
            page_path_map[rel_path] = page_path_saved
            print(f"✅ {page_url}")

            with open(URLS_FILE, "w", encoding="utf-8") as f:
                json.dump({"urls": url_map, "paths": page_path_map}, f,
                          ensure_ascii=False, indent=2)

            time.sleep(1.2)

        except Exception as e:
            print(f"❌ Ошибка ({rel_path}): {e}")
            time.sleep(2)

    print("\n" + "=" * 60)
    print("📚 WIKI ОПУБЛИКОВАНА НА TELEGRA.PH")
    print("=" * 60)
    index_url = url_map.get("index.md", "(не опубликован)")
    print(f"\n🏠 Главная страница: {index_url}\n")
    for path, url in url_map.items():
        print(f"  {path:52s} → {url}")
    print(f"\n📁 Токен: {TOKEN_FILE}")
    print(f"📁 URL-маппинг: {URLS_FILE}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", default=None)
    parser.add_argument("--update", action="store_true")
    args = parser.parse_args()

    token = args.token
    if not token and os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            token = f.read().strip()
        print(f"🔑 Найден сохранённый токен: {TOKEN_FILE}")

    publish_wiki(token=token, update=args.update)
