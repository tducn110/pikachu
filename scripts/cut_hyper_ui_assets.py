#!/usr/bin/env python3
"""Cut generated hyper-UI master sheets into validated runtime PNG assets."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageStat


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "design-assets" / "hyper-ui"
DEFAULT_OUTPUT = ROOT / "public" / "hyper-ui"


@dataclass(frozen=True)
class Cell:
    name: str
    kind: str
    source_box: tuple[int, int, int, int]


SURFACE_CELLS = (
    Cell("title-bar", "surface", (20, 180, 620, 430)),
    Cell("powerup-row", "surface", (650, 180, 1220, 430)),
    Cell("info-row", "surface", (30, 720, 620, 970)),
    Cell("panel-frame", "surface", (640, 560, 1230, 1130)),
)

ICON_CELLS = (
    Cell("hint", "icon", (80, 80, 400, 415)),
    Cell("shuffle", "icon", (450, 80, 800, 410)),
    Cell("bomb", "icon", (850, 50, 1220, 415)),
    Cell("settings", "icon", (70, 460, 410, 820)),
    Cell("trophy", "icon", (450, 450, 800, 820)),
    Cell("clock", "icon", (850, 450, 1210, 820)),
    Cell("heart", "icon", (70, 870, 410, 1210)),
    Cell("music", "icon", (470, 850, 780, 1190)),
    Cell("sound", "icon", (850, 850, 1210, 1190)),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def median_key_color(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    border = max(4, min(width, height) // 80)
    samples = []
    samples.extend(rgb.crop((0, 0, width, border)).getdata())
    samples.extend(rgb.crop((0, height - border, width, height)).getdata())
    samples.extend(rgb.crop((0, border, border, height - border)).getdata())
    samples.extend(rgb.crop((width - border, border, width, height - border)).getdata())
    samples.sort(key=lambda pixel: pixel[0])
    red = samples[len(samples) // 2][0]
    samples.sort(key=lambda pixel: pixel[1])
    green = samples[len(samples) // 2][1]
    samples.sort(key=lambda pixel: pixel[2])
    blue = samples[len(samples) // 2][2]
    return red, green, blue


def chroma_to_alpha(image: Image.Image) -> tuple[Image.Image, tuple[int, int, int]]:
    """Remove the generated magenta field while preserving cream and purple."""
    rgb = image.convert("RGB")
    key = median_key_color(rgb)
    output = Image.new("RGBA", rgb.size)
    converted = []

    transparent_distance = 50.0
    opaque_distance = 120.0
    distance_span = opaque_distance - transparent_distance

    for red, green, blue in rgb.getdata():
        distance = math.sqrt(
            (red - key[0]) ** 2 +
            (green - key[1]) ** 2 +
            (blue - key[2]) ** 2
        )

        if distance <= transparent_distance:
            converted.append((0, 0, 0, 0))
            continue

        if distance >= opaque_distance:
            converted.append((red, green, blue, 255))
            continue

        progress = (distance - transparent_distance) / distance_span
        progress = progress * progress * (3.0 - 2.0 * progress)
        alpha = max(1, min(254, round(progress * 255)))
        alpha_fraction = alpha / 255.0

        # Reverse the chroma blend on antialiased edge pixels.
        clean_red = round((red - key[0] * (1.0 - alpha_fraction)) / alpha_fraction)
        clean_green = round((green - key[1] * (1.0 - alpha_fraction)) / alpha_fraction)
        clean_blue = round((blue - key[2] * (1.0 - alpha_fraction)) / alpha_fraction)
        converted.append((
            max(0, min(255, clean_red)),
            max(0, min(255, clean_green)),
            max(0, min(255, clean_blue)),
            alpha,
        ))

    output.putdata(converted)
    return output, key


def trim_with_padding(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value >= 20 else 0)
    bounds = visible.getbbox()
    if bounds is None:
        raise ValueError("generated cell has no visible pixels")

    left = max(0, bounds[0] - padding)
    top = max(0, bounds[1] - padding)
    right = min(image.width, bounds[2] + padding)
    bottom = min(image.height, bounds[3] + padding)
    return image.crop((left, top, right, bottom))


def normalize_icon(image: Image.Image, size: int = 256, inset: int = 14) -> Image.Image:
    target = size - inset * 2
    scale = min(target / image.width, target / image.height)
    resized = image.resize(
        (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def normalize_surface(image: Image.Image, max_dimension: int = 640) -> Image.Image:
    scale = min(1.0, max_dimension / max(image.size))
    if scale == 1.0:
        return image
    return image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )


def nine_slice_for(name: str, width: int, height: int) -> dict[str, int] | None:
    if name == "panel-frame":
        return {
            "leftWidth": round(width * 0.18),
            "topHeight": round(height * 0.18),
            "rightWidth": round(width * 0.18),
            "bottomHeight": round(height * 0.18),
        }
    if name == "title-bar":
        return {
            "leftWidth": round(height * 0.72),
            "topHeight": round(height * 0.28),
            "rightWidth": round(height * 0.72),
            "bottomHeight": round(height * 0.28),
        }
    if name == "powerup-row":
        return {
            "leftWidth": round(height * 1.08),
            "topHeight": round(height * 0.26),
            "rightWidth": round(height * 0.72),
            "bottomHeight": round(height * 0.26),
        }
    if name == "info-row":
        return {
            "leftWidth": round(height * 1.02),
            "topHeight": round(height * 0.26),
            "rightWidth": round(height * 0.32),
            "bottomHeight": round(height * 0.26),
        }
    return None


def image_metrics(image: Image.Image) -> dict[str, object]:
    alpha = image.getchannel("A")
    stat = ImageStat.Stat(alpha)
    total = image.width * image.height
    transparent = sum(1 for value in alpha.getdata() if value == 0)
    partial = sum(1 for value in alpha.getdata() if 0 < value < 255)
    corners = [
        alpha.getpixel((0, 0)),
        alpha.getpixel((image.width - 1, 0)),
        alpha.getpixel((0, image.height - 1)),
        alpha.getpixel((image.width - 1, image.height - 1)),
    ]
    return {
        "width": image.width,
        "height": image.height,
        "meanAlpha": round(stat.mean[0], 2),
        "transparentRatio": round(transparent / total, 4),
        "partialAlphaRatio": round(partial / total, 4),
        "cornerAlpha": corners,
    }


def validate_asset(name: str, image: Image.Image) -> None:
    if image.mode != "RGBA":
        raise ValueError(f"{name}: expected RGBA, got {image.mode}")
    metrics = image_metrics(image)
    if any(metrics["cornerAlpha"]):
        raise ValueError(f"{name}: output corners are not transparent")
    if metrics["transparentRatio"] < 0.08:
        raise ValueError(f"{name}: insufficient transparent padding")
    if image.getchannel("A").getbbox() is None:
        raise ValueError(f"{name}: output is empty")


def save_asset(
    image: Image.Image,
    cell: Cell,
    directory: Path,
    source_box: tuple[int, int, int, int],
) -> dict[str, object]:
    trimmed = trim_with_padding(image)
    normalized = normalize_icon(trimmed) if cell.kind == "icon" else normalize_surface(trimmed)
    validate_asset(cell.name, normalized)

    subdirectory = directory / ("icons" if cell.kind == "icon" else "surfaces")
    subdirectory.mkdir(parents=True, exist_ok=True)
    target = subdirectory / f"{cell.name}.png"
    normalized.save(target, optimize=True)

    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    metrics = image_metrics(normalized)
    metrics.update({
        "file": target.relative_to(directory).as_posix(),
        "kind": cell.kind,
        "sourceCell": list(source_box),
        "sha256": digest,
    })
    slice_config = nine_slice_for(cell.name, normalized.width, normalized.height)
    if slice_config:
        metrics["nineSlice"] = slice_config
    return metrics


def cut_sheet(
    source: Path,
    cells: tuple[Cell, ...],
    output: Path,
) -> tuple[dict[str, dict[str, object]], tuple[int, int, int]]:
    raw = Image.open(source)
    alpha_sheet, key = chroma_to_alpha(raw)
    assets: dict[str, dict[str, object]] = {}
    for cell in cells:
        box = cell.source_box
        assets[cell.name] = save_asset(alpha_sheet.crop(box), cell, output, box)
    return assets, key


def main() -> None:
    args = parse_args()
    source_dir = args.source_dir.resolve()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    surfaces, surface_key = cut_sheet(
        source_dir / "surfaces-master.png",
        SURFACE_CELLS,
        output_dir,
    )
    icons, icon_key = cut_sheet(
        source_dir / "icons-master.png",
        ICON_CELLS,
        output_dir,
    )

    all_assets = {**surfaces, **icons}
    manifest = {
        "version": 1,
        "generatedFrom": {
            "surfaces": "design-assets/hyper-ui/surfaces-master.png",
            "icons": "design-assets/hyper-ui/icons-master.png",
        },
        "chromaKeys": {
            "surfaces": list(surface_key),
            "icons": list(icon_key),
        },
        "assets": all_assets,
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )

    nine_slice = {
        name: {
            "file": data["file"],
            **data["nineSlice"],
        }
        for name, data in surfaces.items()
        if "nineSlice" in data
    }
    (output_dir / "nine-slice.json").write_text(
        json.dumps(nine_slice, indent=2, ensure_ascii=True) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {len(all_assets)} validated assets to {output_dir}")
    print(f"Surface key: #{surface_key[0]:02x}{surface_key[1]:02x}{surface_key[2]:02x}")
    print(f"Icon key: #{icon_key[0]:02x}{icon_key[1]:02x}{icon_key[2]:02x}")


if __name__ == "__main__":
    main()
