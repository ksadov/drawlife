from PIL import Image
import numpy as np

iconHeight = 7
iconWidth = 7

def makeIcon(f, name):
    arr = np.full((iconHeight, iconWidth, 3), 255, dtype=np.uint8)
    for x in range(iconHeight):
        for y in range(iconWidth):
            arr[x][y] = f(x, y)
    (Image.fromarray(arr, "RGB")).save(name, "PNG")


makeIcon(lambda x, y: [0, 0, 0],
         "texture0.png")

makeIcon(lambda x, y: [0, 0, 0] if ((x+y)%2 == 0)
         else [255, 255, 255],
         "texture1.png")

makeIcon(lambda x, y: [0, 0, 0] if (y%2 == 0)
         else [255, 255, 255],
         "texture2.png")

makeIcon(lambda x, y: [0, 0, 0] if ((x-y)%4 == 0)
         else [255, 255, 255],
         "texture3.png")

makeIcon(lambda x, y: [0, 0, 0] if ((x-y)%4 == 0 and (x+y)%4 == 0)
         else [255, 255, 255],
         "texture4.png")

makeIcon(lambda x, y: [0, 0, 0] if ((x - y)%4 == 0  or (x + y)%4 == 0)
         else [255, 255, 255],
         "texture5.png")

makeIcon(lambda x, y: [0, 0, 0] if ((y%2 == 0 and x%4 == 0) or
                                    (x+2) % 4 == 0 and y%2 != 0)
         else [255, 255, 255],
         "texture6.png")

makeIcon(lambda x, y: [0, 0, 0] if (x%2 == 0)
         else [255, 255, 255],
         "texture7.png")

makeIcon(lambda x, y: [0, 0, 0] if ((x - y) % 4 == 0 or (x - y + 1) % 4 == 0)
         else [255, 255, 255],
         "texture8.png")
