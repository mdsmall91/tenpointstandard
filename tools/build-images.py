#!/usr/bin/env python3
"""
Build the site's photography from the Ten Point asset library.

Every image the site uses is derived here, never hand-cropped, so that
re-picking a photo is a one-line edit and one command:

    python tools/build-images.py

Source library (read only, never written to):
    Matt's Files/Ignite Wild/Ten Point Services/Assests/Photos/

Output (committed to the repo):
    assets/read/     lane one photo cards
    assets/points/   the ten point openers
    assets/about/    the four project cards
    assets/og/       1200x630 Open Graph cards

Each pick declares its own crop aspect and the widths it needs. WebP is
the primary format at every width; one JPEG is emitted at the middle
width as a fallback. Nothing is ever upscaled past its source.

PROVENANCE IS PART OF THE DATA. Every entry carries `credit`, which the
page prints under or over the image. "Ten Point Services" means Ten Point
built it. Anything else says so plainly. A photo that implies Ten Point
built something it did not is a licensing problem for a general
contractor, not a design detail.
"""

import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required: python -m pip install pillow")

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(
    os.path.dirname(os.path.dirname(REPO)),   # ...\Documents
    "Matt's Files", "Ignite Wild", "Ten Point Services", "Assests", "Photos",
)

U = "upscaled_realesrgan/"   # 2048px-long-edge copies, sorted by project
T = "10PS Images/"           # the original Ten Point drop

CARD_W = [800, 1400]
OPENER_W = [1400, 2000]
# The board's cards are portrait, and so is the photo pane on an open
# card. The booth set is 2:3 already, so these crop to nothing.
BOARD_W = [760, 1200]
# The list variant of the assessment runs a wide opener above the four
# questions. Same photograph as the board, cropped landscape, so the
# A/B test compares two interfaces and not two sets of pictures.
WIDE_W = [900, 1400]

# ---------------------------------------------------------------------------
# The picks. Matt's calls, September 9 2026:
#   - Larkspur and Granby are OUT. Provenance was never established, so
#     nothing from either set ships.
#   - The KOA Fredericksburg clubhouse is a RENDERING, not a photograph.
#     Out. The KOA grading aerial is a real photograph and stays.
#   - Where the library has no real Ten Point photograph for a category,
#     licensed stock is used and captioned as stock on the page.
# ---------------------------------------------------------------------------
PICKS = [
    # ---- Lane one, screen 1: project type -------------------------------
    ("read/type-campground", T + "Outdoorsy Bayfield/4.jpg", "4/3", CARD_W,
     "Outdoorsy Bayfield, Colorado", "Ten Point Services"),
    ("read/type-rv", "AdobeStock_445872879.jpeg", "4/3", CARD_W,
     "Stock photograph", "Adobe Stock"),
    ("read/type-glamping", T + "Copy of DSC00121.jpg", "4/3", CARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("read/type-parkrec", "AdobeStock_886351116.jpeg", "4/3", CARD_W,
     "Stock photograph", "Adobe Stock"),

    # ---- Lane one, screen 2: terrain ------------------------------------
    # These describe the VISITOR's land, not Ten Point's work, so stock is
    # fine here by design. Every one below still happens to be real.
    ("read/land-wooded", U + "Outdoorsy Hill Country/356-web-or-mls-33-3777.jpg", "4/3", CARD_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("read/land-open", U + "Booth Images/Hill Country Landscape.jpg", "4/3", CARD_W,
     "Texas Hill Country", "Ten Point Services"),
    ("read/land-water", U + "Outdoorsy Hill Country/Gallery (3).jpg", "4/3", CARD_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("read/land-rocky", "IMG_4852.JPEG", "4/3", CARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),

    # ---- Lane one, screen 4: the two-up ---------------------------------
    # One pair, not two (review R2: twelve screens is not ninety seconds).
    ("read/compare-a", "Moto Adventures/2200x1278-30-cabins.jpg", "3/2", CARD_W,
     "Austin Moto Adventures, Texas", "Ten Point Services"),
    ("read/compare-b", U + "Lagom Ranch/5f0b220014a1cba760e0c54f9828212f.jpg", "3/2", CARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),

    # ---- Lane two: the ten point openers --------------------------------
    ("points/01-property", U + "Outdoorsy Hill Country/356-web-or-mls-33-3777.jpg", "16/9", OPENER_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points/02-capital", U + "Booth Images/Backup/Moto.jpg", "2/3", BOARD_W,
     "Austin Moto Adventures, Texas", "Ten Point Services"),
    ("points/03-regulatory", U + "KOA-Fredricksburg.jpg", "16/9", OPENER_W,
     "KOA Fredericksburg, Texas", "Ten Point Services"),
    ("points/04-guests", U + "Booth Images/Backup/Hill Country Night.jpg", "2/3", BOARD_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points/05-design", U + "Booth Images/Lagom3.jpg", "2/3", BOARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points/06-procurement", U + "Booth Images/Backup/Lagom5.jpg", "2/3", BOARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points/07-schedule", U + "Booth Images/Backup/Hill Country2.jpg", "2/3", BOARD_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points/08-cost", U + "Booth Images/Backup/Lagom3.jpg", "2/3", BOARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points/09-qa", U + "Booth Images/Backup/Fredericksburg.jpg", "2/3", BOARD_W,
     "KOA Fredericksburg, Texas", "Ten Point Services"),
    ("points/10-opening", U + "Booth Images/Backup/Lagom4.jpg", "2/3", BOARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),


    # ---- The same ten, cropped wide for the list variant --------------
    ("points-wide/01-property", U + "Outdoorsy Hill Country/356-web-or-mls-33-3777.jpg", "3/2", WIDE_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points-wide/02-capital", U + "Booth Images/Backup/Moto.jpg", "3/2", WIDE_W,
     "Austin Moto Adventures, Texas", "Ten Point Services"),
    ("points-wide/03-regulatory", U + "KOA-Fredricksburg.jpg", "3/2", WIDE_W,
     "KOA Fredericksburg, Texas", "Ten Point Services"),
    ("points-wide/04-guests", U + "Booth Images/Backup/Hill Country Night.jpg", "3/2", WIDE_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points-wide/05-design", U + "Booth Images/Lagom3.jpg", "3/2", WIDE_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points-wide/06-procurement", U + "Booth Images/Backup/Lagom5.jpg", "3/2", WIDE_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points-wide/07-schedule", U + "Booth Images/Backup/Hill Country2.jpg", "3/2", WIDE_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("points-wide/08-cost", U + "Booth Images/Backup/Lagom3.jpg", "3/2", WIDE_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("points-wide/09-qa", U + "Booth Images/Backup/Fredericksburg.jpg", "3/2", WIDE_W,
     "KOA Fredericksburg, Texas", "Ten Point Services"),
    ("points-wide/10-opening", U + "Booth Images/Backup/Lagom4.jpg", "3/2", WIDE_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),

    # ---- About: four projects -------------------------------------------
    ("about/lagom", T + "Copy of DSC00593.jpg", "3/2", CARD_W,
     "Lagom Retreat, Dripping Springs, Texas", "Ten Point Services"),
    ("about/bayfield", T + "Outdoorsy Bayfield/1.jpg", "3/2", CARD_W,
     "Outdoorsy Bayfield, Colorado", "Ten Point Services"),
    ("about/hillcountry", U + "Outdoorsy Hill Country/Gallery.jpg", "3/2", CARD_W,
     "Outdoorsy Hill Country, Texas", "Ten Point Services"),
    ("about/moto", "Moto Adventures/2000x1053-01.jpg", "3/2", CARD_W,
     "Austin Moto Adventures, Texas", "Ten Point Services"),
]

# Open Graph cards are photo only. No type is burned in: the brand faces
# are Google-hosted webfonts that are not installed locally, and a card
# set in a substitute font is worse than a card with no words on it.
OG = [
    ("og/home", U + "Outdoorsy Hill Country/Stonewall.jpg"),
    ("og/read", T + "Copy of DSC00121.jpg"),
    ("og/standard", U + "Outdoorsy Hill Country/356-web-or-mls-33-3777.jpg"),
    ("og/about", T + "Copy of DSC00593.jpg"),
    ("og/show", U + "Lagom Ranch/5f0b220014a1cba760e0c54f9828212f.jpg"),
]


def load(rel):
    path = os.path.join(LIB, rel)
    if not os.path.isfile(path):
        raise FileNotFoundError(path)
    im = Image.open(path)
    # Phone photographs carry rotation in EXIF only. Without this the
    # portrait shots land on their side.
    return ImageOps.exif_transpose(im).convert("RGB")


def ratio(spec):
    a, b = spec.split("/")
    return float(a) / float(b)


def emit(im, out_base, widths, aspect):
    target = ratio(aspect)
    src_w, src_h = im.size
    # Crop to the target aspect from the centre, then scale down. Never up:
    # an upscaled hero looks worse than a slightly smaller one.
    if src_w / src_h > target:
        new_w = int(round(src_h * target))
        box = ((src_w - new_w) // 2, 0, (src_w - new_w) // 2 + new_w, src_h)
    else:
        new_h = int(round(src_w / target))
        box = (0, (src_h - new_h) // 2, src_w, (src_h - new_h) // 2 + new_h)
    cropped = im.crop(box)

    usable = [w for w in widths if w <= cropped.width] or [cropped.width]
    written = []
    for w in usable:
        h = int(round(w / target))
        scaled = cropped.resize((w, h), Image.LANCZOS)
        p = os.path.join(REPO, "assets", out_base + "-" + str(w) + ".webp")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        scaled.save(p, "WEBP", quality=82, method=6)
        written.append(p)
    # One JPEG fallback, at the smallest usable width.
    w = usable[0]
    h = int(round(w / target))
    p = os.path.join(REPO, "assets", out_base + "-" + str(w) + ".jpg")
    cropped.resize((w, h), Image.LANCZOS).save(p, "JPEG", quality=84, optimize=True, progressive=True)
    written.append(p)
    return written, usable, cropped.width


def main():
    if not os.path.isdir(LIB):
        sys.exit("Asset library not found: " + LIB)

    total = 0
    manifest = []
    print("Library:", LIB)
    print()

    for name, src, aspect, widths, caption, credit in PICKS:
        try:
            im = load(src)
        except FileNotFoundError:
            print("  MISSING  " + name + "  <- " + src)
            continue
        files, used, cw = emit(im, name, widths, aspect)
        total += len(files)
        short = [str(w) for w in used]
        flag = "" if cw >= max(widths) else "  (source caps at " + str(cw) + "px)"
        print("  " + name.ljust(24) + " " + aspect.ljust(6) + " " + ",".join(short) + flag)
        manifest.append((name, src, caption, credit))

    for name, src in OG:
        try:
            im = load(src)
        except FileNotFoundError:
            print("  MISSING  " + name + "  <- " + src)
            continue
        files, _, _ = emit(im, name, [1200], "1200/630")
        total += len(files)
        print("  " + name.ljust(24) + " 1200x630")

    # The credit line the pages print. Written out so the HTML and this
    # script cannot drift: if a pick changes here, the caption follows it.
    p = os.path.join(REPO, "assets", "credits.json")
    with open(p, "w", encoding="utf-8") as f:
        f.write("{\n")
        rows = []
        for name, src, caption, credit in manifest:
            rows.append('  "%s": { "caption": %s, "credit": %s }'
                        % (name, jstr(caption), jstr(credit)))
        f.write(",\n".join(rows))
        f.write("\n}\n")

    print()
    print(str(total) + " files written, plus assets/credits.json")


def jstr(s):
    out = '"'
    for ch in s:
        if ch == '"':
            out += '\\"'
        elif ch == "\n":
            out += "\\n"
        else:
            out += ch
    out += '"'
    return out


if __name__ == "__main__":
    main()
