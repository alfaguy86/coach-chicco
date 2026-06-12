from PIL import Image, ImageDraw
import os

def make_icon(size, path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = int(size * 0.18)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=r, fill='#1D9E75')
    # Leaf shape
    cx, cy = size // 2, size // 2
    s = size * 0.28
    draw.ellipse([cx - s, cy - s*1.2, cx + s*0.3, cy + s*0.3], fill='#ffffff')
    draw.ellipse([cx - s*0.3, cy - s*0.3, cx + s, cy + s*1.2], fill='#E1F5EE')
    # Stem
    lw = max(2, size // 40)
    draw.line([cx - s*0.1, cy + s*0.5, cx - s*0.1, cy + s*1.1], fill='#ffffff', width=lw)
    img.save(path, 'PNG')
    print(f'  Created {path}')

os.makedirs('icons', exist_ok=True)
make_icon(192, 'icons/icon-192.png')
make_icon(512, 'icons/icon-512.png')
print('Icons generated!')
