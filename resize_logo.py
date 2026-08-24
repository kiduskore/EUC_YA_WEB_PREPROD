from PIL import Image

img_path = 'static/euc_logo.jpg'
img = Image.open(img_path)

# Resize to 200x200
img.thumbnail((200, 200), Image.Resampling.LANCZOS)

# Save as optimized JPEG
img.save('static/euc_logo.jpg', format='JPEG', optimize=True, quality=85)
print("Resized successfully.")
