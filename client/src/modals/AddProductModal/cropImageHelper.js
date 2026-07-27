// modals/AddProductModal/cropImageHelper.js

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

// ✨ NEW: Calculates the exact dimensions of the image after it rotates
const getBoundingBox = (width, height, rotation) => {
  const rad = getRadianAngle(rotation);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
};

export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // 1. Get the bounding box of the rotated image
  const boundingBox = getBoundingBox(image.width, image.height, rotation);

  // 2. Set canvas size to match the bounding box
  canvas.width = boundingBox.width;
  canvas.height = boundingBox.height;

  // 3. Translate canvas context to a central location to allow rotating around the center
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(getRadianAngle(rotation));
  ctx.translate(-image.width / 2, -image.height / 2);

  // 4. Draw the rotated image
  ctx.drawImage(image, 0, 0);

  // 5. Extract the cropped image using the exact pixel coordinates
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // 6. Set canvas width to final desired crop size (this automatically clears the canvas)
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // 7. Paste the generated rotated image at the top left corner
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        file.name = 'cropped.jpeg';
        resolve(file);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.95); // 0.95 keeps the quality high while saving memory
  });
};