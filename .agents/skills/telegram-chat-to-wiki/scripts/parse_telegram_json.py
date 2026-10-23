#!/usr/bin/env python3
"""
Telegram Export Analyzer (result.json)
Filters and extracts high-signal technical content from Telegram Desktop JSON export.
"""

import argparse
import json
import re
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path


def extract_text(text_entity):
    """Normalize text entity which can be string or list of objects."""
    if isinstance(text_entity, str):
        return text_entity
    if isinstance(text_entity, list):
        parts = []
        for part in text_entity:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and "text" in part:
                parts.append(part["text"])
        return "".join(parts)
    return ""


def analyze_export(input_file: Path, output_file: Path = None, keywords: list = None, min_length: int = 40):
    print(f"Loading {input_file}...")
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    messages = data.get("messages", [])
    print(f"Total raw messages: {len(messages)}")

    filtered = []
    senders = Counter()
    links = []

    keyword_regex = re.compile("|".join(keywords), re.IGNORECASE) if keywords else None

    for msg in messages:
        if msg.get("type") != "message":
            continue

        raw_text = extract_text(msg.get("text", ""))
        sender = msg.get("from", "Unknown")
        date_str = msg.get("date", "")

        if not raw_text or len(raw_text.strip()) < min_length:
            continue

        # Extract links
        urls = re.findall(r"https?://[^\s]+", raw_text)
        if urls:
            links.extend(urls)

        # Keyword filtering if requested
        if keyword_regex and not keyword_regex.search(raw_text):
            continue

        senders[sender] += 1
        filtered.append({
            "id": msg.get("id"),
            "date": date_str,
            "sender": sender,
            "text": raw_text.strip(),
            "has_media": bool(msg.get("photo") or msg.get("file")),
        })

    print(f"Filtered messages: {len(filtered)}")
    print(f"Top 5 active contributors: {senders.most_common(5)}")

    report = [
        f"# Анализ экспорта: {data.get('name', 'Telegram Chat')}",
        f"- **Всего сообщений:** {len(messages)}",
        f"- **Отобранных информативных сообщений:** {len(filtered)}",
        f"- **Уникальных ссылок:** {len(set(links))}",
        "",
        "## Наиболее активные авторы инженерных сообщений",
    ]
    for sender, count in senders.most_common(10):
        report.append(f"- **{sender}**: {count} сообщений")

    report.append("\n## Ключевые ссылки и внешние ресурсы")
    for link in sorted(set(links))[:50]:
        report.append(f"- {link}")

    report.append("\n## Выборка содержательных сообщений")
    for item in filtered:
        report.append(f"\n### [{item['date']}] {item['sender']} (ID: {item['id']})")
        report.append(f"{item['text']}\n")

    output_text = "\n".join(report)

    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(output_text)
        print(f"Report saved to {output_file}")
    else:
        print(output_text[:2000])


def main():
    parser = argparse.ArgumentParser(description="Extract technical insights from Telegram JSON export")
    parser.add_argument("input", type=Path, help="Path to result.json")
    parser.add_argument("-o", "--output", type=Path, default=None, help="Output markdown path")
    parser.add_argument("-k", "--keywords", nargs="+", default=None, help="Keywords to filter (regex or words)")
    parser.add_argument("--min-len", type=int, default=50, help="Minimum text length to retain")

    args = parser.parse_args()
    if not args.input.exists():
        print(f"Error: file {args.input} does not exist.")
        sys.exit(1)

    analyze_export(args.input, args.output, args.keywords, args.min_len)


if __name__ == "__main__":
    main()
