/* ==STORY-CH2== chapter "links": glowing cables grow from the farm to three workstations, neuron nodes pulse along them,
   the middle desk projects a rotating 3x3x3 lattice hologram, particle streams run farm -> desks. (RowdyQL scroll story) */
(function () {
  'use strict';
  const CY = '#5CC3D9', CY2 = '#8FE0EF', CYW = '#E9FBFF', TEAL = '#1C6F7F', TEAL2 = '#0E5566', EDGE = '#2B3A37', MUTED = '#93A5A1';
  const FROM = [560, 470], BENDS = [-90, 40, -40];
  const NEU = [[.27, .55, .8], [.3, .52, .77], [.24, .5, .78]];            /* neuron positions along each cable (0..1) */
  const f2 = n => Math.round(n * 100) / 100;
  const pts = arr => arr.map(q => f2(q[0]) + ',' + f2(q[1])).join(' ');
  const ln = (a, b) => 'M' + f2(a[0]) + ',' + f2(a[1]) + 'L' + f2(b[0]) + ',' + f2(b[1]);
  const hash = (a, b, c) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };
  const S = { cables: [], desks: [], holo: null, lastP: -1, lastZf: -1, jn: null };

  /* ---- one workstation: floor plate + halo, two panel legs, slab, keyboard, mouse, monitor on a stand, port ---- */
  function buildDesk(ctx, parent, i) {
    const E = ctx.el, P = ctx.iso.P, o = ctx.anchors.PCS[i];
    const oF = [o[0], o[1] + 35], oS = [o[0], o[1] + 5], oM = [o[0], o[1] - 8.5];
    const g = E('g', { class: 's-ws', opacity: 0 }, parent);
    const fc = P(40, -19, 0, oF);
    E('ellipse', { cx: f2(fc[0]), cy: f2(fc[1]), rx: 88, ry: 42, fill: 'url(#stHalo)', opacity: .55 }, g);
    E('polygon', { points: pts([P(-20, -58, 0, oF), P(100, -58, 0, oF), P(100, 20, 0, oF), P(-20, 20, 0, oF)]), fill: 'rgba(92,195,217,.03)', stroke: EDGE, 'stroke-width': 1 }, g);
    const lp = P(12, 14, 0, oF);
    const label = E('text', { class: 's-mono', 'font-size': 9, fill: MUTED, opacity: .7, transform: 'matrix(.866 .5 -.866 .5 ' + f2(lp[0]) + ' ' + f2(lp[1]) + ')' }, g);
    label.textContent = 'WS-0' + (i + 1) + ' · 10.0.0.' + (11 + i);
    ctx.box(g, oF, -4, -46, 6, 54, 30); ctx.box(g, oF, 82, -46, 6, 54, 30);          /* panel legs */
    const slab = ctx.box(g, oS, -8, -46, 96, 54, 5); slab.querySelector('.s-tp').style.fill = '#142A2C';
    ctx.box(g, o, 30, -22, 34, 12, 2.5);                                                /* keyboard */
    let kd = ''; for (let r = 0; r < 3; r++) { const y = -19.5 + r * 3.5; kd += ln(P(33, y, 2.7, o), P(61, y, 2.7, o)); }
    E('path', { d: kd, stroke: 'rgba(92,195,217,.45)', 'stroke-width': 1, fill: 'none' }, g);
    const mp = P(72, -15, 1.2, o); E('ellipse', { cx: f2(mp[0]), cy: f2(mp[1]), rx: 3.6, ry: 2.4, fill: '#152524', stroke: EDGE, 'stroke-width': 1 }, g);
    ctx.box(g, o, 48, -46, 20, 10, 1.5);                                                /* stand base */
    ctx.box(g, [o[0], o[1] - 1.5], 54, -44, 8, 5, 7);                                   /* neck */
    const sc = P(58, -40, 19.5, oM);
    const mhalo = E('ellipse', { cx: f2(sc[0]), cy: f2(sc[1]), rx: 58, ry: 38, fill: 'url(#stHalo)', opacity: 0 }, g);
    ctx.box(g, oM, 28, -44, 60, 4, 38);                                                 /* monitor slab */
    const sq = pts([P(31, -40, 35, oM), P(85, -40, 35, oM), P(85, -40, 3.5, oM), P(31, -40, 3.5, oM)]);
    E('polygon', { points: sq, fill: '#0B1416', stroke: TEAL, 'stroke-width': .7 }, g);
    const scr = E('g', { opacity: 0 }, g);
    E('polygon', { points: sq, fill: 'url(#stCyan)', opacity: .92, filter: ctx.glow }, scr);
    let bd = ''; [[35, 29, 30], [35, 24.5, 44], [35, 20, 22], [39, 15.5, 34], [35, 11, 16]].forEach(b => { bd += ln(P(b[0], -40, b[1], oM), P(b[0] + b[2], -40, b[1], oM)); });
    E('path', { d: bd, stroke: TEAL2, 'stroke-width': 1.7, 'stroke-linecap': 'round', fill: 'none', opacity: .85 }, scr);
    const port = E('g', { opacity: .35 }, g);                                            /* cable port on the desk top, at the anchor */
    E('circle', { cx: o[0], cy: o[1], r: 13, fill: 'url(#stHalo)' }, port);
    E('circle', { cx: o[0], cy: o[1], r: 4.6, fill: '#0B1416', stroke: CY, 'stroke-width': 1.3 }, port);
    E('circle', { cx: o[0], cy: o[1], r: 1.9, fill: CYW, filter: ctx.glow }, port);
    const flash = E('circle', { cx: 0, cy: 0, r: 5, fill: 'none', stroke: CY2, 'stroke-width': 1.2, opacity: 0, transform: 'translate(' + o[0] + ' ' + o[1] + ')' }, g);
    let puck = null;
    if (i === 1) {                                                                       /* hologram projector puck */
      ctx.box(g, o, 0, -30, 12, 12, 3, 's-lit');
      const pt = P(6, -24, 3.3, o); E('ellipse', { cx: f2(pt[0]), cy: f2(pt[1]), rx: 5, ry: 2.5, fill: 'none', stroke: CYW, 'stroke-width': .9, opacity: .9 }, g);
      puck = [pt[0], pt[1]];
    }
    return { g, scr, mhalo, flash, port, o, puck, lit: 0 };
  }

  /* ---- hologram: light cone from the puck, halo disc, base rings, two rising scan rings, 3x3x3 lattice ---- */
  function buildHolo(ctx, parent, puck) {
    const E = ctx.el, H = ctx.anchors.HOLO, baseY = H[1] + 52;
    const lg = E('linearGradient', { id: 'links-beam', x1: 0, y1: 0, x2: 0, y2: 1 }, ctx.defs);
    E('stop', { offset: 0, 'stop-color': CY, 'stop-opacity': .02 }, lg);
    E('stop', { offset: 1, 'stop-color': CY, 'stop-opacity': .32 }, lg);
    const g = E('g', { class: 's-holo', opacity: 0 }, parent);
    const cone = E('polygon', { points: pts([[puck[0] - 5, puck[1]], [puck[0] + 5, puck[1]], [H[0] + 48, baseY], [H[0] - 48, baseY]]), fill: 'url(#links-beam)', opacity: 0 }, g);
    E('circle', { cx: f2(puck[0]), cy: f2(puck[1]), r: 3, fill: CYW, filter: ctx.glow2 }, g);
    E('circle', { cx: H[0], cy: H[1], r: 66, fill: 'url(#stHalo)', opacity: .9 }, g);
    E('ellipse', { cx: H[0], cy: baseY, rx: 46, ry: 13, fill: 'none', stroke: CY, 'stroke-width': .8, opacity: .5 }, g);
    E('ellipse', { cx: H[0], cy: baseY, rx: 30, ry: 8.5, fill: 'none', stroke: CY, 'stroke-width': .6, opacity: .3 }, g);
    const rings = [0, 1].map(() => E('ellipse', { cx: H[0], cy: baseY, rx: 10, ry: 3, fill: 'none', stroke: CY2, 'stroke-width': .8, opacity: 0 }, g));
    const lat = E('g', { filter: ctx.glow }, g);
    const lines = [0, 1, 2].map(k => E('path', { d: '', fill: 'none', stroke: CY, 'stroke-width': 1, opacity: k === 2 ? .78 : .65 }, lat));
    const dots = []; for (let n = 0; n < 27; n++) dots.push(E('circle', { r: 2, fill: n === 13 ? CYW : CY2 }, lat));
    dots[13].setAttribute('filter', ctx.glow2);
    return { g, cone, rings, lat, lines, dots, puck, baseY, H, h: 0, vis: 0 };
  }
  const idx = (i, j, k) => (i + 1) * 9 + (j + 1) * 3 + (k + 1);
  function projectLattice(ctx, time, bob) {
    const Hh = S.holo, o = [Hh.H[0], Hh.H[1] + bob], sp = 26, a = time * .42, ca = Math.cos(a), sa = Math.sin(a);
    const pos = new Array(27); let n = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const x = i * sp, y = j * sp, xr = x * ca - y * sa, yr = x * sa + y * ca;
      const q = ctx.iso.P(xr, yr, k * sp, o); pos[n] = q;
      const w = ctx.clamp(((xr + yr) / (2 * sp) + 1) / 2);                              /* depth: 1 = nearest */
      const c = Hh.dots[n]; c.setAttribute('cx', f2(q[0])); c.setAttribute('cy', f2(q[1]));
      c.setAttribute('r', n === 13 ? 3.8 : f2(1.8 + 1.3 * w)); c.style.opacity = n === 13 ? 1 : .35 + .65 * w;
      n++;
    }
    const d = ['', '', ''];
    for (let u = -1; u <= 1; u++) for (let v = -1; v <= 1; v++) {
      d[0] += ln(pos[idx(-1, u, v)], pos[idx(1, u, v)]); d[1] += ln(pos[idx(u, -1, v)], pos[idx(u, 1, v)]); d[2] += ln(pos[idx(u, v, -1)], pos[idx(u, v, 1)]);
    }
    for (let k = 0; k < 3; k++) Hh.lines[k].setAttribute('d', d[k]);
  }

  STORY.register({
    id: 'links', layer: 'cables', range: [0.18, 0.48],
    captions: [{ at: [0.215, 0.445], he: 'השרתים לא עובדים לבד. כבלים, רשתות ומחשבים מדברים איתם כל הזמן.', en: 'Servers never work alone. Cables, networks and computers talk to them all the time.' }],

    build(ctx, g) {
      const E = ctx.el, A = ctx.anchors;
      /* junction at the farm's right edge, where the three cables leave */
      const jn = E('g', { opacity: 0 }, g);
      E('circle', { cx: FROM[0], cy: FROM[1], r: 16, fill: 'url(#stHalo)' }, jn);
      E('circle', { cx: FROM[0], cy: FROM[1], r: 5, fill: '#0B1416', stroke: CY, 'stroke-width': 1.5 }, jn);
      S.jn = { g: jn, dot: E('circle', { cx: FROM[0], cy: FROM[1], r: 2.2, fill: CYW, filter: ctx.glow }, jn) };
      /* cables + neurons */
      for (let i = 0; i < 3; i++) {
        const d = ctx.curve(FROM, A.PCS[i], BENDS[i]);
        const under = E('path', { d, fill: 'none', stroke: CY, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .16, filter: ctx.glow2 }, g);
        const main = E('path', { d, class: 's-cable', filter: ctx.glow }, g);
        const C = { under, main, len: main.getTotalLength(), t: -1, neurons: [] };
        C.tip = E('circle', { cx: FROM[0], cy: FROM[1], r: 4, fill: CYW, filter: ctx.glow2, opacity: 0 }, g);
        C.flow = ctx.flow(ctx.sample(main, 48), { color: '#DFF6FA', count: 16, speed: 150, size: 2.4, tail: 18 });
        NEU[i].forEach((f, k) => {
          const q = main.getPointAtLength(C.len * f), q2 = main.getPointAtLength(C.len * (f + .01));
          let tx = q2.x - q.x, ty = q2.y - q.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const nx = -ty, ny = tx;
          const N = { f, x: f2(q.x), y: f2(q.y), ph: hash(i, k, 1) * 6.283, sc: 0 };
          N.g = E('g', { class: 's-neu', opacity: 0, transform: 'translate(' + N.x + ' ' + N.y + ') scale(0)' }, g);
          N.halo = E('circle', { r: 13, fill: 'url(#stHalo)' }, N.g);
          let dd = ''; const tips = [];
          for (let b = 0; b < 3; b++) {                                                   /* dendrites: short curved branches */
            const side = b === 1 ? -1 : 1, ang = (hash(i, k, b + 2) - .5) * 1.3 + (b === 2 ? .9 : 0), len = 13 + hash(i, k, b + 7) * 10;
            const dx = side * (nx * Math.cos(ang) - ny * Math.sin(ang)), dy = side * (nx * Math.sin(ang) + ny * Math.cos(ang));
            const bendv = (hash(i, k, b + 11) - .5) * .6 * len, ex = dx * len, ey = dy * len;
            dd += 'M0,0Q' + f2(dx * len * .5 - dy * bendv) + ',' + f2(dy * len * .5 + dx * bendv) + ' ' + f2(ex) + ',' + f2(ey);
            tips.push([ex, ey]);
          }
          N.dend = E('g', null, N.g);                                                     /* dendrites + tips: faded during the finale zoom, the core stays */
          E('path', { d: dd, fill: 'none', stroke: CY, 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: .8 }, N.dend);
          tips.forEach(t => E('circle', { cx: f2(t[0]), cy: f2(t[1]), r: 1.7, fill: CY, opacity: .9 }, N.dend));
          N.core = E('circle', { r: 3.6, fill: CY2, filter: ctx.glow }, N.g);
          C.neurons.push(N);
        });
        S.cables.push(C);
      }
      /* workstations + hologram live in the pcs layer (drawn over the cables) */
      const pcs = E('g', { class: 's-links-pcs' }, ctx.layer('pcs'));
      for (let i = 0; i < 3; i++) S.desks.push(buildDesk(ctx, pcs, i));
      S.holo = buildHolo(ctx, pcs, S.desks[1].puck);
      projectLattice(ctx, 0, 0);
    },

    update(p, ctx, dt, time) {
      const seg = ctx.seg, ease = ctx.ease, clamp = ctx.clamp, lerp = ctx.lerp, H = S.holo;
      const L = seg(p, .18, .48), zf = seg(p, .72, .88), zq = seg(p, .72, .80), holoFade = 1 - seg(p, .70, .82);   /* zf: finale zoom; zq: the quick cut for streams that run under the client screen */
      if (p !== S.lastP) {                                                                 /* ---- scroll-driven ---- */
        S.lastP = p;
        S.jn.g.style.opacity = seg(L, 0, .06);
        for (let i = 0; i < 3; i++) {
          const C = S.cables[i], D = S.desks[i], st = .04 + .14 * i, en = st + .30;
          const t = ease.inOut(seg(L, st, en));
          if (t !== C.t) {
            C.t = t; ctx.drawIn(C.under, t); ctx.drawIn(C.main, t);
            if (t > 0 && t < 1) { const q = C.main.getPointAtLength(C.len * t); C.tip.setAttribute('cx', f2(q.x)); C.tip.setAttribute('cy', f2(q.y)); C.tip.style.opacity = 1; }
            else C.tip.style.opacity = 0;
            C.neurons.forEach(N => { const nt = seg(t, N.f - .03, N.f + .05); N.sc = nt > 0 ? ease.outBack(nt) : 0; N.g.style.opacity = clamp(nt * 1.6); });
          }
          const r = seg(L, en - .16, en - .02), dim = i === 1 ? 1 - .75 * zf : 1 - .4 * zf;
          D.g.setAttribute('transform', 'translate(0 ' + f2(46 * (1 - ease.outBack(r))) + ')');
          D.g.style.opacity = clamp(r * 1.8) * dim;
          const lt = seg(L, en, en + .07); D.lit = lt;
          D.scr.style.opacity = lt;
          D.port.style.opacity = .35 + .65 * lt;
          D.flash.setAttribute('transform', 'translate(' + D.o[0] + ' ' + D.o[1] + ') scale(' + f2(1 + 2.4 * lt) + ')');
          D.flash.style.opacity = lt > 0 && lt < 1 ? 1 - lt : 0;
          C.flow.set(seg(L, en, en + .2) * (i === 0 ? 1 - .7 * zf : 1 - zq));   /* cables 1+2 end under/along the client screen: cut their streams as soon as it appears; cable 0 passes above it and keeps a faint stream */
        }
        if (zf !== S.lastZf) {                                                             /* finale zoom: quiet the links so the client screen owns the frame */
          S.lastZf = zf;
          S.cables.forEach(C => C.neurons.forEach(N => { N.dend.style.opacity = 1 - .5 * zf; }));
          S.cables[2].main.style.opacity = .85 * (1 - .7 * zf);                            /* cable 2 runs along the screen's top edge: nothing bright may poke out */
        }
        const h = seg(L, .62, .86), s = Math.max(.001, ease.outBack(h)); H.h = h;
        H.vis = .55 * clamp(h * 1.6) * holoFade; H.g.style.opacity = H.vis;
        H.lat.setAttribute('transform', 'translate(' + H.H[0] + ' ' + H.H[1] + ') scale(' + f2(s) + ') translate(' + (-H.H[0]) + ' ' + (-H.H[1]) + ')');
        H.cone.style.opacity = h;
      }
      /* ---- time-driven ---- */
      S.jn.dot.setAttribute('r', f2(2.2 + .5 * Math.sin(time * 4)));
      for (let i = 0; i < 3; i++) {
        const C = S.cables[i], D = S.desks[i];
        C.under.style.opacity = (.14 + .05 * Math.sin(time * 1.7 + i * 2.1)) * (i === 2 ? 1 - zf : 1);
        C.neurons.forEach(N => { if (N.sc <= 0) return; const w = Math.sin(time * 3 + N.ph); N.g.setAttribute('transform', 'translate(' + N.x + ' ' + N.y + ') scale(' + f2(N.sc * (1 + .12 * w) * (1 - .35 * zf)) + ')'); N.halo.style.opacity = (.55 + .4 * w) * (1 - .3 * zf); });
        if (D.lit > 0) D.mhalo.style.opacity = D.lit * (.72 + .18 * Math.sin(time * 1.3 + i * 2));
      }
      if (H.vis > 0) {
        projectLattice(ctx, time, 3 * Math.sin(time * .9));
        H.rings.forEach((rg, k) => { const f = (time * .26 + k * .5) % 1; rg.setAttribute('cx', f2(lerp(H.puck[0], H.H[0], f))); rg.setAttribute('cy', f2(lerp(H.puck[1], H.baseY, f))); rg.setAttribute('rx', f2(lerp(6, 46, f))); rg.setAttribute('ry', f2(lerp(2, 13, f))); rg.style.opacity = .5 * Math.sin(Math.PI * f) * H.h; });
      }
    }
  });
})();
/* ==/STORY-CH2== */
