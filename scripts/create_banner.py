from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

# Paths
base = "/Users/steveavon/Documents/Cluck/LockedInApp"
icon_path = os.path.join(base, "assets/images/icon.png")
screenshot_path = os.path.join(base, "screenshots/habits.png")
output_path = os.path.join(base, "screenshots/twitter-banner.png")

# 5:2 aspect ratio
WIDTH, HEIGHT = 2500, 1000

# Brand colors
BG_COLOR = (255, 245, 237)  # #FFF5ED
ORANGE = (255, 107, 0)      # #FF6B00
DARK_BROWN = (101, 67, 33)  # dark brown for text

# Create canvas
canvas = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(canvas)

# --- Load and place the app icon (left side) ---
icon = Image.open(icon_path).convert("RGBA")
icon_size = 420
icon = icon.resize((icon_size, icon_size), Image.LANCZOS)
icon_x = 120
icon_y = (HEIGHT - icon_size) // 2
# Paste icon with transparency
canvas.paste(icon, (icon_x, icon_y), icon)

# --- Add tagline text (center-left area) ---
try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 72)
    font_medium = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 38)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
except:
    font_large = ImageFont.load_default()
    font_medium = ImageFont.load_default()
    font_small = ImageFont.load_default()

text_x = icon_x + icon_size + 80
text_center_y = HEIGHT // 2

# Main tagline
line1 = "Build Better Morning"
line2 = "and Night Routines"
line3 = "One Habit at a Time"

# Draw text lines
draw.text((text_x, text_center_y - 160), line1, fill=DARK_BROWN, font=font_large)
draw.text((text_x, text_center_y - 70), line2, fill=DARK_BROWN, font=font_large)
draw.text((text_x, text_center_y + 40), line3, fill=ORANGE, font=font_medium)

# Subtitle
draw.text((text_x, text_center_y + 110), "Free on iOS", fill=(150, 120, 100), font=font_small)

# --- Load and place screenshot (right side, with phone frame effect) ---
screenshot = Image.open(screenshot_path).convert("RGBA")

# Scale screenshot to fit nicely
sc_height = int(HEIGHT * 0.85)
sc_width = int(sc_height * (screenshot.width / screenshot.height))
screenshot = screenshot.resize((sc_width, sc_height), Image.LANCZOS)

# Create rounded rectangle mask for screenshot
mask = Image.new("L", (sc_width, sc_height), 0)
mask_draw = ImageDraw.Draw(mask)
radius = 30
mask_draw.rounded_rectangle([(0, 0), (sc_width, sc_height)], radius=radius, fill=255)

# Apply rounded corners
rounded_screenshot = Image.new("RGBA", (sc_width, sc_height), (0, 0, 0, 0))
rounded_screenshot.paste(screenshot, (0, 0), mask)

# Add subtle shadow
shadow_offset = 8
shadow = Image.new("RGBA", (sc_width + 40, sc_height + 40), (0, 0, 0, 0))
shadow_draw = ImageDraw.Draw(shadow)
shadow_draw.rounded_rectangle(
    [(20 + shadow_offset, 20 + shadow_offset), (sc_width + 20 + shadow_offset, sc_height + 20 + shadow_offset)],
    radius=radius, fill=(0, 0, 0, 50)
)
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))

# Position screenshot on right side
sc_x = WIDTH - sc_width - 100
sc_y = (HEIGHT - sc_height) // 2

# Paste shadow then screenshot
canvas.paste(Image.new("RGB", (sc_width + 40, sc_height + 40), BG_COLOR),
             (sc_x - 20, sc_y - 20))
shadow_rgb = Image.new("RGB", shadow.size, BG_COLOR)
shadow_rgb.paste(shadow, mask=shadow.split()[3])
canvas.paste(shadow_rgb, (sc_x - 20, sc_y - 20))
canvas.paste(rounded_screenshot, (sc_x, sc_y), rounded_screenshot)

# --- Add subtle decorative accent bar at top ---
draw.rectangle([(0, 0), (WIDTH, 6)], fill=ORANGE)

# Save
canvas.save(output_path, "PNG", quality=95)
print(f"Banner saved to: {output_path}")
print(f"Dimensions: {WIDTH}x{HEIGHT} (5:2 ratio)")
