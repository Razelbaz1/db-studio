/* ch1_farm.js — RowdyQL scroll story, chapter "farm" (global p 0.00–0.25).
   A server farm rises out of a glowing isometric floor. The floor plate, its grid, halo, sockets, socket light and
   floor rings are added to the 'floor' layer; the seven racks (a back row of four, two front racks and a tall central
   core) live in this chapter's group on the 'farm' layer. Each rack is clipped to the column above its socket and
   translated down into the floor, so it pushes up like a button (slow start, fast rise, small overshoot, settle).
   LEDs blink with time; the core lands with an amber pulse, two burst rings, slow continuous rings and a thin stream
   of particles rising from its top. Uses only stage px around FARM [380,470]; region x 120…640, y 300…640. */
(function () {
  const CO = Math.cos(Math.PI / 6), SI = Math.sin(Math.PI / 6), TAN = SI / CO;
  const O = [380, 390];      // stage px of the floor surface's back corner (world z = 0); world axes run 0..S
  const S = 240;             // floor size in world units
  const RACKS = [            // footprint x,y,w,d and height h in world px; s = global p where the rise starts
    { x: 24,  y: 30,  w: 36, d: 36, h: 100, n: 5, s: .015, dur: .05 },
    { x: 76,  y: 30,  w: 36, d: 36, h: 100, n: 5, s: .037, dur: .05 },
    { x: 128, y: 30,  w: 36, d: 36, h: 100, n: 5, s: .059, dur: .05 },
    { x: 180, y: 30,  w: 36, d: 36, h: 100, n: 5, s: .081, dur: .05 },
    { x: 20,  y: 150, w: 36, d: 36, h: 100, n: 5, s: .103, dur: .05 },
    { x: 184, y: 150, w: 36, d: 36, h: 100, n: 5, s: .125, dur: .05 },
    { x: 98,  y: 146, w: 44, d: 44, h: 150, n: 8, s: .16,  dur: .06, core: true }
  ];
  const st = { racks: [], leds: [], rings: [], motes: [], lastP: -1, amp: 0, ringGate: 0, fgBase: .3, moteGate: .35 };
  const f2 = n => Math.round(n * 100) / 100;
  let P, f, pts;

  /* button-like rise: nothing happens for a while, then a fast climb, ~9% overshoot, settle */
  const rise = (E, t) => t <= 0 ? 0 : t >= 1 ? 1 : E.outBack(t * t * t);
  const ledPattern = (mode, time, ph) => {
    switch (mode) {
      case 1: return Math.sin(time * 1.6 + ph) > .1 ? 1 : .18;                 // slow blink
      case 2: return Math.sin(time * 9 + ph) > .3 ? 1 : .2;                    // activity flicker
      case 3: return .55 + .45 * Math.sin(time * 2.4 + ph);                    // breathing
      case 4: return (((time * 1.2 + ph) % 1) + 1) % 1 < .12 ? 1 : .25;       // heartbeat
      default: return 1;                                                        // steady power LED
    }
  };

  function buildFloor(ctx){
    const fl = ctx.el('g', { class: 's-farm-floor' }, ctx.layer('floor'));
    st.halo = ctx.el('ellipse', { cx: 380, cy: 512, rx: 270, ry: 150, fill: 'url(#stHalo)' }, fl);
    const plate = ctx.box(fl, [O[0], O[1] + 8], 0, 0, S, S, 8, 's-plate');
    plate.children[2].style.fill = '#0D1A1C';
    const cp = ctx.el('clipPath', { id: 'farm-cpFloor' }, ctx.defs);
    ctx.el('polygon', { points: pts([P(0, 0, 0), P(S, 0, 0), P(S, S, 0), P(0, S, 0)]) }, cp);
    const fg = ctx.el('g', { 'clip-path': 'url(#farm-cpFloor)' }, fl);       // things that must stay on the plate
    st.fglow = ctx.el('ellipse', { cx: 380, cy: 510, rx: 270, ry: 150, fill: 'url(#stHalo)' }, fg);
    RACKS.forEach(r => {                                                       // light leaking out of every socket
      const c = P(r.x + r.w / 2, r.y + r.d / 2, 0), rx = (r.w + r.d) * CO / 2 * 1.4;
      r.glow = ctx.el('ellipse', { cx: f2(c[0]), cy: f2(c[1]), rx: f2(rx), ry: f2(rx * TAN), fill: r.core ? 'url(#stAmberHalo)' : 'url(#stHalo)', opacity: 0 }, fg);
    });
    const cc = P(120, 168, 0);                                                 // rings from the core: 3 continuous + 2 bursts
    for (let k = 0; k < 5; k++) st.rings.push(ctx.el('ellipse', { cx: f2(cc[0]), cy: f2(cc[1]), rx: 20, ry: f2(20 * TAN), fill: 'none', stroke: '#5CC3D9', 'stroke-width': k < 3 ? 1.1 : 1.6, opacity: 0 }, fg));
    let gd = ''; for (let k = 1; k < 10; k++) { const t = S * k / 10; gd += 'M' + f(P(t, 0, 0)) + 'L' + f(P(t, S, 0)) + 'M' + f(P(0, t, 0)) + 'L' + f(P(S, t, 0)); }
    ctx.el('path', { d: gd, fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1, opacity: .18 }, fl);
    let sd = ''; RACKS.forEach(r => { sd += 'M' + f(P(r.x, r.y, 0)) + 'L' + f(P(r.x + r.w, r.y, 0)) + 'L' + f(P(r.x + r.w, r.y + r.d, 0)) + 'L' + f(P(r.x, r.y + r.d, 0)) + 'Z'; });
    ctx.el('path', { d: sd, fill: 'rgba(92,195,217,.06)', stroke: '#5CC3D9', 'stroke-width': 1, opacity: .35 }, fl);
    ctx.el('path', { d: 'M' + f(P(0, 0, 0)) + 'L' + f(P(S, 0, 0)) + 'L' + f(P(S, S, 0)) + 'L' + f(P(0, S, 0)) + 'Z', fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.5, opacity: .55, filter: ctx.glow }, fl);
    const lp = P(14, S - 8, 0);                                                // label lying on the plate along the front-left edge
    const label = ctx.el('text', { class: 's-mono s-muted', 'font-size': 9, opacity: .6, transform: 'matrix(' + [CO, SI, -CO, SI, lp[0], lp[1]].map(v => v.toFixed(3)).join(' ') + ')' }, fl);
    label.textContent = 'DC-01 · RACK FARM';
  }

  function buildRack(ctx, g, r, i){
    const { x, y, w, d, h } = r;
    const cp = ctx.el('clipPath', { id: 'farm-cp' + i }, ctx.defs);           // the column above the socket
    ctx.el('polygon', { points: pts([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y, 0), P(x + w, y, 420), P(x, y + d, 420)]) }, cp);
    const wrap = ctx.el('g', { 'clip-path': 'url(#farm-cp' + i + ')' }, g);
    const mv = ctx.el('g', { class: 's-rack' + (r.core ? ' s-core' : '') }, wrap);
    const bx = ctx.box(mv, O, x, y, w, d, h);
    if (r.core) { const tp = bx.children[2]; tp.style.fill = 'url(#stCyan)'; tp.style.fillOpacity = .85; }
    const u = (h - 14) / r.n;
    let sd = '', hd = '';                                                      // unit rails + handles on the front-left face
    for (let k = 0; k <= r.n; k++) { const z = 7 + k * u; sd += 'M' + f(P(x, y + d, z)) + 'L' + f(P(x + w, y + d, z)); }
    for (let k = 0; k < r.n; k++) { if (r.core && k === r.n - 1) continue; const z = 7 + (k + .5) * u; hd += 'M' + f(P(x + w * .1, y + d, z)) + 'L' + f(P(x + w * .5, y + d, z)); }
    ctx.el('path', { d: sd, fill: 'none', stroke: '#2B3A37', 'stroke-width': 1 }, mv);
    ctx.el('path', { d: hd, fill: 'none', stroke: '#93A5A1', 'stroke-width': 1, opacity: .28 }, mv);
    let vd = ''; for (let k = 1; k <= 3; k++) { const yy = y + d * k / 4; vd += 'M' + f(P(x + w, yy, 10)) + 'L' + f(P(x + w, yy, h - 10)); }
    ctx.el('path', { d: vd, fill: 'none', stroke: '#1F2F2C', 'stroke-width': 1.2 }, mv);                 // vents on the right face
    ctx.el('path', { d: 'M' + f(P(x + w, y + d, 0)) + 'L' + f(P(x + w, y + d, h)), fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.2, opacity: .55, filter: ctx.glow }, mv);   // lit front edge
    const m = r.core ? 11 : 5;
    const inset = ctx.el('polygon', { points: pts([P(x + m, y + m, h), P(x + w - m, y + m, h), P(x + w - m, y + d - m, h), P(x + m, y + d - m, h)]),
      fill: r.core ? '#E8A33A' : 'none', stroke: r.core ? '#F3C170' : '#5CC3D9', 'stroke-width': .8, opacity: r.core ? .9 : .35, filter: r.core ? ctx.glow : null }, mv);
    if (r.core) {
      st.tile = inset;
      const z1 = 7 + (r.n - 1) * u + 3, z2 = 7 + r.n * u - 3;                 // status display in the top unit
      ctx.el('polygon', { points: pts([P(x + 4, y + d, z1), P(x + w * .62, y + d, z1), P(x + w * .62, y + d, z2), P(x + 4, y + d, z2)]), fill: 'rgba(92,195,217,.3)', stroke: '#5CC3D9', 'stroke-width': .8, opacity: .85 }, mv);
      let bd = ''; for (let k = 0; k < 3; k++) { const z = z2 - 3 - k * ((z2 - z1 - 6) / 2); bd += 'M' + f(P(x + 7, y + d, z)) + 'L' + f(P(x + 7 + (w * .62 - 11) * (.95 - k * .3), y + d, z)); }
      ctx.el('path', { d: bd, fill: 'none', stroke: '#8FE0EF', 'stroke-width': 1.2, opacity: .9 }, mv);
    }
    const lg = ctx.el('g', { filter: ctx.glow }, mv);
    const cols = r.core ? [.7, .86] : [.84];
    cols.forEach((cx, ci) => { for (let k = 0; k < r.n; k++) {
      if (r.core && k === r.n - 1) continue;
      const z = 7 + (k + .5) * u, q = P(x + w * cx, y + d, z);
      const amber = r.core ? k === 0 : (i * 3 + k) % 13 === 6;
      const led = ctx.el('circle', { cx: f2(q[0]), cy: f2(q[1]), r: r.core ? 1.7 : 1.5, fill: amber ? '#E8A33A' : '#5CC3D9' }, lg);
      st.leds.push({ el: led, rk: r, mode: amber ? 0 : (i * 2 + k * 3 + ci * 2) % 5, ph: (i * 1.7 + k * 2.3 + ci) % 6.28 });
    } });
    r.mv = mv; r.t = 0; r.on = 0; st.racks.push(r); if (r.core) st.core = r;
  }

  STORY.register({
    id: 'farm', layer: 'farm', range: [0, .25],
    captions: [{ at: [.03, .22],
      he: 'ברוכים הבאים לעולם של מסדי הנתונים. הכול מתחיל בחוות שרתים.',
      en: 'Welcome to the world of databases. It all starts in a server farm.' }],
    build(ctx, g){
      P = (x, y, z) => ctx.iso.P(x, y, z, O);
      f = q => q[0].toFixed(1) + ',' + q[1].toFixed(1);
      pts = arr => arr.map(f).join(' ');
      buildFloor(ctx);
      RACKS.map((r, i) => ({ r, i })).sort((a, b) => (a.r.x + a.r.w / 2 + a.r.y + a.r.d / 2) - (b.r.x + b.r.w / 2 + b.r.y + b.r.d / 2)).forEach(o => buildRack(ctx, g, o.r, o.i));
      const ct = P(120, 168, 150);                                             // core top centre
      st.amberHalo = ctx.el('ellipse', { cx: f2(ct[0]), cy: f2(ct[1]), rx: 36, ry: 21, fill: 'url(#stAmberHalo)', opacity: 0 }, g);
      st.floorFlow = ctx.flow([P(0, S, 0), P(S, S, 0), P(S, 0, 0)], { color: '#5CC3D9', speed: 80, count: 10, size: 1.5, tail: 14 });   // front edges only (the canvas draws above the racks)
      st.coreFlow = ctx.flow([[ct[0], ct[1] - 4], [ct[0], ct[1] - 72]], { color: '#8FE0EF', speed: 30, count: 5, size: 1.4, tail: 12 });
      for (let k = 0; k < 10; k++) {                                           // motes drifting up from the plate
        const b = P(30 + (k * 67) % 180, 30 + (k * 113) % 180, 0), m = { bx: b[0], by: b[1], h: 150 + (k * 37) % 80, sp: 9 + (k * 5) % 10, ph: (k * .37) % 1, k };
        m.el = ctx.el('circle', { cx: f2(b[0]), cy: f2(b[1]), r: 1 + (k % 3) * .35, fill: '#8FE0EF', opacity: 0 }, g); st.motes.push(m);
      }
    },
    update(p, ctx, dt, time){
      const E = ctx.ease, seg = ctx.seg;
      if (p !== st.lastP) {                                                    // scroll-driven bits, only when p changes
        st.lastP = p;
        st.halo.style.opacity = .55 + .45 * seg(p, 0, .1);
        st.racks.forEach(rk => { rk.t = seg(p, rk.s, rk.s + rk.dur); rk.on = seg(rk.t, .7, .95); rk.mv.setAttribute('transform', 'translate(0 ' + (rk.h * (1 - rise(E, rk.t))).toFixed(2) + ')'); });
        st.amp = seg(st.core.t, .75, .92) * (1 - .55 * seg(p, .215, .28));      // amber pulse: peaks as the core lands, then rests at ~45%
        st.ringGate = seg(p, .215, .255);
        st.fgBase = .35 + .6 * seg(p, .06, .22);
        st.moteGate = .35 + .65 * seg(p, .1, .24);
        st.floorFlow.set(.3 + .3 * seg(p, 0, .12));
        st.coreFlow.set(.85 * seg(p, .212, .26));
        [seg(p, .208, .275), seg(p, .222, .295)].forEach((b, k) => { const r = st.rings[3 + k], rx = 18 + 200 * E.out(b); r.setAttribute('rx', rx.toFixed(1)); r.setAttribute('ry', (rx * TAN).toFixed(1)); r.style.opacity = (b > 0 && b < 1) ? .9 * (1 - b) : 0; });
      }
      st.fglow.style.opacity = st.fgBase + .06 * Math.sin(time * 1.3);
      st.racks.forEach((rk, i) => { const t = rk.t; rk.glow.style.opacity = (.15 + .45 * seg(t, .6, 1) + .55 * Math.sin(Math.PI * seg(t, .35, 1))) * (.85 + .15 * Math.sin(time * 1.7 + i)); });
      st.motes.forEach(m => { const u = ((time * m.sp / m.h + m.ph) % 1 + 1) % 1; m.el.setAttribute('cy', (m.by - u * m.h).toFixed(1)); m.el.setAttribute('cx', (m.bx + 5 * Math.sin(time * .7 + m.k)).toFixed(1)); m.el.style.opacity = st.moteGate * .85 * Math.sin(Math.PI * u); });
      st.leds.forEach(L => { L.el.style.opacity = L.rk.on ? L.rk.on * ledPattern(L.mode, time, L.ph) : 0; });
      const amp = st.amp, br = .72 + .28 * Math.sin(time * 2.2);
      st.amberHalo.style.opacity = amp * br;
      const rx = 36 + 50 * amp * (.8 + .2 * br); st.amberHalo.setAttribute('rx', rx.toFixed(1)); st.amberHalo.setAttribute('ry', (rx * .58).toFixed(1));
      st.tile.style.opacity = .5 + .5 * amp * br;
      for (let k = 0; k < 3; k++) { const u = (time * .11 + k / 3) % 1, r = st.rings[k], rr = 24 + 186 * u; r.setAttribute('rx', rr.toFixed(1)); r.setAttribute('ry', (rr * TAN).toFixed(1)); r.style.opacity = st.ringGate * .4 * (1 - u) * Math.min(1, u * 8); }
    }
  });
})();
