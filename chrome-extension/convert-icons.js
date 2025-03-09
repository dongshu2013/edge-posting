// This is a simple script to convert SVG icons to PNG for Chrome
// You can run it with Node.js if you have the 'sharp' package installed
// npm install sharp
// node convert-icons.js

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sizes = [16, 48, 128];

async function convertSvgToPng(size) {
  const svgPath = path.join(__dirname, 'images', `icon${size}.svg`);
  const pngPath = path.join(__dirname, 'images', `icon${size}.png`);
  
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(pngPath);
    
    console.log(`Converted icon${size}.svg to icon${size}.png`);
  } catch (error) {
    console.error(`Error converting icon${size}.svg:`, error);
  }
}

async function main() {
  console.log('Converting SVG icons to PNG...');
  
  for (const size of sizes) {
    await convertSvgToPng(size);
  }
  
  console.log('Conversion complete!');
}

main().catch(console.error);

// Note: If you don't have Node.js or the 'sharp' package,
// you can also use online tools to convert SVG to PNG,
// or use a graphics editor like Inkscape, GIMP, or Photoshop. 