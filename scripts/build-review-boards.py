#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

PAGES = ["home", "services", "capabilities", "ownership", "about", "contact"]
BOARD_SPECS = [
    ("board-heroes-desktop.png", [(page, "desktop", "hero") for page in PAGES], (520, 320)),
    ("board-heroes-mobile.png", [(page, "mobile", "hero") for page in PAGES], (230, 410)),
    (
        "board-sections-desktop.png",
        [
            ("home", "desktop", "pillars"),
            ("services", "desktop", "signature-grid"),
            ("capabilities", "desktop", "systems"),
            ("ownership", "desktop", "owners"),
            ("about", "desktop", "values"),
            ("contact", "desktop", "request"),
        ],
        (520, 320),
    ),
    (
        "board-sections-mobile.png",
        [
            ("home", "mobile", "pillars"),
            ("services", "mobile", "signature-grid"),
            ("capabilities", "mobile", "systems"),
            ("ownership", "mobile", "owners"),
            ("about", "mobile", "values"),
            ("contact", "mobile", "request"),
        ],
        (230, 410),
    ),
    ("board-fullpages-desktop.png", [(page, "desktop", "full") for page in PAGES], (400, 560)),
    ("board-fullpages-mobile.png", [(page, "mobile", "full") for page in PAGES], (190, 520)),
]


def fit_image(image: Image.Image, size: tuple[int, int], pad_color: str) -> Image.Image:
    framed = ImageOps.contain(image.convert("RGB"), size)
    canvas = Image.new("RGB", size, pad_color)
    offset = ((size[0] - framed.width) // 2, (size[1] - framed.height) // 2)
    canvas.paste(framed, offset)
    return canvas


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]:
        try:
            return ImageFont.truetype(candidate, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_board(iter_dir: Path, output_name: str, items: list[tuple[str, str, str]], tile_size: tuple[int, int]) -> None:
    cols = 3
    rows = 2
    label_height = 34
    gap = 20
    outer = 28
    width = outer * 2 + cols * tile_size[0] + (cols - 1) * gap
    height = outer * 2 + rows * (tile_size[1] + label_height) + (rows - 1) * gap
    board = Image.new("RGB", (width, height), "#0f1717")
    draw = ImageDraw.Draw(board)
    title_font = load_font(18)
    label_font = load_font(16)

    for index, (page, device, anchor) in enumerate(items):
        src = iter_dir / f"{page}-{device}-{anchor}.png"
        if not src.exists():
            raise FileNotFoundError(src)
        image = Image.open(src)
        tile = fit_image(image, tile_size, "#101918")
        col = index % cols
        row = index // cols
        x = outer + col * (tile_size[0] + gap)
        y = outer + row * (tile_size[1] + label_height + gap)
        draw.rounded_rectangle((x - 2, y - 2, x + tile_size[0] + 2, y + label_height + tile_size[1] + 2), radius=16, outline="#29413d", width=1)
        label = f"{page.upper()} / {device.upper()} / {anchor.upper()}"
        draw.text((x, y), label, font=label_font, fill="#d8d2c7")
        board.paste(tile, (x, y + label_height))

    title = output_name.replace("board-", "").replace(".png", "").replace("-", " ").upper()
    draw.text((outer, 8), title, font=title_font, fill="#f1ece2")
    board.save(iter_dir / output_name)


def main() -> None:
    import sys

    if len(sys.argv) != 2:
      raise SystemExit("Usage: build-review-boards.py /path/to/iteration")

    iter_dir = Path(sys.argv[1])
    if not iter_dir.is_dir():
        raise SystemExit(f"Missing iteration directory: {iter_dir}")

    for output_name, items, tile_size in BOARD_SPECS:
        build_board(iter_dir, output_name, items, tile_size)


if __name__ == "__main__":
    main()
