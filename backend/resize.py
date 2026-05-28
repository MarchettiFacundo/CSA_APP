import sys
from PIL import Image

def resize_icon(input_path, output_192, output_512):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # 192x192
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(output_192, "PNG")
        
        # 512x512
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(output_512, "PNG")
        
        print("Icons resized successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    resize_icon(
        "../frontend/public/desktop-icon.png",
        "../frontend/public/pwa-192x192.png",
        "../frontend/public/pwa-512x512.png"
    )
