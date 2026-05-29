const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function findImages(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await findImages(full)));
    } else if (EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

async function run() {
  const images = await findImages(PUBLIC_DIR);
  if (images.length === 0) {
    console.log('No PNG/JPG images found in public/');
    return;
  }

  let totalOriginal = 0;
  let totalWebp = 0;
  let skipped = 0;

  for (const imgPath of images) {
    const webpPath = imgPath.replace(/\.(png|jpe?g)$/i, '.webp');
    const imgStat = fs.statSync(imgPath);

    if (fs.existsSync(webpPath)) {
      const webpStat = fs.statSync(webpPath);
      if (webpStat.mtimeMs >= imgStat.mtimeMs) {
        skipped++;
        continue;
      }
    }

    const originalSize = imgStat.size;
    await sharp(imgPath).webp({ quality: 80 }).toFile(webpPath);
    const webpSize = fs.statSync(webpPath).size;

    totalOriginal += originalSize;
    totalWebp += webpSize;

    const saving = ((1 - webpSize / originalSize) * 100).toFixed(1);
    const rel = path.relative(PUBLIC_DIR, imgPath);
    console.log(`  ${rel}: ${(originalSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB (${saving}% saved)`);
  }

  console.log('');
  if (skipped > 0) console.log(`Skipped ${skipped} already up-to-date.`);
  if (totalOriginal > 0) {
    const totalSaving = ((1 - totalWebp / totalOriginal) * 100).toFixed(1);
    console.log(`Total: ${(totalOriginal / 1024).toFixed(0)}KB → ${(totalWebp / 1024).toFixed(0)}KB (${totalSaving}% saved)`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
