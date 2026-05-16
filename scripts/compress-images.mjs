import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "images");
const MAX_EDGE = 1920;
const JPEG_QUALITY = 82;
const AVATAR_MAX = 900;

const avatarNames = new Set(["证件照 蓝底.jpg"]);

function formatBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / (1024 * 1024)).toFixed(2) + " MB";
}

const files = fs.readdirSync(imagesDir).filter((f) => /\.(jpe?g|png)$/i.test(f));

let beforeTotal = 0;
let afterTotal = 0;

for (const file of files) {
  const inputPath = path.join(imagesDir, file);
  const before = fs.statSync(inputPath).size;
  beforeTotal += before;

  const ext = path.extname(file).toLowerCase();
  const maxEdge = avatarNames.has(file) ? AVATAR_MAX : MAX_EDGE;
  const tempPath = inputPath + ".compressing";

  let pipeline = sharp(inputPath).rotate();
  const meta = await pipeline.metadata();
  pipeline = pipeline.resize(maxEdge, maxEdge, {
    fit: "inside",
    withoutEnlargement: true,
  });

  const needsPng =
    ext === ".png" && (meta.hasAlpha || meta.channels === 4);

  if (needsPng) {
    await pipeline
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(tempPath);
  } else {
    await pipeline
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(tempPath);
    if (ext === ".png") {
      const jpgPath = inputPath.replace(/\.png$/i, ".jpg");
      fs.unlinkSync(inputPath);
      fs.renameSync(tempPath, jpgPath);
      console.log(
        `  ${file} -> ${path.basename(jpgPath)} (PNG 无透明通道，已转 JPG)`
      );
      afterTotal += fs.statSync(jpgPath).size;
      console.log(`    ${formatBytes(before)} -> ${formatBytes(fs.statSync(jpgPath).size)}`);
      continue;
    }
  }

  fs.unlinkSync(inputPath);
  fs.renameSync(tempPath, inputPath);
  const after = fs.statSync(inputPath).size;
  afterTotal += after;
  const pct = before ? Math.round((1 - after / before) * 100) : 0;
  console.log(`  ${file}: ${formatBytes(before)} -> ${formatBytes(after)} (-${pct}%)`);
}

console.log("\n合计:", formatBytes(beforeTotal), "->", formatBytes(afterTotal));
