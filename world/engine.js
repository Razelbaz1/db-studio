/* ==STORY-ENGINE== RowdyQL scroll story: a sticky 1600x900 stage driven by scroll progress p in [0,1].
   Chapters register with STORY.register({id, layer, range:[a,b], captions:[{at:[a,b], he, en}], build(ctx, g), update(p, ctx, dt, time)}).
   The engine owns: DOM, camera, particle flows (canvas), captions, the end box, reduced-motion/static mode. */
const STORY = (() => {
  const W = 1600, H = 900, NS = 'http://www.w3.org/2000/svg';
  const LAYERS = ['bg', 'floor', 'farm', 'cables', 'pcs', 'queries', 'client', 'fx'];
  const chapters = [], flows = [];
  let root, stage, svg, defs, world, layers = {}, canvas, c2d, capBox, endBox, forced = null, isStatic = false, running = false, lastT = 0, dpr = 1, ctx, building = null;

  /* ---- math ---- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = {
    in: t => t * t, out: t => 1 - (1 - t) * (1 - t),
    inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    outBack: t => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
    expoIn: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
    outCubic: t => 1 - Math.pow(1 - t, 3)
  };
  const CO = Math.cos(Math.PI / 6), SI = Math.sin(Math.PI / 6);
  const f2 = n => Math.round(n * 100) / 100;
  /* isometric projection: world (x right-back, y left-back, z up) -> stage px, with a screen origin o=[sx,sy] */
  const iso = { P: (x, y, z, o) => [(o ? o[0] : 0) + (x - y) * CO, (o ? o[1] : 0) + (x + y) * SI - z] };

  /* ---- svg helpers ---- */
  function el(tag, attrs, parent){ const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) { if (attrs[k] != null) e.setAttribute(k, attrs[k]); } if (parent) parent.appendChild(e); return e; }
  const pts = arr => arr.map(q => f2(q[0]) + ',' + f2(q[1])).join(' ');
  /* isometric box: origin o (stage px), footprint x,y,w,d in world units, height h. faces get classes s-lf s-rt s-tp; extra class on the group */
  function box(parent, o, x, y, w, d, h, cls){
    const P = (a, b, c) => iso.P(a, b, c, o); const g = el('g', { class: 's-box' + (cls ? ' ' + cls : '') }, parent);
    el('polygon', { class: 's-lf', points: pts([P(x, y + d, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x, y + d, 0)]) }, g);
    el('polygon', { class: 's-rt', points: pts([P(x + w, y, h), P(x + w, y + d, h), P(x + w, y + d, 0), P(x + w, y, 0)]) }, g);
    el('polygon', { class: 's-tp', points: pts([P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)]) }, g);
    return g;
  }
  /* quadratic curve between stage points a and b; bend = perpendicular offset of the control point (px) */
  function curve(a, b, bend){ const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; const L = Math.hypot(dx, dy) || 1; const nx = -dy / L, ny = dx / L; return 'M' + f2(a[0]) + ',' + f2(a[1]) + ' Q' + f2(mx + nx * (bend || 0)) + ',' + f2(my + ny * (bend || 0)) + ' ' + f2(b[0]) + ',' + f2(b[1]); }
  /* n+1 points along a path element (stage coords, before camera) */
  function sample(pathEl, n){ const L = pathEl.getTotalLength(); const out = []; for (let i = 0; i <= n; i++) { const q = pathEl.getPointAtLength(L * i / n); out.push([q.x, q.y]); } return out; }
  /* reveal a stroke from its start: t in [0,1] */
  function drawIn(pathEl, t){ const L = pathEl._len || (pathEl._len = pathEl.getTotalLength() || 1); pathEl.style.strokeDasharray = L + ' ' + L; pathEl.style.strokeDashoffset = L * (1 - clamp(t)); }
  function show(node, on){ node.style.opacity = typeof on === 'number' ? clamp(on) : (on ? 1 : 0); }

  /* ---- particle flows on the canvas (stage coords; the engine applies the camera) ---- */
  function flow(points, opts){
    const fl = Object.assign({ color: '#5CC3D9', speed: 160, count: 12, size: 2.2, tail: 18, intensity: 0 }, opts || {}); fl.ps = []; if (!fl.range && building) fl.range = building.range.slice();
    const setPoints = arr => { fl.points = arr; fl.seg = []; fl.len = 0; for (let i = 1; i < arr.length; i++) { const d = Math.hypot(arr[i][0] - arr[i - 1][0], arr[i][1] - arr[i - 1][1]); fl.seg.push(d); fl.len += d; } };
    setPoints(points); for (let i = 0; i < fl.count; i++) fl.ps.push({ s: Math.random() * fl.len, v: fl.speed * (.7 + Math.random() * .6), a: .4 + Math.random() * .6 });
    flows.push(fl); return { set: v => { fl.intensity = clamp(v); }, setPoints, fl };
  }
  function posAt(fl, s){ let i = 0; while (i < fl.seg.length - 1 && s > fl.seg[i]) { s -= fl.seg[i]; i++; } const a = fl.points[i], b = fl.points[i + 1] || a; const t = fl.seg[i] ? clamp(s / fl.seg[i]) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function drawParticles(dt, cam, p){
    const r = svg.getBoundingClientRect(); if (!r.width) return; const cw = Math.round(r.width * dpr), chh = Math.round(r.height * dpr);
    if (canvas.width !== cw || canvas.height !== chh) { canvas.width = cw; canvas.height = chh; }
    const s = Math.min(r.width / W, r.height / H), ox = (r.width - W * s) / 2, oy = (r.height - H * s) / 2;
    c2d.setTransform(1, 0, 0, 1, 0, 0); c2d.clearRect(0, 0, cw, chh); c2d.scale(dpr, dpr); c2d.translate(ox + s * cam.tx, oy + s * cam.ty); c2d.scale(s * cam.k, s * cam.k); c2d.lineCap = 'round';
    flows.forEach(fl => { const w = fl.range ? Math.min(seg(p, fl.range[0] - .06, fl.range[0] - .01), 1 - seg(p, fl.range[1] + .03, fl.range[1] + .09)) : 1; const I = fl.intensity * w; if (I <= 0 || fl.len <= 0) return;
      fl.ps.forEach(q => { q.s += q.v * dt; if (q.s > fl.len) q.s -= fl.len; const h = posAt(fl, q.s), tl = posAt(fl, Math.max(0, q.s - fl.tail));
        c2d.globalAlpha = I * q.a; c2d.strokeStyle = fl.color; c2d.lineWidth = fl.size; c2d.beginPath(); c2d.moveTo(tl[0], tl[1]); c2d.lineTo(h[0], h[1]); c2d.stroke();
        c2d.fillStyle = fl.color; c2d.shadowColor = fl.color; c2d.shadowBlur = 10; c2d.beginPath(); c2d.arc(h[0], h[1], fl.size * 1.1, 0, 6.2832); c2d.fill(); c2d.shadowBlur = 0; }); });
    c2d.globalAlpha = 1;
  }

  /* ---- camera: keyframes [p, center, scale] ---- */
  const anchors = { FARM: [380, 470], PCS: [[820, 330], [960, 560], [1120, 400]], HOLO: [960, 250], GLOBE: [1330, 230], PIPES: { x1: 150, x2: 1450, y1: 110, y2: 190 }, CLIENT: [1060, 610] };
  const CAM = [[0, [520, 470], 1.3], [.3, [800, 450], 1], [.72, [800, 450], 1], [.92, [1060, 600], 1.35], [1, [1060, 600], 1.35]];
  function camera(p){ let i = 0; while (i < CAM.length - 2 && p > CAM[i + 1][0]) i++; const a = CAM[i], b = CAM[i + 1]; const t = ease.inOut(seg(p, a[0], b[0])); const c = [lerp(a[1][0], b[1][0], t), lerp(a[1][1], b[1][1], t)], k = lerp(a[2], b[2], t); return { tx: W / 2 - k * c[0], ty: H / 2 - k * c[1], k, c }; }

  /* ---- captions ---- */
  const curLang = () => (typeof lang !== 'undefined' && lang === 'en') ? 'en' : 'he';
  function updateCaptions(p){ let best = null; chapters.forEach(ch => (ch.captions || []).forEach(c => { if (p >= c.at[0] && p <= c.at[1]) best = c; })); if (!best) { capBox.style.opacity = 0; return; }
    const txt = best[curLang()] || best.he; if (capBox.textContent !== txt) capBox.textContent = txt; capBox.style.opacity = Math.min(seg(p, best.at[0], best.at[0] + .035), 1 - seg(p, best.at[1] - .035, best.at[1])); }

  /* ---- progress + loop ---- */
  function progress(){ if (forced != null) return forced; const r = root.getBoundingClientRect(); const d = r.height - innerHeight; return d > 0 ? clamp(-r.top / d) : 1; }
  function applyCam(cam){ world.setAttribute('transform', 'translate(' + cam.tx.toFixed(1) + ' ' + cam.ty.toFixed(1) + ') scale(' + cam.k.toFixed(3) + ')'); }
  function tick(p, dt, time){ const cam = camera(p); applyCam(cam); chapters.forEach(ch => { try { ch.update(p, ctx, dt, time); } catch (e) { console.error('story chapter ' + ch.id, e); } }); updateCaptions(p); if (endBox) { const o = seg(p, .9, .97); endBox.style.opacity = o; endBox.style.pointerEvents = o > .5 ? 'auto' : 'none'; } drawParticles(dt, cam, p); }
  function frame(t){ if (!running) return; const dt = Math.min(.05, lastT ? (t - lastT) / 1000 : .016); lastT = t; tick(progress(), dt, t / 1000); requestAnimationFrame(frame); }
  function start(){ if (running || isStatic) return; running = true; lastT = 0; requestAnimationFrame(frame); }
  function stop(){ running = false; if (c2d && canvas) { c2d.setTransform(1, 0, 0, 1, 0, 0); c2d.clearRect(0, 0, canvas.width, canvas.height); } }

  /* ---- init ---- */
  function init(section, opts){
    opts = opts || {}; root = section.querySelector('.story-track'); stage = section.querySelector('.story-stage'); endBox = section.querySelector('.story-end');
    isStatic = !!opts.static || matchMedia('(prefers-reduced-motion: reduce)').matches; forced = (opts.force != null) ? clamp(opts.force) : null; dpr = Math.min(2, devicePixelRatio || 1);
    svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' }); stage.insertBefore(svg, stage.firstChild);
    defs = el('defs', null, svg);
    defs.innerHTML = '<filter id="stGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '<filter id="stGlow2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '<filter id="stBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>'
      + '<linearGradient id="stCyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FE0EF"/><stop offset="1" stop-color="#3FB1C9"/></linearGradient>'
      + '<radialGradient id="stHalo"><stop offset="0" stop-color="#5CC3D9" stop-opacity=".45"/><stop offset="1" stop-color="#5CC3D9" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="stAmberHalo"><stop offset="0" stop-color="#E8A33A" stop-opacity=".5"/><stop offset="1" stop-color="#E8A33A" stop-opacity="0"/></radialGradient>';
    world = el('g', { id: 'stWorld' }, svg); LAYERS.forEach(n => { layers[n] = el('g', { class: 's-layer', 'data-layer': n }, world); });
    canvas = document.createElement('canvas'); canvas.className = 'story-fx'; stage.insertBefore(canvas, endBox || null); c2d = canvas.getContext('2d');
    capBox = document.createElement('div'); capBox.className = 'story-cap'; stage.insertBefore(capBox, endBox || null);
    ctx = { W, H, el, box, curve, sample, drawIn, show, iso, seg, lerp, clamp, ease, flow, anchors, defs, glow: 'url(#stGlow)', glow2: 'url(#stGlow2)', layer: n => layers[n] || layers.fx, lang: curLang, local: (p, ch) => seg(p, ch.range[0], ch.range[1]) };
    chapters.sort((a, b) => LAYERS.indexOf(a.layer) - LAYERS.indexOf(b.layer));
    chapters.forEach(ch => { ch.g = el('g', { class: 's-ch', 'data-ch': ch.id }, layers[ch.layer] || layers.fx); building = ch; try { ch.build(ctx, ch.g); } catch (e) { console.error('story build ' + ch.id, e); } building = null; });
    if (isStatic) { section.classList.add('static'); const list = document.createElement('div'); list.className = 'story-caps'; chapters.forEach(ch => (ch.captions || []).forEach(c => { const p = document.createElement('p'); p.textContent = c[curLang()] || c.he; list.appendChild(p); })); section.appendChild(list); tick(1, 0, 0); if (endBox) { endBox.style.opacity = 1; endBox.style.pointerEvents = 'auto'; } return; }
    if (forced != null) { for (let i = 0; i < 90; i++) tick(forced, .016, i * .016); start(); return; }
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { rootMargin: '120px 0px' }); io.observe(root);
    tick(progress(), .016, 0);
  }
  function register(ch){ if (!ch || !ch.id || typeof ch.build !== 'function' || typeof ch.update !== 'function') throw new Error('bad chapter'); ch.layer = ch.layer || 'fx'; ch.range = ch.range || [0, 1]; chapters.push(ch); return ch; }
  return { init, register, force: p => { forced = p == null ? null : clamp(p); }, chapters, W, H };
})();
/* ==/STORY-ENGINE== */
