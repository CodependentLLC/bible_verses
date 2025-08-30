// generate-mobile-icon.js
import sharp from "sharp";

await sharp("favicon.svg")
  .resize(1024, 1024) // App Store / Play Store master size
  .png({ background: "#ffffff" }) // solid background instead of transparent
  .toFile("icon-1024.png");

// also generate smaller common sizes
const sizes = [192, 512];
for (const size of sizes) {
  await sharp("favicon.svg")
    .resize(size, size)
    .png({ background: "#ffffff" })
    .toFile(`icon-${size}.png`);
}
