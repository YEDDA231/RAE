(function () {
  const media = window.SITE_MEDIA || { images: [], videos: [], music: [] };
  const reduceMotion = window.BirthdayEffects.reduceMotion;
  const fx = window.BirthdayEffects.createFX(document.getElementById('fx'));
  window.BirthdayEffects.createSky(document.getElementById('sky'));

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function mediaUrl(src) {
    return String(src || '').split('/').map((part) => encodeURIComponent(part)).join('/');
  }

  const musicBtn = $('#music-btn');
  const audio = new Audio();
  const tracks = media.music || [];
  let trackIndex = 0;
  let loadedSrc = '';
  let wantMusic = false;
  let userPaused = false;
  let ducked = false;
  let volumeToken = 0;
  audio.preload = 'auto';
  audio.volume = 0;
  audio.loop = tracks.length <= 1;

  function currentTrack() {
    return tracks[trackIndex] || null;
  }

  function updateMusicUi() {
    if (!tracks.length) return;
    const track = currentTrack();
    const title = track.artist ? `${track.title} by ${track.artist}` : track.title;
    const playing = wantMusic && !audio.paused;
    musicBtn.classList.toggle('is-on', playing);
    musicBtn.setAttribute('aria-label', playing ? `Pause ${title}` : `Play ${title}`);
    musicBtn.title = title;
  }

  function rampVolume() {
    const token = ++volumeToken;
    const step = () => {
      if (token !== volumeToken) return;
      const desired = !wantMusic ? 0 : (ducked ? 0.1 : 0.42);
      if (Math.abs(desired - audio.volume) < 0.03) {
        audio.volume = desired;
        if (!wantMusic) audio.pause();
        updateMusicUi();
        return;
      }
      audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(desired - audio.volume) * 0.03));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function loadTrack(track) {
    if (!track || loadedSrc === track.src) return;
    loadedSrc = track.src;
    audio.src = mediaUrl(track.src);
  }

  function ensureMusic() {
    const track = currentTrack();
    if (!track || userPaused) return;
    loadTrack(track);
    wantMusic = true;
    audio.play().then(() => {
      rampVolume();
      updateMusicUi();
    }).catch(() => {
      updateMusicUi();
    });
  }

  function toggleMusic() {
    const track = currentTrack();
    if (!track) return;
    loadTrack(track);
    if (audio.paused || !wantMusic) {
      userPaused = false;
      wantMusic = true;
      audio.play().then(() => {
        rampVolume();
        updateMusicUi();
      }).catch(() => updateMusicUi());
    } else {
      userPaused = true;
      wantMusic = false;
      rampVolume();
      updateMusicUi();
    }
  }

  if (!tracks.length) {
    musicBtn.hidden = true;
  } else {
    musicBtn.addEventListener('click', toggleMusic);
    audio.addEventListener('ended', () => {
      if (tracks.length < 2) return;
      trackIndex = (trackIndex + 1) % tracks.length;
      loadedSrc = '';
      loadTrack(tracks[trackIndex]);
      if (wantMusic) audio.play().catch(() => {});
      updateMusicUi();
    });
    ensureMusic();
    document.addEventListener('pointerdown', (event) => {
      if (event.target.closest('#music-btn')) return;
      if (!userPaused) ensureMusic();
    }, { once: true });
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() !== 'm') return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      toggleMusic();
    });
  }

  function setDuck() {
    ducked = $$('video').some((video) => !video.paused && !video.ended);
    if (wantMusic) rampVolume();
  }

  const floaters = $('#floaters');
  if (!reduceMotion) {
    const sparkCount = window.innerWidth < 700 ? 12 : 20;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('span');
      spark.className = 'spark';
      spark.textContent = i % 3 === 0 ? '✦' : '✧';
      spark.style.left = `${Math.random() * 100}%`;
      spark.style.top = `${Math.random() * 100}%`;
      spark.style.animationDelay = `${Math.random() * 6}s`;
      spark.style.fontSize = `${8 + Math.random() * 11}px`;
      spark.style.color = Math.random() < 0.5 ? '#fff6d8' : '#f0d4ff';
      floaters.appendChild(spark);
    }
    const heartCount = window.innerWidth < 700 ? 3 : 5;
    for (let i = 0; i < heartCount; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart-float';
      heart.textContent = '♡';
      heart.style.left = `${8 + Math.random() * 84}%`;
      heart.style.animationDelay = `${Math.random() * 14}s`;
      heart.style.animationDuration = `${16 + Math.random() * 12}s`;
      heart.style.fontSize = `${12 + Math.random() * 10}px`;
      floaters.appendChild(heart);
    }
  }

  function startAmbientConfetti() {
    if (reduceMotion || floaters.querySelector('.confetti-bit')) return;
    const palette = ['#ff8ec8', '#e6d4ff', '#ffd56a', '#ffffff', '#b388ff', '#8ecbff'];
    const count = window.innerWidth < 700 ? 10 : 16;
    for (let i = 0; i < count; i++) {
      const bit = document.createElement('span');
      bit.className = 'confetti-bit';
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.animationDuration = `${7 + Math.random() * 8}s`;
      bit.style.animationDelay = `${Math.random() * 8}s`;
      bit.style.opacity = String(0.35 + Math.random() * 0.35);
      if (i % 8 === 0) {
        bit.textContent = '♡';
        bit.style.color = '#ffb7d6';
        bit.style.fontSize = '12px';
      } else {
        bit.style.width = `${6 + Math.random() * 6}px`;
        bit.style.height = `${8 + Math.random() * 8}px`;
        bit.style.background = palette[i % palette.length];
        bit.style.borderRadius = Math.random() < 0.4 ? '50%' : '2px';
      }
      floaters.appendChild(bit);
    }
  }

  const titleWords = $('#title-words');
  if (titleWords) {
    const text = titleWords.textContent.replace('🎂', '').trim();
    titleWords.textContent = '';
    let index = 0;
    text.split(' ').forEach((word) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      for (const ch of word) {
        const letter = document.createElement('span');
        letter.className = 'letter';
        letter.style.setProperty('--i', String(index++));
        letter.textContent = ch;
        wordEl.appendChild(letter);
      }
      titleWords.appendChild(wordEl);
    });
    const emoji = document.createElement('span');
    emoji.className = 'cake-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.style.setProperty('--i', String(index));
    emoji.textContent = '🎂';
    titleWords.appendChild(emoji);
  }

  function buildCandles(container, interactive) {
    for (let i = 1; i <= 7; i++) {
      const candle = document.createElement(interactive ? 'button' : 'div');
      candle.className = 'candle';
      if (interactive) {
        candle.type = 'button';
        candle.dataset.lit = 'true';
        candle.setAttribute('aria-label', `Blow out candle ${i}`);
      }
      const flame = document.createElement('span');
      flame.className = 'flame';
      const core = document.createElement('span');
      core.className = 'flame-core';
      flame.appendChild(core);
      const wick = document.createElement('span');
      wick.className = 'wick';
      candle.append(flame, wick);
      container.appendChild(candle);
    }
  }

  const candleBox = $('#candles');
  const finaleCandles = $('#finale-candles');
  if (candleBox) buildCandles(candleBox, true);
  if (finaleCandles) buildCandles(finaleCandles, false);

  const candles = candleBox ? $$('.candle', candleBox) : [];
  const cake = $('#main-cake');
  const wishBtn = $('#wish-btn');
  const wishLine = $('#wish-line');
  const wishNotes = [
    'Wish secured. Go enjoy your day.',
    'Candles out. Birthday mode: on.',
    'That was a solid blow. Nice.',
    'Alright, that wish is locked in.'
  ];
  let celebrated = false;
  let showOrbit = function () {};
  let hideOrbit = function () {};

  function allOut() {
    return candles.length > 0 && candles.every((candle) => candle.dataset.lit === 'false');
  }

  function celebrateCake() {
    if (celebrated) return;
    celebrated = true;
    cake.classList.add('all-out');
    wishLine.textContent = wishNotes[Math.floor(Math.random() * wishNotes.length)];
    wishBtn.textContent = 'Light them again';
    fx.celebrate();
    showOrbit();
  }

  function blow(candle, quiet) {
    if (!candle || candle.dataset.lit === 'false') return;
    candle.dataset.lit = 'false';
    candle.classList.add('is-out');
    candle.setAttribute('aria-label', 'Candle is out');
    if (!quiet) {
      const rect = candle.getBoundingClientRect();
      fx.sparkleBurst(rect.left + rect.width / 2, rect.top);
    }
    if (allOut()) setTimeout(celebrateCake, quiet ? 280 : 160);
  }

  function relight() {
    celebrated = false;
    cake.classList.remove('all-out');
    candles.forEach((candle, index) => {
      candle.dataset.lit = 'true';
      candle.classList.remove('is-out');
      candle.setAttribute('aria-label', `Blow out candle ${index + 1}`);
    });
    wishBtn.textContent = 'Make a Wish!';
    wishLine.textContent = '';
    hideOrbit();
  }

  candles.forEach((candle) => {
    candle.addEventListener('click', () => blow(candle, false));
  });

  if (wishBtn) {
    wishBtn.addEventListener('click', () => {
      if (allOut()) {
        relight();
        return;
      }
      candles.forEach((candle, index) => {
        setTimeout(() => blow(candle, true), index * 80);
      });
    });
  }

  const images = media.images || [];
  const orbit = $('#photo-orbit');
  const cakeStage = $('.cake-stage');
  const tilts = ['-7deg', '5deg', '-4deg', '6deg'];
  const orbitSlots = [];
  let orbitAngle = 0;
  let orbitRunning = false;
  let orbitPausing = false;
  let orbitRaf = 0;
  let orbitPauseTimer = 0;
  let orbitLastFront = -1;
  let orbitLastTs = 0;
  const ORBIT_SPEED = 0.55;
  const ORBIT_PAUSE_MS = 2000;
  const ORBIT_FRONT_SCALE = 1.42;

  if (orbit && images.length) {
    orbit.style.setProperty('--count', String(images.length));
    images.forEach((item, index) => {
      const slot = document.createElement('div');
      slot.className = 'orbit-slot';
      slot.style.setProperty('--i', String(index));
      slot.style.setProperty('--tilt', tilts[index % tilts.length]);
      const pop = document.createElement('div');
      pop.className = 'orbit-pop';
      const img = document.createElement('img');
      img.src = mediaUrl(item.src);
      img.alt = item.alt;
      img.decoding = 'async';
      pop.appendChild(img);
      slot.appendChild(pop);
      orbit.appendChild(slot);
      orbitSlots.push(slot);
    });
  }

  function orbitMetrics() {
    const styles = cakeStage ? getComputedStyle(cakeStage) : null;
    const read = (name, fallback) => {
      const raw = styles ? styles.getPropertyValue(name).trim() : '';
      const value = Number.parseFloat(raw);
      return Number.isFinite(value) ? value : fallback;
    };
    return {
      radiusX: read('--orbit-x', 220),
      radiusY: read('--orbit-y', 18)
    };
  }

  function placeOrbitSlots() {
    if (!orbitSlots.length) return;
    const { radiusX, radiusY } = orbitMetrics();
    const count = orbitSlots.length;
    let frontIndex = 0;
    let bestDepth = -Infinity;

    orbitSlots.forEach((slot, index) => {
      const angle = orbitAngle + (index * Math.PI * 2) / count;
      const depth = Math.cos(angle);
      const x = Math.sin(angle) * radiusX;
      const y = Math.cos(angle) * radiusY;
      const t = (depth + 1) / 2;
      const baseScale = 0.58 + t * 0.42;
      const scale = orbitPausing && index === orbitLastFront
        ? ORBIT_FRONT_SCALE
        : baseScale;
      slot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      slot.style.zIndex = String(10 + Math.round(t * 100));
      slot.style.opacity = String(0.42 + t * 0.58);
      if (depth > bestDepth) {
        bestDepth = depth;
        frontIndex = index;
      }
    });

    return { frontIndex, bestDepth };
  }

  function orbitFrame(ts) {
    if (!orbitRunning) return;
    if (!orbitLastTs) orbitLastTs = ts;
    const dt = Math.min(0.05, (ts - orbitLastTs) / 1000);
    orbitLastTs = ts;

    if (!orbitPausing && !reduceMotion) {
      orbitAngle += ORBIT_SPEED * dt;
    }

    const { frontIndex, bestDepth } = placeOrbitSlots();

    if (!orbitPausing && !reduceMotion && bestDepth > 0.965 && frontIndex !== orbitLastFront) {
      orbitLastFront = frontIndex;
      orbitPausing = true;
      orbitSlots.forEach((slot, index) => {
        slot.classList.toggle('is-front', index === frontIndex);
      });
      placeOrbitSlots();
      window.clearTimeout(orbitPauseTimer);
      orbitPauseTimer = window.setTimeout(() => {
        orbitPausing = false;
        orbitSlots.forEach((slot) => slot.classList.remove('is-front'));
        orbitLastTs = 0;
        if (orbitRunning) orbitRaf = requestAnimationFrame(orbitFrame);
      }, ORBIT_PAUSE_MS);
      return;
    }

    orbitRaf = requestAnimationFrame(orbitFrame);
  }

  function spinPhotos() {
    if (!orbit || !images.length) return;
    window.clearTimeout(orbitPauseTimer);
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitRunning = false;
    orbitPausing = false;
    orbitLastFront = -1;
    orbitLastTs = 0;
    orbitAngle = 0;
    orbitSlots.forEach((slot) => slot.classList.remove('is-front'));
    orbit.classList.remove('is-on');
    void orbit.offsetWidth;
    orbit.classList.add('is-on');
    orbit.setAttribute('aria-hidden', 'false');
    placeOrbitSlots();
    window.setTimeout(() => {
      if (!orbit.classList.contains('is-on')) return;
      orbitRunning = true;
      if (reduceMotion) {
        placeOrbitSlots();
        return;
      }
      orbitRaf = requestAnimationFrame(orbitFrame);
    }, 820);
  }

  function hidePhotos() {
    if (!orbit) return;
    orbitRunning = false;
    orbitPausing = false;
    window.clearTimeout(orbitPauseTimer);
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitRaf = 0;
    orbitSlots.forEach((slot) => {
      slot.classList.remove('is-front');
      slot.style.opacity = '';
      slot.style.transform = '';
      slot.style.zIndex = '';
    });
    orbit.classList.remove('is-on');
    orbit.setAttribute('aria-hidden', 'true');
  }

  showOrbit = spinPhotos;
  hideOrbit = hidePhotos;

  const videoGrid = $('#video-grid');
  const videos = media.videos || [];

  function syncPlayButton(card, video) {
    const button = $('.play-toggle', card);
    const playing = !video.paused && !video.ended;
    card.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
  }

  function playVideo(video) {
    $$('video').forEach((other) => {
      if (other !== video) other.pause();
    });
    video.controls = true;
    const pending = video.play();
    if (pending) pending.catch(() => {});
  }

  if (videoGrid) {
    if (!videos.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'No videos found yet. Add clips to the RAE VIDS folder, then restart the site.';
      videoGrid.appendChild(empty);
    } else {
      videos.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'video-card';
        const frameEl = document.createElement('div');
        frameEl.className = 'video-frame';
        const video = document.createElement('video');
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.preload = 'metadata';
        video.setAttribute('aria-label', item.title);
        const source = document.createElement('source');
        source.src = mediaUrl(item.src);
        source.type = item.type || 'video/mp4';
        video.appendChild(source);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'play-toggle';
        button.setAttribute('aria-label', 'Play video');
        button.innerHTML = '<span class="play-icon" aria-hidden="true"></span>';
        const title = document.createElement('p');
        title.className = 'video-title';
        const time = document.createElement('span');
        time.className = 'video-time';
        title.append(document.createTextNode(item.title), time);
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          if (video.paused || video.ended) playVideo(video);
          else video.pause();
        });
        frameEl.addEventListener('click', (event) => {
          if (event.target.closest('.play-toggle') || video.controls) return;
          if (video.paused || video.ended) playVideo(video);
        });
        video.addEventListener('play', () => {
          syncPlayButton(card, video);
          setDuck();
        });
        video.addEventListener('pause', () => {
          syncPlayButton(card, video);
          setDuck();
        });
        video.addEventListener('ended', () => {
          video.controls = false;
          syncPlayButton(card, video);
          setDuck();
        });
        video.addEventListener('loadedmetadata', () => {
          if (!Number.isFinite(video.duration)) return;
          const total = Math.round(video.duration);
          const minutes = Math.floor(total / 60);
          const seconds = String(total % 60).padStart(2, '0');
          time.textContent = ` · ${minutes}:${seconds}`;
        });
        video.addEventListener('error', () => {
          if (card.classList.contains('has-error')) return;
          if (!video.dataset.retried) {
            video.dataset.retried = '1';
            const current = source.getAttribute('src') || '';
            const next = current.replace(/\.mov($|\?)/i, '.mp4$1');
            window.setTimeout(() => {
              source.remove();
              video.src = next || current;
              video.load();
            }, 0);
            return;
          }
          card.classList.add('has-error');
          button.hidden = true;
          const note = document.createElement('p');
          note.className = 'video-error';
          note.textContent = 'This clip could not be played in this browser. The original file is still in the folder, unchanged.';
          frameEl.appendChild(note);
        });
        frameEl.append(video, button);
        card.append(frameEl, title);
        videoGrid.appendChild(card);
      });
    }
  }

  const messageSource = $('#message-source');
  const messageText = $('#message-text');
  let typeToken = 0;
  let typedOnce = false;

  function typeMessage() {
    const text = (messageSource.textContent || '').trim();
    const token = ++typeToken;
    messageText.classList.remove('is-done');
    if (reduceMotion) {
      messageText.textContent = text;
      messageText.classList.add('is-done');
      return;
    }
    messageText.textContent = '';
    let i = 0;
    const step = () => {
      if (token !== typeToken) return;
      i += 1;
      messageText.textContent = text.slice(0, i);
      if (i < text.length) {
        const ch = text[i - 1];
        const delay = ch === ',' ? 120 : (ch === '.' || ch === '!' || ch === '?') ? 230 : 22;
        window.setTimeout(step, delay);
      } else {
        messageText.classList.add('is-done');
      }
    };
    step();
  }

  $('#replay-message').addEventListener('click', typeMessage);

  const poemSheet = $('.poem-sheet');
  const poemBlocks = $$('.poem-stanza, .poem-close', poemSheet).map((el) => {
    const lines = [];
    let current = '';
    el.childNodes.forEach((node) => {
      if (node.nodeName === 'BR') {
        lines.push(current.trim());
        current = '';
      } else {
        current += node.textContent;
      }
    });
    const last = current.trim();
    if (last) lines.push(last);
    el.textContent = '';
    return { el, lines };
  });
  if (poemSheet && poemBlocks.length) {
    const poemSource = document.createElement('p');
    poemSource.className = 'sr-only';
    poemSource.textContent = poemBlocks.map((block) => block.lines.join('\n')).join('\n\n');
    poemSheet.parentNode.insertBefore(poemSource, poemSheet);
    poemSheet.setAttribute('aria-hidden', 'true');
  }

  let poemToken = 0;
  let poemInView = false;

  function wordDelay(word, endOfLine, endOfStanza) {
    if (endOfStanza) return 320;
    if (endOfLine) return 170;
    if (/[.!?]$/.test(word)) return 190;
    if (/[,;:]$/.test(word)) return 120;
    return 68;
  }

  function showPoem() {
    poemBlocks.forEach(({ el, lines }) => {
      el.classList.remove('is-typing');
      el.replaceChildren();
      lines.forEach((line, index) => {
        if (index) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(line));
      });
    });
  }

  function resetPoem() {
    poemToken += 1;
    poemBlocks.forEach(({ el }) => {
      el.classList.remove('is-typing');
      el.textContent = '';
    });
  }

  function typePoem() {
    const token = ++poemToken;
    if (!poemBlocks.length) return;
    if (reduceMotion) {
      showPoem();
      return;
    }
    const steps = [];
    poemBlocks.forEach(({ el, lines }) => {
      el.classList.remove('is-typing');
      el.textContent = '';
      lines.forEach((line, lineIndex) => {
        const words = line.split(/\s+/).filter(Boolean);
        words.forEach((word, wordIndex) => {
          steps.push({
            el,
            word,
            lineBreak: wordIndex === 0 && lineIndex > 0,
            pause: wordDelay(word, wordIndex === words.length - 1, wordIndex === words.length - 1 && lineIndex === lines.length - 1)
          });
        });
      });
    });
    let index = 0;
    const step = () => {
      if (token !== poemToken || !poemInView) return;
      if (index >= steps.length) {
        poemBlocks.forEach(({ el }) => el.classList.remove('is-typing'));
        return;
      }
      const item = steps[index];
      poemBlocks.forEach(({ el }) => el.classList.toggle('is-typing', el === item.el));
      if (item.lineBreak) item.el.appendChild(document.createElement('br'));
      else if (item.el.childNodes.length) item.el.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.className = 'pop-word';
      span.textContent = item.word;
      item.el.appendChild(span);
      index += 1;
      window.setTimeout(step, item.pause);
    };
    step();
  }

  const replayPoem = $('#replay-poem');
  if (replayPoem) {
    replayPoem.addEventListener('click', () => {
      if (!poemInView) return;
      typePoem();
    });
  }

  let finalePlayed = false;
  function reveal(el) {
    if (!el || el.classList.contains('show')) return;
    el.classList.add('show');
    if (el.id === 'message' && !typedOnce) {
      typedOnce = true;
      typeMessage();
    }
    if (el.id === 'finale' && !finalePlayed) {
      finalePlayed = true;
      fx.celebrate();
    }
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) reveal(entry.target);
    });
  }, { threshold: 0.28 });
  $$('.reveal').forEach((el) => {
    if (el.id === 'poem') return;
    revealObserver.observe(el);
  });

  const poemSection = document.getElementById('poem');
  if (poemSection) {
    const poemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== poemSection) return;
        if (entry.isIntersecting) {
          poemInView = true;
          poemSection.classList.add('show');
          typePoem();
        } else {
          poemInView = false;
          resetPoem();
        }
      });
    }, { threshold: 0.22 });
    poemObserver.observe(poemSection);
  }

  const navLinks = $$('.nav a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.setAttribute('aria-current', active ? 'true' : 'false');
      });
    });
  }, { rootMargin: '-40% 0px -45% 0px', threshold: 0.01 });
  navLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) navObserver.observe(section);
  });

  $('#again-btn').addEventListener('click', () => fx.celebrate());

  const welcome = $('#welcome');
  const experience = $('#experience');
  const ageForm = $('#age-form');
  const ageInput = $('#age');
  const ageError = $('#age-error');
  const ageNote = $('#age-note');

  ageInput.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });

  ageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = ageInput.value.trim();
    const age = Number(raw);
    if (!raw || !Number.isInteger(age) || age < 1 || age > 120) {
      ageError.hidden = false;
      ageError.textContent = "Type your age first, then hit Let's Go.";
      ageInput.setAttribute('aria-invalid', 'true');
      welcome.classList.remove('shake');
      void welcome.offsetWidth;
      welcome.classList.add('shake');
      ageInput.focus();
      return;
    }
    ageError.hidden = true;
    ageInput.removeAttribute('aria-invalid');
    ageNote.textContent = `Celebrating you at ${age}.`;
    $('#go-btn').disabled = true;
    userPaused = false;
    ensureMusic();
    welcome.classList.add('is-leaving');
    fx.welcome();
    window.setTimeout(() => {
      welcome.classList.add('is-gone');
      document.body.classList.remove('locked');
      document.body.classList.add('entered');
      experience.classList.add('is-opening');
      window.scrollTo(0, 0);
      startAmbientConfetti();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          experience.classList.add('is-open');
          $('#intro').classList.add('play');
          $$('.reveal').forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.86 && rect.bottom > 0) reveal(el);
          });
        });
      });
    }, 680);
  });

})();
