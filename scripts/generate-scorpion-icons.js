// scripts/generate-scorpion-icons.js
// Generates electric-blue cybernetic Scorpion icons and SVG for Underweb.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create an SVG vector scorpion emblem with clean cybernetic / anatomical lines
const scorpionSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- Cybernetic Grid / Target Ring -->
  <circle cx="50" cy="50" r="46" stroke="#0038ff" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6"/>
  <circle cx="50" cy="50" r="41" stroke="#ffffff" stroke-width="0.8" opacity="0.2"/>
  
  <!-- Scorpion Tail (Arched Stinger) -->
  <path d="M50 48 C 50 36, 42 22, 54 14 C 64 6, 76 12, 74 24 C 72 32, 60 30, 62 21 C 63 17, 60 14, 56 16 C 53 18, 51 24, 56 34 C 59 40, 56 46, 50 48 Z" fill="#0051ff" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
  
  <!-- Stinger Venom Tip -->
  <path d="M60 21 L 53 18 L 57 23 Z" fill="#00f0ff" stroke="#ffffff" stroke-width="0.8"/>
  <circle cx="53" cy="18" r="1.5" fill="#00f0ff"/>

  <!-- Exoskeleton Body Carapace (Segmented Plates) -->
  <!-- Segment 1: Head / Rostrum -->
  <polygon points="50,44 43,51 57,51" fill="#0038ff" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Segment 2: Mesosoma (Upper Thorax) -->
  <polygon points="41,52 59,52 57,60 43,60" fill="#0228bb" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Segment 3: Mesosoma (Mid Thorax) -->
  <polygon points="42,61 58,61 56,69 44,69" fill="#0038ff" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Segment 4: Posterior Segment -->
  <polygon points="45,70 55,70 53,77 47,77" fill="#0228bb" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Segment 5: Metasoma Base -->
  <polygon points="47,78 53,78 52,83 48,83" fill="#0038ff" stroke="#ffffff" stroke-width="1"/>

  <!-- Left Pedipalp & Chela (Pincer / Claw) -->
  <path d="M43 49 C 32 46, 24 38, 22 28 C 21 24, 25 21, 28 23 C 31 25, 30 31, 35 34 C 38 36, 42 45, 43 49 Z" fill="#0228bb" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Left Pincer Claw Grasp -->
  <path d="M22 28 C 17 25, 14 18, 18 13 C 21 17, 24 20, 26 23" stroke="#00f0ff" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M28 23 C 28 17, 24 13, 20 12" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Right Pedipalp & Chela (Pincer / Claw) -->
  <path d="M57 49 C 68 46, 76 38, 78 28 C 79 24, 75 21, 72 23 C 69 25, 70 31, 65 34 C 62 36, 58 45, 57 49 Z" fill="#0228bb" stroke="#ffffff" stroke-width="1.2"/>
  <!-- Right Pincer Claw Grasp -->
  <path d="M78 28 C 83 25, 86 18, 82 13 C 79 17, 76 20, 74 23" stroke="#00f0ff" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M72 23 C 72 17, 76 13, 80 12" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Left Walking Legs (4 articulated cybernetic legs) -->
  <path d="M42 54 L 30 52 L 20 59" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M42 61 L 28 62 L 18 70" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M43 67 L 30 71 L 22 81" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M45 74 L 34 81 L 28 92" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Right Walking Legs (4 articulated cybernetic legs) -->
  <path d="M58 54 L 70 52 L 80 59" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M58 61 L 72 62 L 82 70" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M57 67 L 70 71 L 78 81" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
  <path d="M55 74 L 66 81 L 72 92" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Ocelli / Cybernetic Central Eyes -->
  <circle cx="48" cy="48" r="1.2" fill="#00f0ff"/>
  <circle cx="52" cy="48" r="1.2" fill="#00f0ff"/>
</svg>`;

const brandingDir = path.join(__dirname, '..', 'assets', 'branding');
fs.mkdirSync(brandingDir, { recursive: true });
fs.writeFileSync(path.join(brandingDir, 'scorpion.svg'), scorpionSvg);
console.log('Saved assets/branding/scorpion.svg');

// PNG Generation
function createScorpionPng(size) {
  const width = size;
  const height = size;
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const r = size * 0.46;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: none

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = (x - cx) / r;
      const dy = (y - cy) / r;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 1.0) {
        // Cobalt Blue backdrop (#0022ee to #001288)
        const isBorder = (dist >= 0.88);
        const isCoreBody = (Math.abs(dx) <= 0.22 && dy >= -0.15 && dy <= 0.55);
        const isPincers = (Math.abs(dx) >= 0.35 && Math.abs(dx) <= 0.75 && dy <= -0.1 && dy >= -0.65);
        const isTail = (dx >= -0.15 && dx <= 0.55 && dy >= -0.85 && dy <= -0.15 && Math.abs(Math.sqrt((dx - 0.2)*(dx - 0.2) + (dy + 0.4)*(dy + 0.4)) - 0.35) < 0.14);
        const isVenomTip = (Math.sqrt((dx - 0.1)*(dx - 0.1) + (dy + 0.65)*(dy + 0.65)) <= 0.12);

        if (isVenomTip) {
          // Electric Cyan Stinger Tip
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 240;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else if (isCoreBody || isPincers || isTail) {
          // Sharp White & Electric Blue Highlights
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
        } else if (isBorder) {
          // High contrast white ring
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 220;
        } else {
          // Saturated Cobalt Blue field #0026e6
          rawData[pxOffset] = 0;
          rawData[pxOffset + 1] = 38;
          rawData[pxOffset + 2] = 230;
          rawData[pxOffset + 3] = 255;
        }
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
[16, 32, 48, 128].forEach(size => {
  const buf = createScorpionPng(size);
  const file = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(file, buf);
  console.log(`Generated scorpion icon${size}.png`);
});
