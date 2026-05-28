import sys
from PIL import Image

def create_ico(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Windows requires standard sizes for the .ico file
        icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        img.save(output_path, format="ICO", sizes=icon_sizes)
        print("ICO created successfully.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_ico(
        "../frontend/public/desktop-icon.png",
        "../frontend/public/favicon.ico"
    )
