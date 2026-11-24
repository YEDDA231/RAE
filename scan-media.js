/**
 * Finds real image, video, and audio files and writes media.js.
 * Run with: node scan-media.js
 * serve.js also runs this whenever the site starts.
 */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp']);
const videoExts = new Set(['.mp4', '.webm', '.mov', '.ogg', '.ogv', '.m4v']);
const audioExts = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac']);
const videoTypes = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/mp4',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.m4v': 'video/mp4'
};
const skipNames = new Set(['thumbs.db', 'desktop.ini', '.ds_store']);

const imageCaptions = {
  'Picture/SCRL_0098.jpg': {
    caption: 'Photo booth energy',
    alt: 'Collage of mirror selfies in a burgundy dress'
  },
  'Picture/discord-temp-DFDEE529-BE60-4E5C-BE7A-789E3BEA2CC2.jpg': {
    caption: 'Salon day',
    alt: 'Mirror selfie at a hair salon'
  },
  'Picture/discord-temp-A8E01966-5BA8-4782-B08D-30D859C385F8.jpg': {
    caption: 'Just hanging out',
    alt: 'Mirror selfie in a black t-shirt'
  },
  'Picture/discord-temp-115B4C1A-15AF-4182-B3AD-4CD5E0AC9737.jpg': {
    caption: 'A sunny walk',
    alt: 'Kids in winter coats walking along a sunny sidewalk'
  }
};

const preferredImages = [
  'Picture/SCRL_0098.jpg',
  'Picture/discord-temp-DFDEE529-BE60-4E5C-BE7A-789E3BEA2CC2.jpg',
  'Picture/discord-temp-A8E01966-5BA8-4782-B08D-30D859C385F8.jpg',
  'Picture/discord-temp-115B4C1A-15AF-4182-B3AD-4CD5E0AC9737.jpg'
];

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') || skipNames.has(name.toLowerCase())) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (stat.isFile()) acc.push(full);
  }
  return acc;
}

function rel(full) {
  return path.relative(root, full).split(path.sep).join('/');
}

function collect(dirs, exts) {
  const found = [];
  for (const dir of dirs) {
    for (const full of walk(path.join(root, dir), [])) {
      const ext = path.extname(full).toLowerCase();
      if (exts.has(ext)) found.push({ src: rel(full), ext });
    }
  }
  return found;
}

const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'udta']);

function patchQuickTime(buf) {
  function walk(start, end) {
    let offset = start;
    while (offset + 8 <= end) {
      let size = buf.readUInt32BE(offset);
      let header = 8;
      if (size === 1) {
        if (offset + 16 > end) break;
        size = Number(buf.readBigUInt64BE(offset + 8));
        header = 16;
      }
      if (size < header || offset + size > end) break;
      const type = buf.toString('latin1', offset + 4, offset + 8);
      if (type === 'ftyp') {
        if (buf.toString('latin1', offset + 8, offset + 12) === 'qt  ') {
          buf.write('isom', offset + 8, 4, 'latin1');
        }
        for (let i = offset + 16; i + 4 <= offset + size; i += 4) {
          if (buf.toString('latin1', i, i + 4) === 'qt  ') buf.write('mp41', i, 4, 'latin1');
        }
      } else if (type === 'hdlr' && size >= header + 12) {
        const handlerAt = offset + header + 8;
        if (buf.toString('latin1', handlerAt, handlerAt + 4) === 'alis') {
          buf.write('url ', handlerAt, 4, 'latin1');
        }
      } else if (type === 'dref') {
        let cursor = offset + header + 8;
        while (cursor + 8 <= offset + size) {
          const entrySize = buf.readUInt32BE(cursor);
          if (entrySize < 8 || cursor + entrySize > offset + size) break;
          if (buf.toString('latin1', cursor + 4, cursor + 8) === 'alis') {
            buf.write('url ', cursor + 4, 4, 'latin1');
          }
          cursor += entrySize;
        }
      } else if (containers.has(type)) {
        walk(offset + header, offset + size);
      }
      offset += size;
    }
  }
  walk(0, buf.length);
}

function prepareBrowserVideos() {
  const videosDir = path.join(root, 'RAE VIDS');
  if (!fs.existsSync(videosDir)) return;
  for (const name of fs.readdirSync(videosDir)) {
    if (path.extname(name).toLowerCase() !== '.mov') continue;
    const movPath = path.join(videosDir, name);
    const mp4Path = movPath.replace(/\.mov$/i, '.mp4');
    const source = fs.readFileSync(movPath);
    const patched = Buffer.from(source);
    patchQuickTime(patched);
    if (fs.existsSync(mp4Path) && fs.readFileSync(mp4Path).equals(patched)) continue;
    fs.writeFileSync(mp4Path, patched);
  }
}

function describeTrack(src) {
  const base = src.split('/').pop().replace(/\.[^.]+$/, '');
  if (/celebration/i.test(base)) {
    return { src, title: 'Celebration', artist: 'Kool & The Gang' };
  }
  return { src, title: base, artist: '' };
}

function scan() {
  const imageOrder = new Map(preferredImages.map((src, index) => [src, index]));
  const images = collect(['Picture', 'RAE VIDS'], imageExts)
    .sort((a, b) => {
      const ai = imageOrder.has(a.src) ? imageOrder.get(a.src) : 1000;
      const bi = imageOrder.has(b.src) ? imageOrder.get(b.src) : 1000;
      if (ai !== bi) return ai - bi;
      return a.src.localeCompare(b.src);
    })
    .map((item, index) => {
      const meta = imageCaptions[item.src] || {
        caption: `A little moment ${index + 1}`,
        alt: `Birthday photo ${index + 1}`
      };
      return { src: item.src, caption: meta.caption, alt: meta.alt };
    });

  prepareBrowserVideos();
  const gathered = collect(['RAE VIDS', 'Picture'], videoExts);
  const mp4Bases = new Set(
    gathered.filter((item) => item.ext === '.mp4').map((item) => item.src.replace(/\.mp4$/i, ''))
  );
  const videos = gathered
    .filter((item) => item.ext !== '.mov' || !mp4Bases.has(item.src.replace(/\.mov$/i, '')))
    .sort((a, b) => a.src.localeCompare(b.src))
    .map((item, index) => ({
      src: item.src,
      title: `Video ${index + 1}`,
      type: videoTypes[item.ext] || 'video/mp4'
    }));

  const music = collect(['Music'], audioExts)
    .sort((a, b) => a.src.localeCompare(b.src))
    .map((item) => describeTrack(item.src));

  const payload = { images, videos, music };
  const js = `/* Generated by scan-media.js. Refreshed when the site starts. */\nwindow.SITE_MEDIA = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(path.join(root, 'media.js'), js);
  return `Found ${images.length} photos, ${videos.length} videos, ${music.length} songs.`;
}

module.exports = scan;

if (require.main === module) {
  console.log(scan());
}
