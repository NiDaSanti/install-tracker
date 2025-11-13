/*
 * Utility script to generate simple PNG icons for the Solar Installation Tracker.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  const crcBuffer = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuffer, data]));
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 2; // Color type: truecolor
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdr = pngChunk('IHDR', ihdrData);

  const bytesPerLine = width * 3 + 1;
  const rawData = Buffer.alloc(bytesPerLine * height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * bytesPerLine;
    rawData[rowStart] = 0; // Filter type 0
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixelFn(x, y, width, height);
      const pixelIndex = rowStart + 1 + x * 3;
      rawData[pixelIndex] = r;
      rawData[pixelIndex + 1] = g;
      rawData[pixelIndex + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = pngChunk('IDAT', compressed);
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function sunAndPanelPixel(x, y, width, height) {
  const centerX = width / 2;
  const centerY = height * 0.32;
  const radius = height * 0.18;

  const panelTop = height * 0.45;
  const panelBottom = height * 0.85;
  const horizon = height * 0.52;

  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance <= radius) {
    const t = distance / radius;
    const r = Math.round(255 - t * 40);
    const g = Math.round(190 - t * 90);
    const b = Math.round(40 + t * 20);
    return [r, g, b];
  }

  if (y < horizon) {
    const skyFactor = y / horizon;
    const r = Math.round(10 + 30 * skyFactor);
    const g = Math.round(60 + 90 * skyFactor);
    const b = Math.round(110 + 145 * skyFactor);
    return [r, g, b];
  }

  if (y >= panelTop && y <= panelBottom) {
    const panelFactor = (y - panelTop) / (panelBottom - panelTop);
    const baseColor = 40 + 70 * panelFactor;
    const column = Math.floor((x / width) * 6);
    const highlight = column % 2 === 0 ? 18 : 0;
    return [Math.round(baseColor + highlight), Math.round(baseColor + 20 + highlight), Math.round(baseColor + 60 + highlight)];
  }

  const groundFactor = (y - horizon) / (height - horizon);
  const r = Math.round(20 + 60 * groundFactor);
  const g = Math.round(70 + 80 * groundFactor);
  const b = Math.round(40 + 50 * groundFactor);
  return [r, g, b];
}

function writeIcon(size, filename) {
  const buffer = createPng(size, size, sunAndPanelPixel);
  const outPath = path.join(__dirname, '..', 'public', filename);
  fs.writeFileSync(outPath, buffer);
  console.log(`Generated ${filename}`);
}

writeIcon(64, 'solar-favicon.png');
writeIcon(192, 'solar-icon-192.png');
writeIcon(512, 'solar-icon-512.png');
