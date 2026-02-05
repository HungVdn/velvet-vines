from PIL import Image

def remove_black_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Check if the pixel is close to black
        # You can adjust the threshold (30) if needed
        if item[0] < 30 and item[1] < 30 and item[2] < 30:
            newData.append((255, 255, 255, 0)) # Fully transparent
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent image to {output_path}")

if __name__ == "__main__":
    remove_black_background("src/assets/logo_ouroboros.png", "src/assets/logo_ouroboros.png")
