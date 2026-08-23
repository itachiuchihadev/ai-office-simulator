"""
Extract individual pixel art sprites from PixelOfficeAssets.png sprite sheet.

Uses connected-component analysis (8-connectivity) to find every distinct sprite,
then saves each one as a separate PNG with transparent background.

Source: public/assets/PixelOfficeAssets.png (256x160, RGBA with transparent bg)
Output: public/assets/extracted_assets/<category>/<name>.png
"""

import os
import shutil
from PIL import Image
from collections import deque


def find_components(img):
    """Find all connected components of non-transparent pixels using 8-connectivity."""
    w, h = img.size
    visited = [[False] * w for _ in range(h)]
    pixels = img.load()

    def is_fg(x, y):
        return pixels[x, y][3] > 0

    components = []
    for y in range(h):
        for x in range(w):
            if is_fg(x, y) and not visited[y][x]:
                queue = deque([(x, y)])
                visited[y][x] = True
                min_x, min_y, max_x, max_y = x, y, x, y
                pixel_count = 0
                while queue:
                    cx, cy = queue.popleft()
                    pixel_count += 1
                    min_x = min(min_x, cx)
                    max_x = max(max_x, cx)
                    min_y = min(min_y, cy)
                    max_y = max(max_y, cy)
                    for dx in [-1, 0, 1]:
                        for dy in [-1, 0, 1]:
                            if dx == 0 and dy == 0:
                                continue
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < w and 0 <= ny < h and is_fg(nx, ny) and not visited[ny][nx]:
                                visited[ny][nx] = True
                                queue.append((nx, ny))
                components.append({
                    'bbox': (min_x, min_y, max_x + 1, max_y + 1),  # PIL crop format
                    'pixels': pixel_count,
                    'width': max_x - min_x + 1,
                    'height': max_y - min_y + 1,
                })
    # Sort top-to-bottom, left-to-right
    components.sort(key=lambda c: (c['bbox'][1], c['bbox'][0]))
    return components


# ──────────────────────────────────────────────
# Component-to-name mapping (based on visual inspection of each connected component)
# Index corresponds to sorted component order from find_components()
#
# Format: { index: (name, category) }
# Components 37, 39, 40 are tiny color dots and 58 is a tiny dot — grouped with neighbors
# ──────────────────────────────────────────────

COMPONENT_NAMES = {
    0:  ('sky_with_clouds',        'environment'),
    1:  ('chair_red',              'furniture'),
    2:  ('chair_orange',           'furniture'),
    3:  ('chair_green',            'furniture'),
    4:  ('chair_blue',             'furniture'),
    5:  ('chair_purple',           'furniture'),
    6:  ('chair_grey',             'furniture'),
    7:  ('desk_long_blue',         'furniture'),
    8:  ('table_small_orange',     'furniture'),
    9:  ('sofa_red',               'furniture'),
    10: ('door_panel_left',        'doors_and_windows'),
    11: ('door_frame_divider',     'doors_and_windows'),
    12: ('door_panel_right',       'doors_and_windows'),
    13: ('potted_plant',           'decor'),
    14: ('sofa_blue',              'furniture'),
    15: ('wall_partition_blue',    'walls'),
    16: ('wall_partition_white',   'walls'),
    17: ('wall_calendar',          'decor'),
    18: ('sofa_light_blue',        'furniture'),
    19: ('water_cooler',           'appliances'),
    20: ('flag_india',             'decor'),
    21: ('flag_uk',                'decor'),
    22: ('flag_usa',               'decor'),
    23: ('smartphone',             'electronics'),
    24: ('tablet',                 'electronics'),
    25: ('framed_art_sunset',      'decor'),
    26: ('coffee_mug',             'electronics'),
    27: ('window_double_blue',     'doors_and_windows'),
    28: ('window_with_notes',      'doors_and_windows'),
    29: ('sofa_green',             'furniture'),
    30: ('character_red_hair_girl','characters'),
    31: ('character_dark_hair_boy','characters'),
    32: ('water_dispenser',        'appliances'),
    33: ('character_glasses_boy',  'characters'),
    34: ('paper_stack_white',      'electronics'),
    35: ('paper_stack_red',        'electronics'),
    36: ('printer_scanner',        'electronics'),
    37: ('color_dot_yellow',       'electronics'),
    38: ('digital_clock',          'electronics'),
    39: ('color_dot_green',        'electronics'),
    40: ('color_dot_red',          'electronics'),
    41: ('id_card_red',            'electronics'),
    42: ('glass_door_tall',        'doors_and_windows'),
    43: ('sofa_orange',            'furniture'),
    44: ('vending_machine',        'appliances'),
    45: ('refrigerator_drinks',    'appliances'),
    46: ('coat_rack',              'decor'),
    47: ('cat_black',              'characters'),
    48: ('id_card_blue',           'electronics'),
    49: ('character_blue_shirt_girl', 'characters'),
    50: ('character_dark_hair_girl',  'characters'),
    51: ('building_tower',         'decor'),
    52: ('trash_bin_blue',         'appliances'),
    53: ('id_card_green',          'electronics'),
    54: ('trash_bin_green',        'appliances'),
    55: ('trash_bin_red',          'appliances'),
    56: ('trash_bin_purple',       'appliances'),
    57: ('dog_corgi',              'characters'),
    58: ('color_dot_small',        'electronics'),
    59: ('card_reader',            'electronics'),
}


def extract_all():
    src_path = 'public/assets/PixelOfficeAssets.png'
    img = Image.open(src_path).convert('RGBA')
    print(f"Loaded sprite sheet: {src_path} ({img.size[0]}x{img.size[1]})")

    # Clean up old extractions
    output_dirs = [
        'public/assets/extracted_assets',
    ]
    for d in output_dirs:
        if os.path.exists(d):
            shutil.rmtree(d)

    # Find all connected components
    components = find_components(img)
    print(f"Found {len(components)} connected components")

    extracted = []

    for idx, comp in enumerate(components):
        if idx not in COMPONENT_NAMES:
            print(f"  SKIP component {idx}: bbox={comp['bbox']} size={comp['width']}x{comp['height']} (unmapped)")
            continue

        name, category = COMPONENT_NAMES[idx]
        x1, y1, x2, y2 = comp['bbox']

        # Crop from the source image
        sprite = img.crop((x1, y1, x2, y2))

        # Save to categorized folder + flat "all" folder
        for base in output_dirs:
            cat_dir = os.path.join(base, category)
            all_dir = os.path.join(base, 'all')
            os.makedirs(cat_dir, exist_ok=True)
            os.makedirs(all_dir, exist_ok=True)

            sprite.save(os.path.join(cat_dir, f'{name}.png'))
            sprite.save(os.path.join(all_dir, f'{name}.png'))

        extracted.append({
            'name': name,
            'category': category,
            'width': comp['width'],
            'height': comp['height'],
            'path': f'{category}/{name}.png',
        })
        print(f"  OK [{category}] {name}.png ({comp['width']}x{comp['height']})")

    print(f"\n{'='*60}")
    print(f"Total extracted: {len(extracted)} sprites")
    print(f"Output: {output_dirs[0]}")

    # Generate HTML visual catalog
    for base in output_dirs:
        generate_catalog(base, extracted)

    return extracted


def generate_catalog(output_dir, items):
    """Generate an HTML visual catalog of all extracted sprites."""
    # Group by category
    categories = {}
    for item in items:
        cat = item['category']
        categories.setdefault(cat, []).append(item)

    cat_sections = ''
    for cat, cat_items in categories.items():
        cards = ''
        for item in cat_items:
            cards += f'''
            <div class="asset-card">
                <div class="img-container">
                    <img src="{item['path']}" alt="{item['name']}" loading="lazy">
                </div>
                <div class="asset-name">{item['name']}</div>
                <div class="asset-dim">{item['width']} × {item['height']} px</div>
            </div>'''

        cat_sections += f'''
    <section class="category-section">
        <h2 class="category-title">{cat.replace('_', ' ').title()}</h2>
        <div class="asset-grid">{cards}
        </div>
    </section>'''

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extracted Office Pixel Assets</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            padding: 32px;
        }}
        header {{
            margin-bottom: 40px;
            border-bottom: 1px solid #334155;
            padding-bottom: 20px;
        }}
        h1 {{ font-size: 2rem; color: #38bdf8; margin-bottom: 8px; }}
        header p {{ color: #94a3b8; }}
        .badge {{
            display: inline-block;
            background: #0284c7;
            color: white;
            padding: 4px 14px;
            border-radius: 16px;
            font-weight: 600;
            font-size: 0.875rem;
            margin-top: 10px;
        }}
        .category-section {{ margin-bottom: 48px; }}
        .category-title {{
            font-size: 1.25rem;
            color: #f43f5e;
            text-transform: capitalize;
            margin-bottom: 16px;
            border-left: 4px solid #f43f5e;
            padding-left: 12px;
        }}
        .asset-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
        }}
        .asset-card {{
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            transition: transform 0.2s, border-color 0.2s;
        }}
        .asset-card:hover {{
            transform: translateY(-3px);
            border-color: #38bdf8;
        }}
        .img-container {{
            width: 120px;
            height: 120px;
            background-image:
                linear-gradient(45deg, #334155 25%, transparent 25%),
                linear-gradient(-45deg, #334155 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #334155 75%),
                linear-gradient(-45deg, transparent 75%, #334155 75%);
            background-size: 16px 16px;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0;
            background-color: #0f172a;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 12px;
            border: 1px solid #475569;
        }}
        .img-container img {{
            image-rendering: pixelated;
            max-width: 100px;
            max-height: 100px;
            object-fit: contain;
        }}
        .asset-name {{
            font-size: 0.85rem;
            font-weight: 600;
            color: #e2e8f0;
            text-align: center;
            word-break: break-word;
            margin-bottom: 4px;
        }}
        .asset-dim {{
            font-size: 0.75rem;
            color: #38bdf8;
        }}
    </style>
</head>
<body>
    <header>
        <h1>Extracted Office Pixel Assets</h1>
        <p>Individual sprites cut from PixelOfficeAssets.png with transparent backgrounds</p>
        <div class="badge">Total: {len(items)} sprites</div>
    </header>
    {cat_sections}
</body>
</html>'''

    path = os.path.join(output_dir, 'index.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Generated catalog: {path}")


if __name__ == '__main__':
    extract_all()
