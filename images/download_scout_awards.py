#!/usr/bin/env python3
"""
Download ScoutShop images for Cub Scout advancement awards and name them by SKU.

Includes:
- Adventure Loops (Lion, Tiger, Wolf, Bear)
- Adventure Pins (Webelos, Arrow of Light)
- Rank Emblems (Lion through Arrow of Light)

Images are saved as: SKU - product-title.jpg
"""

import os
import re
import csv
import time
import json
import shutil
import urllib.parse
from typing import Optional, Tuple

import requests
from bs4 import BeautifulSoup


# =========================
# Configuration
# =========================

BASE = "https://www.scoutshop.org"

OUT_DIR = "scout_awards_media"
CATALOG_CSV = os.path.join(OUT_DIR, "catalog.csv")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

PRODUCT_URL_RE = re.compile(r"-\d{5,7}\.html$", re.I)

SEARCH_QUERIES = [
    # Adventure Loops
    ("loop", "lion",  "lion adventure loop"),
    ("loop", "tiger", "tiger adventure loop"),
    ("loop", "wolf",  "wolf adventure loop"),
    ("loop", "bear",  "bear adventure loop"),

    # Adventure Pins
    ("pin", "webelos",        "webelos adventure pin"),
    ("pin", "arrow_of_light", "arrow of light adventure pin"),

    # Rank Emblems
    ("rank_patch", "lion",           "lion rank emblem patch"),
    ("rank_patch", "tiger",          "tiger rank emblem patch"),
    ("rank_patch", "wolf",           "wolf rank emblem patch"),
    ("rank_patch", "bear",           "bear rank emblem patch"),
    ("rank_patch", "webelos",        "webelos rank emblem patch"),
    ("rank_patch", "arrow_of_light", "arrow of light rank emblem patch"),
]

session = requests.Session()
session.headers.update(HEADERS)


# =========================
# Helpers
# =========================

def mkdirp(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def abs_url(base: str, href: str) -> str:
    return urllib.parse.urljoin(base, href)


def slugify(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", s).strip()
    s = re.sub(r"[\s_-]+", "-", s)
    return s[:140] if s else "item"


def get_soup(url: str, tries: int = 5) -> BeautifulSoup:
    last_err = None
    for attempt in range(1, tries + 1):
        try:
            r = session.get(url, timeout=30)
            r.raise_for_status()
            return BeautifulSoup(r.text, "html.parser")
        except Exception as e:
            last_err = e
            time.sleep(1.2 * attempt)
    raise last_err  # type: ignore


# =========================
# Folder setup
# =========================

def ensure_folders() -> None:
    mkdirp(OUT_DIR)
    mkdirp(os.path.join(OUT_DIR, "_all_flat"))

    for den in ["lion", "tiger", "wolf", "bear", "webelos", "arrow_of_light", "unknown"]:
        mkdirp(os.path.join(OUT_DIR, "loops", den))
        mkdirp(os.path.join(OUT_DIR, "pins", den))
        mkdirp(os.path.join(OUT_DIR, "rank_patches", den))


def pick_folder(ptype: str, den: str) -> str:
    den = den or "unknown"
    if ptype == "loop":
        return os.path.join(OUT_DIR, "loops", den)
    if ptype == "pin":
        return os.path.join(OUT_DIR, "pins", den)
    if ptype == "rank_patch":
        return os.path.join(OUT_DIR, "rank_patches", den)
    return os.path.join(OUT_DIR, "rank_patches", "unknown")


# =========================
# Detection logic (FIXED)
# =========================

def detect_den(title: str) -> str:
    """
    Detect den strictly from product title.
    This avoids footer/nav false positives.
    """
    t = (title or "").lower()

    patterns = [
        (r"\barrow of light\b", "arrow_of_light"),
        (r"\baol\b", "arrow_of_light"),
        (r"\bwebelos\b", "webelos"),
        (r"\bbear\b", "bear"),
        (r"\bwolf\b", "wolf"),
        (r"\btiger\b", "tiger"),
        (r"\blion\b", "lion"),
    ]

    for pat, den in patterns:
        if re.search(pat, t):
            return den

    return "unknown"


def detect_type(title: str, page_text: str) -> str:
    """
    Detect type from title first, page text only as fallback.
    """
    t = (title or "").lower()
    p = (page_text or "").lower()

    # Title-first detection (most reliable)
    if "adventure loop" in t:
        return "loop"
    if "adventure pin" in t:
        return "pin"
    if "rank emblem" in t or ("rank" in t and "emblem" in t):
        return "rank_patch"

    # Fallback to page text if title is vague
    if "adventure loop" in p:
        return "loop"
    if "adventure pin" in p:
        return "pin"
    if "rank emblem" in p:
        return "rank_patch"

    return "other"


# =========================
# Page parsing
# =========================

def extract_title(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1:
        return h1.get_text(" ", strip=True)
    title = soup.find("title")
    return title.get_text(" ", strip=True) if title else ""


def extract_sku(soup: BeautifulSoup, url: str) -> Optional[str]:
    text = soup.get_text(" ", strip=True)

    m = re.search(r"\bSKU:\s*([0-9]{5,10})\b", text)
    if m:
        return m.group(1)

    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or "")
            if isinstance(data, dict) and "sku" in data:
                return str(data["sku"])
        except Exception:
            pass

    m = re.search(r"-(\d{5,7})\.html$", url)
    return m.group(1) if m else None


def extract_image(soup: BeautifulSoup, page_url: str) -> Optional[str]:
    og = soup.find("meta", property="og:image")
    if og and og.get("content"):
        return og["content"]

    tw = soup.find("meta", attrs={"name": "twitter:image"})
    if tw and tw.get("content"):
        return tw["content"]

    for img in soup.select("img[src]"):
        src = abs_url(page_url, img["src"])
        if "/media/catalog/product" in src:
            return src

    return None


def parse_product_page(url: str):
    soup = get_soup(url)
    title = extract_title(soup)
    page_text = soup.get_text(" ", strip=True)

    sku = extract_sku(soup, url)
    img = extract_image(soup, url)
    ptype = detect_type(title, page_text)
    den = detect_den(title)

    return sku, title, img, ptype, den


# =========================
# Search + Download
# =========================

def search_url(query: str, page: int = 1) -> str:
    q = urllib.parse.quote_plus(query)
    return f"{BASE}/catalogsearch/result/?q={q}&p={page}"


def collect_links(query: str, max_pages: int = 6) -> list[str]:
    found = set()

    for page in range(1, max_pages + 1):
        soup = get_soup(search_url(query, page))
        before = len(found)

        for a in soup.select("a[href]"):
            href = abs_url(BASE, a["href"]).split("?")[0]
            if PRODUCT_URL_RE.search(href):
                found.add(href)

        if len(found) == before:
            break

        time.sleep(0.3)

    return sorted(found)


def download_image(url: str, dest: str) -> None:
    r = session.get(url, stream=True, timeout=30)
    r.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in r.iter_content(1024 * 128):
            f.write(chunk)


# =========================
# Main
# =========================

def main():
    ensure_folders()

    print("Collecting product links from ScoutShop search…")
    urls = []
    seen = set()

    for _, _, q in SEARCH_QUERIES:
        print(f"  Query: {q}")
        for u in collect_links(q):
            if u not in seen:
                seen.add(u)
                urls.append(u)

    print(f"Found {len(urls)} unique product links")

    with open(CATALOG_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["sku", "title", "type", "den", "url", "image", "filename", "folder"])

        for i, url in enumerate(urls, 1):
            sku, title, img, ptype, den = parse_product_page(url)

            if not sku or not img:
                print(f"[{i}/{len(urls)}] SKIP {url}")
                continue

            filename = f"{sku} - {slugify(title)}.jpg"
            folder = pick_folder(ptype, den)
            dest = os.path.join(folder, filename)
            flat = os.path.join(OUT_DIR, "_all_flat", filename)

            if not os.path.exists(dest):
                download_image(img, dest)
                shutil.copyfile(dest, flat)
                print(f"[{i}/{len(urls)}] OK {sku} -> {ptype}/{den}")
                time.sleep(0.4)

            writer.writerow([sku, title, ptype, den, url, img, filename, folder])

    print(f"Done. Catalog: {CATALOG_CSV}")


if __name__ == "__main__":
    main()
