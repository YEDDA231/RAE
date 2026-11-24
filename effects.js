(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawHeart(ctx, size) {
    const s = size / 2;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.15, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.45, -s * 1.15, s * 1.1, -s * 0.35, 0, s * 0.35);
    ctx.closePath();
  }

  function createSky(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0;
    let h = 0;
    let particles = [];
    let shots = [];
    let lastShot = 0;
    let running = true;
    let raf = 0;
    let linkDist = 120;

    function spawn() {
      const bright = Math.random() < 0.18;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: bright ? 1.8 + Math.random() * 1.1 : 0.45 + Math.random() * 1.05,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        a: 0.35 + Math.random() * 0.55,
        tw: Math.random() * Math.PI * 2,
        hue: bright ? '255, 248, 255' : (Math.random() < 0.55 ? '214, 186, 255' : '255, 186, 214')
      };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      linkDist = w < 700 ? 96 : 134;
      const count = reduceMotion ? 22 : (w < 700 ? 40 : 74);
      particles = Array.from({ length: count }, spawn);
    }

    function frame(time) {
      raf = 0;
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12;
        if (p.y > h + 12) p.y = -12;
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          if (Math.abs(dx) > linkDist) continue;
          const dy = a.y - b.y;
          if (Math.abs(dy) > linkDist) continue;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * 0.42;
          ctx.strokeStyle = `rgba(214, 186, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const alpha = p.a * (0.62 + 0.38 * Math.sin(time * 0.002 + p.tw));
        if (p.r > 1.4) {
          ctx.fillStyle = `rgba(${p.hue}, ${alpha * 0.16})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 5.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(${p.hue}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        if (time - lastShot > 5400) {
          lastShot = time;
          shots.push({
            x: Math.random() * w * 0.72,
            y: Math.random() * h * 0.42,
            vx: 6.5 + Math.random() * 3.5,
            vy: 1.6 + Math.random() * 1.6,
            life: 1,
            history: []
          });
        }
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.history.push({ x: s.x, y: s.y });
          if (s.history.length > 16) s.history.shift();
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.012;
          if (s.life <= 0 || s.x > w + 50) {
            shots.splice(i, 1);
            continue;
          }
          for (let n = 1; n < s.history.length; n++) {
            const from = s.history[n - 1];
            const to = s.history[n];
            ctx.strokeStyle = `rgba(255, 236, 250, ${(n / s.history.length) * s.life * 0.85})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
          ctx.fillStyle = `rgba(255,255,255,${s.life})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else start();
    });

    window.addEventListener('resize', resize);
    resize();
    start();
  }

  function createFX(canvas) {
    const ctx = canvas.getContext('2d');
    const colors = ['#ff8ec8', '#e6d4ff', '#ffd56a', '#ffffff', '#b388ff', '#ffb3c7', '#8ecbff'];
    let w = 0;
    let h = 0;
    const pieces = [];
    let running = true;
    let raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function trim() {
      if (pieces.length > 460) pieces.splice(0, pieces.length - 460);
    }

    function explode(x, y, color, count) {
      pieces.push({ kind: 'ring', x, y, r: 4, vr: 2.2, life: 1, decay: 0.028, color });
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.12;
        const speed = 1.4 + Math.random() * 3.1;
        pieces.push({
          kind: 'spark',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          g: 0.022,
          color,
          life: 1,
          decay: 0.01 + Math.random() * 0.01,
          r: 1.3 + Math.random() * 1.5
        });
      }
      trim();
    }

    function confetti(origin) {
      const count = origin && origin.count ? origin.count : (reduceMotion ? 36 : 120);
      const x = origin && origin.x != null ? origin.x : w * 0.5;
      const y = origin && origin.y != null ? origin.y : h * 0.32;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.4 + Math.random() * 7;
        const roll = Math.random();
        pieces.push({
          kind: 'confetti',
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          g: 0.11 + Math.random() * 0.06,
          w: 6 + Math.random() * 6,
          h: 8 + Math.random() * 7,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.28,
          sway: Math.random() * Math.PI * 2,
          color: colors[i % colors.length],
          shape: roll < 0.08 ? 'heart' : (roll < 0.55 ? 'rect' : 'circle'),
          life: 1,
          decay: 0.0035 + Math.random() * 0.0035
        });
      }
      trim();
    }

    function fireworks(n) {
      const total = n == null ? (reduceMotion ? 3 : 6) : n;
      for (let i = 0; i < total; i++) {
        const x = w * (0.12 + Math.random() * 0.76);
        const y = h * (0.12 + Math.random() * 0.38);
        const color = colors[i % colors.length];
        setTimeout(() => explode(x, y, color, reduceMotion ? 16 : 42), i * 260);
      }
    }

    function welcome() {
      fireworks(reduceMotion ? 2 : 3);
      confetti({ count: reduceMotion ? 28 : 80, x: w * 0.5, y: h * 0.38 });
    }

    function celebrate() {
      fireworks(reduceMotion ? 3 : 7);
      confetti({ count: reduceMotion ? 30 : 100, x: w * 0.5, y: h * 0.3 });
      confetti({ count: reduceMotion ? 16 : 55, x: w * 0.16, y: h * 0.46 });
      confetti({ count: reduceMotion ? 16 : 55, x: w * 0.84, y: h * 0.46 });
    }

    function frame() {
      raf = 0;
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        if (p.kind === 'ring') {
          p.r += p.vr;
          p.life -= p.decay;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.g || 0;
          if (p.kind === 'confetti') {
            p.sway += 0.08;
            p.x += Math.sin(p.sway) * 0.45;
            p.rot += p.vr;
          }
          p.life -= p.decay;
        }
        if (p.life <= 0) {
          pieces.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(p.life, 0);
        if (p.kind === 'spark' || p.kind === 'ring') ctx.globalCompositeOperation = 'lighter';
        else ctx.globalCompositeOperation = 'source-over';

        if (p.kind === 'ring') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.kind === 'spark') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = p.life * 0.45;
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
          ctx.stroke();
        } else {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 'heart') {
            drawHeart(ctx, p.w + 4);
            ctx.fill();
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }

    function start() {
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else start();
    });

    window.addEventListener('resize', resize);
    resize();
    start();

    return {
      confetti,
      fireworks,
      welcome,
      celebrate,
      sparkleBurst(x, y) {
        explode(x, y, '#ffe7a3', reduceMotion ? 10 : 18);
      }
    };
  }

  window.BirthdayEffects = { createSky, createFX, reduceMotion };
})();
