# Happy Birthday, CY RAE

A small birthday surprise you can open in a browser. The song starts when the page opens (browsers sometimes wait for the first tap). Photos come from the `Picture` folder. Videos come from `RAE VIDS`. Music comes from `Music`.

The tone is a friend-from-Discord surprise: playful, warm, and not a love letter.

## Run it on this computer

1. Keep `Music`, `Picture`, and `RAE VIDS` next to `index.html`.
2. Double-click `start-site.bat`.
3. Leave the black window open, then go to [http://localhost:8080](http://localhost:8080).

Or, in this folder:

```bash
node serve.js
```

Then open [http://localhost:8080](http://localhost:8080).

Type any age on the first screen and press **Let's Go!** to walk through it yourself before you show her.

Opening `index.html` by double-click can work, but Chrome and Edge often block the song and the videos on a `file://` page. The local server is the reliable way.

If port 8080 is already taken:

```bash
set PORT=8081
node serve.js
```

Python also works if Node is not installed:

```bash
python -m http.server 8080
```

Run `node scan-media.js` first if you use Python, so `media.js` lists the current files. `node serve.js` does that scan for you.

## Add more photos, videos, or songs

Drop files into the folders, then restart the server.

- Photos: `Picture` or `RAE VIDS` — jpg, jpeg, png, gif, webp, avif, bmp
- Videos: `RAE VIDS` or `Picture` — mp4, webm, mov, m4v, ogg
- Music: `Music` — mp3, wav, ogg, m4a, aac

Nothing is renamed or edited. The gallery uses the real filenames. One `.mov` clip may stay silent in Chrome; Edge or Safari can play it, and the file is still the original.

The first song found is the soundtrack. If you add more than one, they play in order and then loop.

## Put it on GitHub

The live site does not use `serve.js`. GitHub just hosts the files, and a workflow publishes them when you push.

Push the whole folder. These have to be in the repository, not only the code:

- `index.html`, `styles.css`, `app.js`, `effects.js`, `media.js`
- `fonts`
- `Picture`
- `RAE VIDS`
- `Music`

One-time setup:

1. Create a GitHub repository and push this folder to `main` (or `master`).
2. Open the repository **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.

Every push after that runs `.github/workflows/pages.yml`. When the action is green, the site URL is on that run and under **Settings → Pages**. It will look like `https://YOUR-NAME.github.io/YOUR-REPO/`.

Paths stay relative, so the same files work in a project site. `.nojekyll` is included so GitHub does not run Jekyll. Jekyll would skip the song, because its filename contains brackets.

Other hosts also work if you upload the same folder with no build step: [Netlify Drop](https://app.netlify.com/drop), Cloudflare Pages, or Vercel (framework **Other**, output directory `.`).

These photos and videos will be public to anyone with the link. Share it only if you are comfortable with that, or just open it on your screen and hand her the laptop.

The page already asks search engines not to index it (`noindex`). That is a request, not a lock.

## What she does

1. The welcome asks her age, then opens the surprise.
2. The intro plays the birthday line.
3. She blows out candles one by one, or hits **Make a Wish!**
4. Polaroids open into a viewer with arrows, swipe, and Escape to close.
5. Each video has play and pause. Starting one turns the song down until the clip stops.
6. The note types itself. **Read it again** replays it.
7. The last screen fires another round of fireworks. **One more round** repeats it.

Press **M** to pause or play the music, unless she is typing in the age box.
