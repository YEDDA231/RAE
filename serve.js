/**
 * Tiny local server for the birthday site.
 * Supports range requests so videos can be played and scrubbed.
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { pipeline } = require('stream');
const scan = require('./scan-media');

const PORT = Number(process.env.PORT) || 8080;
const root = path.resolve(__dirname);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/mp4',
  '.m4v': 'video/mp4',
  '.ogv': 'video/ogg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon'
};

function safePath(urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  let rel = decoded === '/' ? 'index.html' : decoded.replace(/^[/\\]+/, '');
  if (rel === 'favicon.ico') rel = 'favicon.svg';
  const file = path.resolve(root, rel);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (file !== root && !file.toLowerCase().startsWith(rootWithSep.toLowerCase())) return null;
  return file;
}

function send(req, res, file, stat) {
  const ext = path.extname(file).toLowerCase();
  const type = types[ext] || 'application/octet-stream';
  const cache = ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600';
  const range = req.headers.range;
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    const size = stat.size;
    let start = match && match[1] ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': cache,
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    pipeline(fs.createReadStream(file, { start, end }), res, () => {});
    return;
  }
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Cache-Control': cache,
    'X-Content-Type-Options': 'nosniff'
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  pipeline(fs.createReadStream(file), res, () => {});
}

try {
  console.log(scan());
} catch (err) {
  console.error('Could not scan media folders:', err.message);
}

const server = http.createServer((req, res) => {
  const file = safePath(req.url);
  if (!file) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    send(req, res, file, stat);
  });
});

let watchTimer;
function scheduleScan() {
  clearTimeout(watchTimer);
  watchTimer = setTimeout(() => {
    try {
      console.log(scan());
    } catch (err) {
      console.error(err.message);
    }
  }, 400);
}

for (const dir of ['Picture', 'RAE VIDS', 'Music']) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) continue;
  try {
    fs.watch(full, { persistent: true }, scheduleScan);
  } catch (err) {
    console.error('Could not watch', dir, err.message);
  }
}

server.listen(PORT, () => {
  console.log(`Birthday site ready: http://localhost:${PORT}`);
  console.log('Keep this window open. Press Ctrl+C to stop.');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other server, or run: set PORT=8081 && node serve.js`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});
