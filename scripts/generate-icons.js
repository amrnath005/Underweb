// scripts/generate-icons.js
// Generates valid PNG icons for Underweb without third-party dependencies using Node's zlib.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(size) {
  const width = size;
  const height = size;

  // Raw pixel data: each scanline starts with filter byte 0, then width * 4 bytes (RGBA)
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const radius = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background rounded shield or circle: dark slate #0b0f19
      if (dist <= radius) {
        // Futuristic radar / "U" monogram / grid motif
        const normalizedX = (x - cx) / radius;
        const normalizedY = (y - cy) / radius;

        // Draw an elegant "U" / node icon
        const inU = (
          (Math.abs(normalizedX) <= 0.55 && normalizedY >= -0.4 && normalizedY <= 0.35 && (Math.abs(normalizedX) >= 0.28 || normalizedY >= 0.15)) ||
          (Math.abs(normalizedX) <= 0.4 && Math.abs(normalizedY) <= 0.08) // crossbar / data bridge
        );

        const isOuterRing = (dist >= radius - Math.max(1, size * 0.08));

        if (inU) {
          // Bright cyan / emerald gradient
          rawData[pxOffset] = 0;     // R
          rawData[pxOffset + 1] = 230; // G
          rawData[pxOffset + 2] = 200; // B
          rawData[pxOffset + 3] = 255; // A
        } else if (isOuterRing) {
          // Neon border
          rawData[pxOffset] = 16;
          rawData[pxOffset + 1] = 185;
          rawData[pxOffset + 2] = 129;
          rawData[pxOffset + 3] = 255;
        } else {
          // Tech dark slate background
          rawData[pxOffset] = 13;
          rawData[pxOffset + 1] = 18;
          rawData[pxOffset + 2] = 28;
          rawData[pxOffset + 3] = 245;
        }
      } else {
        // Transparent outside
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // Compress with deflate
  const compressed = zlib.deflateSync(rawData);

  // PNG structure
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);

    // CRC32 calculation
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// Simple CRC32 table & function
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

const outDir = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(outDir, { recursive: true });

[16, 32, 48, 128].forEach(size => {
  const buf = createPng(size);
  const file = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(file, buf);
  console.log(`Generated ${file} (${buf.length} bytes)`);
});
