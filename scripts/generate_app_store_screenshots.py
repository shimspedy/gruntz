#!/usr/bin/env python3

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
FRAME_PATH = Path.home() / ".codex/skills/aso-appstore-screenshots/assets/device_frame.png"

HEADLINE_FONT_CANDIDATES = [
    Path("/Library/Fonts/SF-Pro-Display-Black.otf"),
    Path("/System/Library/Fonts/Supplemental/Arial Black.ttf"),
    Path("/System/Library/Fonts/Supplemental/Impact.ttf"),
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
]
UI_FONT_CANDIDATES = [
    Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    *HEADLINE_FONT_CANDIDATES,
]


@dataclass(frozen=True)
class ShotSpec:
    order: int
    slug: str
    source: Path
    verb: str
    desc: str
    breakout_box: tuple[float, float, float, float] | None


@dataclass(frozen=True)
class TargetSpec:
    key: str
    width: int
    height: int
    text_top: int
    verb_max: int
    verb_min: int
    desc_size: int
    desc_line_gap: int
    device_width: int
    device_y: int
    breakout_scale: float
    breakout_max_width: float


SHOTS: tuple[ShotSpec, ...] = (
    ShotSpec(
        order=1,
        slug="complete-todays-mission",
        source=ROOT / "screenshots/raw/01_home.png",
        verb="COMPLETE",
        desc="TODAY'S MISSION",
        breakout_box=(0.04, 0.26, 0.96, 0.86),
    ),
    ShotSpec(
        order=2,
        slug="follow-every-round",
        source=ROOT / "screenshots/raw/05_daily_mission.png",
        verb="FOLLOW",
        desc="EVERY ROUND",
        breakout_box=(0.07, 0.40, 0.94, 0.87),
    ),
    ShotSpec(
        order=3,
        slug="master-training-cards",
        source=ROOT / "screenshots/raw/02_missions.png",
        verb="MASTER",
        desc="ELITE TRAINING CARDS",
        breakout_box=(0.04, 0.59, 0.95, 0.86),
    ),
    ShotSpec(
        order=4,
        slug="track-xp-and-streaks",
        source=ROOT / "screenshots/raw/03_progress.png",
        verb="TRACK",
        desc="XP, STREAKS & STATS",
        breakout_box=(0.04, 0.35, 0.96, 0.82),
    ),
    ShotSpec(
        order=5,
        slug="start-with-15-days-free",
        source=ROOT / "screenshots/raw/04_profile.png",
        verb="START",
        desc="WITH 15 DAYS FREE",
        breakout_box=(0.05, 0.34, 0.95, 0.69),
    ),
)

TARGETS: dict[str, TargetSpec] = {
    "iphone_6_5": TargetSpec(
        key="iphone_6_5",
        width=1284,
        height=2778,
        text_top=188,
        verb_max=248,
        verb_min=144,
        desc_size=120,
        desc_line_gap=22,
        device_width=1030,
        device_y=728,
        breakout_scale=1.33,
        breakout_max_width=0.96,
    ),
    "ipad_13": TargetSpec(
        key="ipad_13",
        width=2064,
        height=2752,
        text_top=170,
        verb_max=262,
        verb_min=156,
        desc_size=124,
        desc_line_gap=26,
        device_width=1220,
        device_y=760,
        breakout_scale=1.62,
        breakout_max_width=0.94,
    ),
}

BACKGROUND = "#007DAF"
FRAME_BASE_WIDTH = 1030
FRAME_BASE_HEIGHT = 2800
FRAME_BASE_BEZEL = 15
FRAME_BASE_SCREEN_RADIUS = 62
STATUS_BAR_HEIGHT_RATIO = 0.056


def resolve_font(candidates: Iterable[Path]) -> Path:
    for path in candidates:
        if path.exists():
            return path
    raise FileNotFoundError("No supported font found for screenshot generation.")


HEADLINE_FONT_PATH = resolve_font(HEADLINE_FONT_CANDIDATES)
UI_FONT_PATH = resolve_font(UI_FONT_CANDIDATES)


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    stripped = value.lstrip("#")
    return tuple(int(stripped[index:index + 2], 16) for index in (0, 2, 4))


def fit_font(text: str, max_width: int, size_max: int, size_min: int) -> ImageFont.FreeTypeFont:
    probe = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    for size in range(size_max, size_min - 1, -2):
        font = ImageFont.truetype(str(HEADLINE_FONT_PATH), size)
        bbox = probe.textbbox((0, 0), text, font=font)
        if (bbox[2] - bbox[0]) <= max_width:
            return font
    return ImageFont.truetype(str(HEADLINE_FONT_PATH), size_min)


def word_wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    canvas_width: int,
    start_y: int,
    text: str,
    font: ImageFont.FreeTypeFont,
    max_width: int | None,
    line_gap: int,
) -> int:
    lines = word_wrap(draw, text, font, max_width) if max_width else [text]
    y = start_y
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        draw.text((canvas_width // 2, y - bbox[1]), line, fill="white", font=font, anchor="mt")
        y += (bbox[3] - bbox[1]) + line_gap
    return y - line_gap


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def add_shadow(base: Image.Image, box: tuple[int, int, int, int], radius: int, blur: int, opacity: int) -> Image.Image:
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(shadow_mask).rounded_rectangle(box, radius=radius, fill=opacity)
    shadow.putalpha(shadow_mask.filter(ImageFilter.GaussianBlur(blur)))
    return Image.alpha_composite(base, shadow)


def overlay_clean_status_bar(image: Image.Image) -> Image.Image:
    result = image.copy()
    draw = ImageDraw.Draw(result)
    width, height = result.size
    bar_height = int(height * STATUS_BAR_HEIGHT_RATIO)
    draw.rectangle((0, 0, width, bar_height), fill=(0, 0, 0, 255))

    time_font = ImageFont.truetype(str(UI_FONT_PATH), max(36, width // 28))
    time_y = max(18, bar_height // 2 - 22)
    draw.text((width * 0.10, time_y), "9:41", fill="white", font=time_font)

    battery_h = max(26, width // 42)
    battery_w = int(battery_h * 2.05)
    battery_x = width - battery_w - int(width * 0.085)
    battery_y = max(20, bar_height // 2 - battery_h // 2)
    battery_r = max(6, battery_h // 4)
    draw.rounded_rectangle((battery_x, battery_y, battery_x + battery_w, battery_y + battery_h), radius=battery_r, outline="white", width=3)
    nub_w = max(5, battery_h // 5)
    nub_h = max(10, battery_h // 3)
    nub_y = battery_y + (battery_h - nub_h) // 2
    draw.rounded_rectangle((battery_x + battery_w + 3, nub_y, battery_x + battery_w + nub_w, nub_y + nub_h), radius=2, fill="white")
    fill_pad = 6
    draw.rounded_rectangle(
        (
            battery_x + fill_pad,
            battery_y + fill_pad,
            battery_x + battery_w - fill_pad,
            battery_y + battery_h - fill_pad,
        ),
        radius=max(4, battery_r - 2),
        fill="white",
    )

    wifi_size = int(battery_h * 1.15)
    wifi_x = battery_x - wifi_size - int(width * 0.02)
    wifi_y = battery_y - 2
    for inset, width_px in ((0, 3), (8, 3), (16, 3)):
        draw.arc(
            (wifi_x + inset, wifi_y + inset, wifi_x + wifi_size - inset, wifi_y + wifi_size - inset),
            start=210,
            end=330,
            fill="white",
            width=width_px,
        )
    draw.ellipse(
        (
            wifi_x + wifi_size // 2 - 4,
            wifi_y + wifi_size // 2 + 10,
            wifi_x + wifi_size // 2 + 4,
            wifi_y + wifi_size // 2 + 18,
        ),
        fill="white",
    )

    bars_base_x = wifi_x - int(width * 0.05)
    bars_base_y = battery_y + battery_h - 2
    bar_w = max(7, width // 180)
    gap = max(4, bar_w // 2)
    heights = (10, 16, 22, 28)
    for index, bar_height_px in enumerate(heights):
        left = bars_base_x + index * (bar_w + gap)
        draw.rounded_rectangle(
            (left, bars_base_y - bar_height_px, left + bar_w, bars_base_y),
            radius=bar_w // 2,
            fill="white",
        )
    return result


def breakout_box_from_normalized(image: Image.Image, box: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    width, height = image.size
    x0, y0, x1, y1 = box
    return (
        int(width * x0),
        int(height * y0),
        int(width * x1),
        int(height * y1),
    )


def render_breakout(
    canvas: Image.Image,
    screenshot: Image.Image,
    target: TargetSpec,
    box: tuple[float, float, float, float] | None,
    screen_x: int,
    screen_y: int,
    screen_scale: float,
) -> Image.Image:
    if box is None:
        return canvas

    crop_box = breakout_box_from_normalized(screenshot, box)
    crop = screenshot.crop(crop_box).convert("RGBA")
    crop_width, crop_height = crop.size
    breakout_width = min(int(crop_width * screen_scale * target.breakout_scale), int(target.width * target.breakout_max_width))
    breakout_height = int(crop_height * breakout_width / crop_width)
    breakout = crop.resize((breakout_width, breakout_height), Image.Resampling.LANCZOS)

    radius = max(28, breakout_width // 18)
    mask = rounded_mask((breakout_width, breakout_height), radius)
    breakout.putalpha(mask)

    crop_center_x = (crop_box[0] + crop_box[2]) / 2
    crop_center_y = (crop_box[1] + crop_box[3]) / 2
    on_screen_center_x = screen_x + int(crop_center_x * screen_scale)
    on_screen_center_y = screen_y + int(crop_center_y * screen_scale)
    breakout_x = on_screen_center_x - breakout_width // 2
    breakout_y = on_screen_center_y - breakout_height // 2

    breakout_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_box = (
        breakout_x,
        breakout_y + 28,
        breakout_x + breakout_width,
        breakout_y + breakout_height + 28,
    )
    breakout_layer = add_shadow(breakout_layer, shadow_box, radius=radius, blur=30, opacity=115)
    breakout_layer.paste(breakout, (breakout_x, breakout_y), breakout)
    return Image.alpha_composite(canvas, breakout_layer)


def render_shot(shot: ShotSpec, target: TargetSpec, output_path: Path) -> None:
    canvas = Image.new("RGBA", (target.width, target.height), (*hex_to_rgb(BACKGROUND), 255))
    draw = ImageDraw.Draw(canvas)

    max_text_width = int(target.width * 0.74)
    verb_font = fit_font(shot.verb, max_text_width, target.verb_max, target.verb_min)
    desc_font = ImageFont.truetype(str(HEADLINE_FONT_PATH), target.desc_size)
    verb_bottom = draw_centered_text(
        draw=draw,
        canvas_width=target.width,
        start_y=target.text_top,
        text=shot.verb,
        font=verb_font,
        max_width=None,
        line_gap=target.desc_line_gap,
    )
    draw_centered_text(
        draw=draw,
        canvas_width=target.width,
        start_y=verb_bottom + 26,
        text=shot.desc,
        font=desc_font,
        max_width=max_text_width,
        line_gap=target.desc_line_gap,
    )

    screenshot = Image.open(shot.source).convert("RGBA")
    cleaned_screenshot = overlay_clean_status_bar(screenshot)

    frame = Image.open(FRAME_PATH).convert("RGBA")
    frame_height = round(FRAME_BASE_HEIGHT * target.device_width / FRAME_BASE_WIDTH)
    frame = frame.resize((target.device_width, frame_height), Image.Resampling.LANCZOS)
    device_x = (target.width - target.device_width) // 2
    bezel = max(14, round(FRAME_BASE_BEZEL * target.device_width / FRAME_BASE_WIDTH))
    screen_radius = max(32, round(FRAME_BASE_SCREEN_RADIUS * target.device_width / FRAME_BASE_WIDTH))
    screen_width = target.device_width - (bezel * 2)
    screen_scale = screen_width / cleaned_screenshot.width
    screen_height = int(cleaned_screenshot.height * screen_scale)
    screen_x = device_x + bezel
    screen_y = target.device_y + bezel
    screen_image = cleaned_screenshot.resize((screen_width, screen_height), Image.Resampling.LANCZOS)

    canvas = render_breakout(canvas, screenshot, target, shot.breakout_box, screen_x, screen_y, screen_scale)

    phone_shadow_box = (
        device_x + 14,
        target.device_y + 42,
        device_x + target.device_width - 14,
        min(target.height + 320, target.device_y + int(target.device_width * 2.02)),
    )
    canvas = add_shadow(canvas, phone_shadow_box, radius=max(42, target.device_width // 12), blur=36, opacity=105)

    screen_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    screen_mask = Image.new("L", canvas.size, 0)
    ImageDraw.Draw(screen_mask).rounded_rectangle(
        (screen_x, screen_y, screen_x + screen_width, screen_y + screen_height),
        radius=screen_radius,
        fill=255,
    )
    screen_layer.paste(screen_image, (screen_x, screen_y))
    screen_layer.putalpha(screen_mask)
    canvas = Image.alpha_composite(canvas, screen_layer)

    frame_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    frame_layer.paste(frame, (device_x, target.device_y), frame)
    canvas = Image.alpha_composite(canvas, frame_layer)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output_path, "PNG")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate App Store screenshots for Gruntz.")
    parser.add_argument(
        "--target",
        action="append",
        dest="targets",
        choices=sorted(TARGETS.keys()),
        help="Target size to render. Defaults to all targets.",
    )
    parser.add_argument(
        "--output-root",
        default=str(ROOT / "screenshots/app_store"),
        help="Root directory for generated outputs.",
    )
    args = parser.parse_args()

    selected_targets = [TARGETS[key] for key in (args.targets or sorted(TARGETS.keys()))]
    output_root = Path(args.output_root)

    for target in selected_targets:
        for shot in SHOTS:
            filename = f"{shot.order:02d}_{shot.slug}.png"
            render_shot(shot, target, output_root / target.key / filename)
            print(f"generated {target.key}/{filename}")


if __name__ == "__main__":
    main()
