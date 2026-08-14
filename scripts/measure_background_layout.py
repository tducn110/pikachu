"""Measure the parchment bounds in background.png and emit CSS tokens."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGE_PATH = ROOT / "public" / "background.png"
OUTPUT_PATH = ROOT / "src" / "styles" / "background-layout.generated.css"


def is_frame_pixel(rgb: tuple[int, int, int]) -> bool:
    red, green, blue = rgb
    return red > 150 and red > green * 1.25 and 45 < green < 190 and blue < 130


def main() -> None:
    image = Image.open(IMAGE_PATH).convert("RGB")
    width, height = image.size
    row_scores = [
        sum(is_frame_pixel(image.getpixel((x, y))) for x in range(width // 8, width * 7 // 8))
        for y in range(height)
    ]
    col_scores = [
        sum(is_frame_pixel(image.getpixel((x, y))) for y in range(height // 8, height * 7 // 8))
        for x in range(width)
    ]
    # The strongest scan lines are the inner ornament. The playable shell is
    # the outer rail around it, so include the measured rail inset explicitly.
    top = max(range(height // 2), key=row_scores.__getitem__) - 29
    bottom = max(range(height // 2, height), key=row_scores.__getitem__) + 25
    left = max(range(width // 2), key=col_scores.__getitem__) - 28
    right = max(range(width // 2, width), key=col_scores.__getitem__) + 27
    css = f""":root {{
  /* Generated from public/background.png ({width}x{height}). */
  --bg-frame-left: {left / width:.6%};
  --bg-frame-top: {top / height:.6%};
  --bg-frame-right: {right / width:.6%};
  --bg-frame-bottom: {bottom / height:.6%};
  --bg-frame-width: {(right - left) / width:.6%};
  --bg-frame-height: {(bottom - top) / height:.6%};
}}
"""
    OUTPUT_PATH.write_text(css, encoding="utf-8")
    print(f"Measured frame: x={left}..{right}, y={top}..{bottom}")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
