#!/usr/bin/env python3
"""
Create placeholder icons for Chrome extension.
Generates simple PNG icons with Solana green color (#14F195).
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("⚠️  PIL/Pillow not available. Trying alternative method...")

import os

def create_icon_with_pil(size, output_path):
    """Create icon using PIL/Pillow."""
    # Solana green color
    color = (20, 241, 149)  # #14F195 in RGB
    
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw filled circle
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=color,
        outline=None
    )
    
    # Add "G" text in center (for GR00T)
    try:
        # Try to use a font
        font_size = size // 2
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw "G" text
    text = "G"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2 - text_height // 4)
    draw.text(position, text, fill=(255, 255, 255, 255), font=font)
    
    img.save(output_path, 'PNG')
    print(f"✅ Created {output_path} ({size}x{size})")

def create_icon_with_sips(size, output_path):
    """Create icon using macOS sips command (fallback)."""
    import subprocess
    import tempfile
    
    # Create a temporary solid color image
    temp_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
    temp_file.close()
    
    try:
        # Use sips to create a solid color image
        # Create a 1x1 image first, then scale it
        subprocess.run([
            'sips', '-s', 'format', 'png',
            '-z', str(size), str(size),
            '--setProperty', 'formatOptions', 'normal',
            temp_file.name
        ], check=True, capture_output=True)
        
        # For now, just create an empty file - sips method is complex
        # Instead, we'll create a simple colored square using Python
        print(f"⚠️  sips method not fully implemented. Creating minimal icon...")
        return False
    except Exception as e:
        print(f"⚠️  sips failed: {e}")
        return False
    finally:
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def create_simple_svg_icon(size):
    """Create a simple SVG icon (Chrome can't use SVG directly, but we can convert)."""
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="{size//2}" cy="{size//2}" r="{size//2 - size//8}" fill="#14F195"/>
  <text x="{size//2}" y="{size//2 + size//8}" font-family="Arial" font-size="{size//2}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">G</text>
</svg>'''
    return svg_content

def main():
    """Create all required icon sizes."""
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)
    
    sizes = [16, 32, 48, 128]
    created = []
    
    if HAS_PIL:
        print("🎨 Creating icons with PIL/Pillow...")
        for size in sizes:
            output_path = os.path.join(icons_dir, f'icon{size}.png')
            try:
                create_icon_with_pil(size, output_path)
                created.append(output_path)
            except Exception as e:
                print(f"❌ Failed to create icon{size}.png: {e}")
    else:
        print("⚠️  PIL/Pillow not available. Installing...")
        print("   Run: pip install Pillow")
        print("   Or create icons manually using an image editor.")
        return
    
    if created:
        print(f"\n✅ Successfully created {len(created)} icon files!")
        print(f"   Icons location: {icons_dir}")
        print("\n📋 Next step: Reload the extension in Chrome")
    else:
        print("\n❌ Failed to create icons. Please create them manually.")

if __name__ == '__main__':
    main()
