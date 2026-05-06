from PIL import Image, ImageDraw, ImageFont
import os

def make_icon(size, path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background circle - WhatsApp green
    margin = size * 0.06
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size * 0.22,
        fill=(18, 140, 126, 255)
    )

    # White clipboard icon
    cx = size // 2
    pad = size * 0.22
    w = size - pad * 2
    h = w * 1.1

    # Clipboard body
    board_x0 = cx - w * 0.42
    board_y0 = size * 0.28
    board_x1 = cx + w * 0.42
    board_y1 = size * 0.82
    draw.rounded_rectangle([board_x0, board_y0, board_x1, board_y1],
                            radius=size * 0.06, fill=(255, 255, 255, 255))

    # Clip at top
    clip_w = w * 0.35
    clip_h = size * 0.12
    draw.rounded_rectangle([cx - clip_w/2, size*0.20, cx + clip_w/2, size*0.32],
                            radius=size*0.04, fill=(18, 140, 126, 255))

    # Lines on clipboard (green)
    line_color = (18, 140, 126, 230)
    lx0 = cx - w * 0.28
    lx1 = cx + w * 0.28
    for i, y_ratio in enumerate([0.43, 0.52, 0.61, 0.70]):
        y = size * y_ratio
        lw = max(1, size // 24)
        if i == 3:
            lx1 = cx  # shorter last line
        draw.rounded_rectangle([lx0, y - lw//2, lx1, y + lw//2], radius=lw, fill=line_color)

    img.save(path, 'PNG')
    print(f'Created {path} ({size}x{size})')

os.makedirs('/home/claude/whatsapp-extractor/icons', exist_ok=True)
for sz in [16, 48, 128]:
    make_icon(sz, f'/home/claude/whatsapp-extractor/icons/icon{sz}.png')
print('Icons done!')