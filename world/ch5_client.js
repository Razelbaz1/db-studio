/* ch5_client.js — RowdyQL scroll story · chapter "client" (p 0.68 – 1.00)
   The last cable leaves the farm, sweeps under the desks and lands on a small client dock. A screen unfolds above the
   dock (flat, camera-facing for legibility), the query types itself, a result table prints the welcome sentence
   row by row, and particles keep streaming along the cable into the screen. All coordinates are stage px. */
(function () {
  'use strict';
  const S = {};
  const QUERY = [['SELECT', 's-cyan'], [' * ', 's-ink'], ['FROM', 's-cyan'], [' Students ', 's-ink'], ['WHERE', 's-cyan'], [' ready = ', 's-ink'], ['1', 's-amber'], [';', 's-muted']];
  const QLEN = QUERY.reduce((n, t) => n + t[0].length, 0);
  const PROMPT = 'rowdyql> ';
  const TXT = {
    he: ['ברוכים הבאים לעולם של מסדי הנתונים.', 'מכאן זה רק נהיה מעניין.'],
    en: ['Welcome to the world of databases.', 'From here it only gets interesting.']
  };
  /* screen panel */
  const PX = 800, PY = 400, PW = 520, PH = 300, PR = PX + PW, PB = PY + PH, CX = 1060, CY = PY + PH / 2;
  const TX = PX + 22, TW = PW - 44, TY = PY + 92;          /* result table */
  const O = [1060, 741], O2 = [1060, 737];                  /* floor pad origin; dock/keyboard origin (on the pad top) */
  const START = [560, 500];
  const f1 = n => Math.round(n * 10) / 10;
  const hash = (a, b, c) => { const v = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453; return v - Math.floor(v); };

  STORY.register({
    id: 'client', layer: 'client', range: [0.68, 1],
    captions: [{ at: [0.87, 0.93], he: '…והתשובה חוזרת אליכם, למסך שלכם.', en: '…and the answer comes back to you, on your screen.' }],

    build(ctx, g) {
      const el = ctx.el, P = (x, y, z, o) => ctx.iso.P(x, y, z, o || O2);
      S.g = g;
      const LAND = S.LAND = P(-32, 32, 5);                 /* left corner of the dock, mid height */

      /* defs: faint scanlines for the screen */
      const pat = el('pattern', { id: 'client-scan', width: 4, height: 4, patternUnits: 'userSpaceOnUse' }, ctx.defs);
      el('rect', { width: 4, height: 1, fill: '#5CC3D9', opacity: .07 }, pat);
      /* vertical gradient for the execute scan band (a filtered <line> has a zero-height bbox, so no filter there) */
      const sg = el('linearGradient', { id: 'client-sweep', x1: 0, y1: 0, x2: 0, y2: 1 }, ctx.defs);
      [[0, 0], [.5, .85], [1, 0]].forEach(s => el('stop', { offset: s[0], 'stop-color': '#8FE0EF', 'stop-opacity': s[1] }, sg));

      /* ---------- the cable (cables layer, under the desks) ---------- */
      const cg = el('g', { class: 's-client-cable' }, ctx.layer('cables'));
      const d = ctx.curve(START, LAND, 120);
      S.cabGlow = el('path', { d, class: 's-cable', style: 'stroke-width:7;opacity:.22', filter: ctx.glow2 }, cg);
      S.cab = el('path', { d, class: 's-cable', filter: ctx.glow }, cg);
      const L = S.cab.getTotalLength();
      /* neurons: the same species as ch2's — a soft halo, three curved dendrites off the cable's normal with tip dots,
         a glowing core; each sits in a <g> that pops (outBack) when the cable tip passes and breathes with time */
      S.neu = [.3, .56, .8].map((f, k) => {
        const q = S.cab.getPointAtLength(L * f), q2 = S.cab.getPointAtLength(L * (f + .01));
        let tx = q2.x - q.x, ty = q2.y - q.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; const nx = -ty, ny = tx;
        const N = { f, x: f1(q.x), y: f1(q.y), ph: hash(5, k, 1) * 6.283, sc: 0 };
        N.g = el('g', { class: 's-neu', style: 'opacity:0', transform: 'translate(' + N.x + ' ' + N.y + ') scale(0)' }, cg);
        N.halo = el('circle', { r: 13, fill: 'url(#stHalo)' }, N.g);
        let dd = ''; const tips = [];
        for (let b = 0; b < 3; b++) {
          const side = b === 1 ? -1 : 1, ang = (hash(5, k, b + 2) - .5) * 1.3 + (b === 2 ? .9 : 0), len = 13 + hash(5, k, b + 7) * 10;
          const dx = side * (nx * Math.cos(ang) - ny * Math.sin(ang)), dy = side * (nx * Math.sin(ang) + ny * Math.cos(ang));
          const bendv = (hash(5, k, b + 11) - .5) * .6 * len, ex = dx * len, ey = dy * len;
          dd += 'M0,0Q' + f1(dx * len * .5 - dy * bendv) + ',' + f1(dy * len * .5 + dx * bendv) + ' ' + f1(ex) + ',' + f1(ey);
          tips.push([ex, ey]);
        }
        el('path', { d: dd, fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: .8 }, N.g);
        tips.forEach(t => el('circle', { cx: f1(t[0]), cy: f1(t[1]), r: 1.7, fill: '#5CC3D9', opacity: .9 }, N.g));
        N.core = el('circle', { r: 3.6, fill: '#8FE0EF', filter: ctx.glow }, N.g);
        return N;
      });
      const pts = ctx.sample(S.cab, 60);
      /* particle stream: along the cable, across the dock, up the neck into the screen */
      S.flow = ctx.flow(pts.concat([[CX, O2[1] - 10], [CX, PB], [CX, PB - 16]]), { color: '#5CC3D9', speed: 175, count: 18, size: 2.2, tail: 22 });

      /* ---------- client layer ---------- */
      S.halo = el('ellipse', { cx: CX, cy: CY + 10, rx: 400, ry: 250, fill: 'url(#stHalo)', style: 'opacity:0' }, g);
      S.floor = el('ellipse', { cx: O[0], cy: O[1] + 4, rx: 150, ry: 54, fill: 'url(#stHalo)', style: 'opacity:0' }, g);
      ctx.box(g, O, -100, -52, 200, 104, 4);                                        /* floor pad */
      const pp = [[-100, -52], [100, -52], [100, 52], [-100, 52]].map(q => ctx.iso.P(q[0], q[1], 4, O));
      S.padEdge = el('polygon', { points: pp.map(q => f1(q[0]) + ',' + f1(q[1])).join(' '), fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1, filter: ctx.glow, style: 'opacity:0' }, g);
      /* tail of the cable, drawn on top of the pad */
      S.tailFrom = 48 / 60;
      S.tail = el('path', { d: 'M' + pts.slice(48).map(q => f1(q[0]) + ',' + f1(q[1])).join(' L'), class: 's-cable', filter: ctx.glow }, g);
      S.port = el('circle', { cx: f1(LAND[0]), cy: f1(LAND[1]), r: 4, fill: '#8FE0EF', filter: ctx.glow, style: 'opacity:0' }, g);
      S.burst = el('circle', { cx: f1(LAND[0]), cy: f1(LAND[1]), r: 4, fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.5, style: 'opacity:0' }, g);
      ctx.box(g, O2, -32, -32, 64, 64, 10);                                         /* dock, dark */
      S.dockLit = ctx.box(g, O2, -32, -32, 64, 64, 10, 's-lit'); S.dockLit.style.opacity = 0;
      /* two LEDs on the dock's front-right face (like the farm racks): cyan + amber */
      S.led = [['#5CC3D9', 8], ['#E8A33A', 16]].map(c => { const q = P(32, -32 + c[1], 5); return el('circle', { cx: f1(q[0]), cy: f1(q[1]), r: 1.6, fill: c[0], filter: ctx.glow, style: 'opacity:0' }, g); });
      const top = P(0, 0, 10);
      S.ring = el('ellipse', { cx: top[0], cy: top[1], rx: 17, ry: 8.5, fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.2, filter: ctx.glow, style: 'opacity:0' }, g);
      S.core = el('ellipse', { cx: top[0], cy: top[1], rx: 7, ry: 3.5, fill: '#8FE0EF', filter: ctx.glow, style: 'opacity:0' }, g);
      /* keyboard slab in front of the dock */
      const kb = ctx.box(g, O2, 8, 38, 64, 28, 4);
      for (let k = 0; k < 3; k++) { const a = P(12, 43 + k * 8, 4), b = P(68, 43 + k * 8, 4); el('line', { x1: f1(a[0]), y1: f1(a[1]), x2: f1(b[0]), y2: f1(b[1]), stroke: '#2B3A37', 'stroke-width': 1.2 }, kb); }
      /* neck + mount under the panel */
      S.neck = el('rect', { x: CX - 8, y: PB + 4, width: 16, height: top[1] - PB - 4, fill: '#152524', stroke: '#2B3A37', style: 'opacity:0' }, g);
      S.neckLit = el('rect', { x: CX - 1.5, y: PB + 4, width: 3, height: top[1] - PB - 6, fill: '#5CC3D9', filter: ctx.glow, style: 'opacity:0' }, g);
      S.mount = el('rect', { x: CX - 22, y: PB + 2, width: 44, height: 10, rx: 3, fill: '#152524', stroke: '#2B3A37', style: 'opacity:0' }, g);

      /* ---------- the screen (unfolds from its bottom edge) ---------- */
      const SG = S.SG = el('g', { style: 'opacity:0' }, g);
      el('rect', { x: PX + 10, y: PY + 16, width: PW, height: PH, rx: 10, fill: '#050809', opacity: .6, filter: 'url(#stBlur)' }, SG);
      el('rect', { x: PX - 6, y: PY - 6, width: PW + 12, height: PH + 12, rx: 10, fill: '#0B1416', stroke: '#2B3A37' }, SG);
      S.flash = el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 6, fill: 'none', stroke: '#8FE0EF', 'stroke-width': 2.5, filter: ctx.glow2, style: 'opacity:0' }, SG);
      el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 6, fill: '#0F1B1D', stroke: '#5CC3D9', 'stroke-width': 1 }, SG);
      el('rect', { x: PX + 1, y: PY + 1, width: PW - 2, height: PH - 2, rx: 5, fill: 'url(#client-scan)' }, SG);
      /* title bar */
      el('path', { d: 'M' + PX + ',' + (PY + 6) + ' a6,6 0 0 1 6,-6 H' + (PR - 6) + ' a6,6 0 0 1 6,6 V' + (PY + 26) + ' H' + PX + ' Z', fill: '#132325' }, SG);
      el('line', { x1: PX, y1: PY + 26.5, x2: PR, y2: PY + 26.5, stroke: '#2B3A37' }, SG);
      S.live = el('circle', { cx: PX + 14, cy: PY + 13, r: 3.5, fill: '#E8A33A', filter: ctx.glow }, SG);
      el('text', { x: PX + 25, y: PY + 17.5, class: 's-mono s-muted', 'font-size': 12.5 }, SG).textContent = 'rowdyql · live';
      [0, 1, 2].forEach(i => el('circle', { cx: PR - 14 - i * 13, cy: PY + 13, r: 3, fill: '#93A5A1', opacity: .4 }, SG));
      /* prompt 1: the query types itself */
      S.q = el('text', { x: TX, y: PY + 64, class: 's-mono', 'font-size': 15, style: 'white-space:pre;opacity:0' }, SG);
      el('tspan', { class: 's-muted' }, S.q).textContent = PROMPT;
      S.tok = QUERY.map(t => el('tspan', { class: t[1] }, S.q));
      S.cur = el('rect', { x: TX, y: PY + 50, width: 8, height: 18, fill: '#5CC3D9', style: 'opacity:0' }, SG);
      S.sweep = el('rect', { x: PX + 2, y: PY + 66, width: PW - 4, height: 24, fill: 'url(#client-sweep)', style: 'opacity:0' }, SG);
      /* result table */
      S.hdr = el('g', { style: 'opacity:0' }, SG);
      el('rect', { x: TX, y: TY, width: TW, height: 26, fill: 'rgba(92,195,217,.10)', stroke: '#2B3A37' }, S.hdr);
      el('text', { x: CX, y: TY + 18, class: 's-mono s-cyan', 'font-size': 13, 'text-anchor': 'middle' }, S.hdr).textContent = 'result';
      S.body = el('rect', { x: TX, y: TY + 26, width: TW, height: 62, fill: 'rgba(255,255,255,.02)', stroke: '#2B3A37', style: 'opacity:0' }, SG);
      S.line = [0, 1].map(i => el('text', { y: TY + 26 + 25 + i * 25, class: 's-text s-ink', 'font-size': 17, style: 'opacity:0' }, SG));
      S.cnt = el('text', { x: TX, y: TY + 110, class: 's-mono s-muted', 'font-size': 13, style: 'opacity:0' }, SG); S.cnt.textContent = '(1 row)';
      S.q2 = el('text', { x: TX, y: TY + 146, class: 's-mono s-muted', 'font-size': 15, style: 'white-space:pre;opacity:0' }, SG); S.q2.textContent = PROMPT;
      /* footer strip */
      S.foot = el('g', { style: 'opacity:0' }, SG);
      el('line', { x1: PX, y1: PB - 24, x2: PR, y2: PB - 24, stroke: '#2B3A37' }, S.foot);
      el('text', { x: TX, y: PB - 8, class: 's-mono s-muted', 'font-size': 11 }, S.foot).textContent = 'connected · rowdyql.com';
      S.footR = el('text', { x: PR - 22, y: PB - 8, class: 's-mono s-muted', 'font-size': 11, 'text-anchor': 'end', style: 'opacity:0' }, SG); S.footR.textContent = 'Students · 1 row · 12 ms';

      /* ignition line: the bright seam the screen unfolds from (outside SG so the non-uniform scale does not squash it) */
      S.igniteGlow = el('rect', { x: CX, y: PB - 14, width: 0, height: 28, fill: 'url(#client-sweep)', style: 'opacity:0' }, g);
      S.ignite = el('rect', { x: CX, y: PB - 1, width: 0, height: 2, rx: 1, fill: '#BFF0F8', style: 'opacity:0' }, g);

      /* ---------- settle effects: ring pulse + drifting sparks ---------- */
      S.pulse = el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 8, fill: 'none', stroke: '#5CC3D9', 'stroke-width': 1.5, style: 'opacity:0' }, g);
      S.sparkG = el('g', { style: 'opacity:0' }, g);
      S.spark = [[782, 22, 40], [771, 27, 130], [790, 19, 200], [1338, 24, 70], [1350, 20, 160], [1330, 28, 10], [1180, 17, 100]].map(s =>
        ({ el: el('circle', { cx: s[0], cy: 700, r: 1.4 + (s[1] % 3) * .5, fill: '#8FE0EF', filter: ctx.glow }, S.sparkG), v: s[1], off: s[2] }));
      S.last = -1; S.n = -1; S.curLine = -1; S.lang = null; S.measureAt = -1;
    },

    update(p, ctx, dt, time) {
      const seg = ctx.seg, E = ctx.ease, l = seg(p, .68, 1);

      /* ---- scroll-driven (skipped when p did not change) ---- */
      if (l !== S.last) {
        S.last = l;
        /* the client is absent until its chapter starts; the pad materialises while the cable is on its way */
        S.g.style.opacity = l <= 0 ? 0 : E.out(seg(l, .02, .18));
        const cab = E.inOut(seg(l, 0, .30));
        ctx.drawIn(S.cab, cab); ctx.drawIn(S.cabGlow, cab); ctx.drawIn(S.tail, seg(cab, S.tailFrom, 1));
        S.neu.forEach(N => { const nt = seg(cab, N.f - .03, N.f + .05); N.sc = nt > 0 ? E.outBack(nt) : 0; N.g.style.opacity = ctx.clamp(nt * 1.6); });
        const land = seg(l, .29, .38);
        ctx.show(S.port, seg(l, .28, .31));
        S.burst.setAttribute('r', f1(4 + 46 * E.out(land))); ctx.show(S.burst, land > 0 && land < 1 ? .8 * (1 - land) : 0);
        const lit = seg(l, .30, .40);
        ctx.show(S.dockLit, lit * .8); ctx.show(S.ring, lit); ctx.show(S.core, lit); ctx.show(S.floor, lit * .9); ctx.show(S.padEdge, lit * .45); S.lit = lit;
        ctx.show(S.neckLit, seg(l, .33, .45));
        S.flow.set(seg(l, .30, .50) * (1 - .3 * seg(l, .9, 1)));
        /* panel: a bright line first, then it opens upward */
        const a = E.out(seg(l, .31, .36)), b = E.outBack(seg(l, .35, .44));
        const sx = Math.max(.002, a), sy = Math.max(.004, .02 + .98 * b);
        S.SG.setAttribute('transform', 'translate(' + CX + ' ' + PB + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(' + (-CX) + ' ' + (-PB) + ')');
        ctx.show(S.SG, seg(l, .31, .33));
        const iw = f1(PW * a), io = a * (1 - E.out(b));
        [S.ignite, S.igniteGlow].forEach(r => { r.setAttribute('x', f1(CX - iw / 2)); r.setAttribute('width', iw); });
        S.ignite.style.opacity = io; S.igniteGlow.style.opacity = io * .9;
        ctx.show(S.neck, seg(l, .31, .35)); ctx.show(S.mount, seg(l, .31, .35));
        ctx.show(S.halo, .95 * E.out(seg(l, .34, .58)));
        /* border glow: bright while the panel is still a line, dims as it opens, one last flash when fully open */
        const fl = seg(l, .40, .48); S.flash.style.opacity = Math.max(a * (1 - b), (fl > 0 && fl < 1) ? Math.sin(fl * Math.PI) * .9 : 0);
        /* typing */
        ctx.show(S.q, seg(l, .43, .46)); ctx.show(S.foot, seg(l, .44, .48));
        const n = Math.round(QLEN * seg(l, .46, .62));
        if (n !== S.n) { S.n = n; let off = 0; S.tok.forEach((ts, i) => { const t = QUERY[i][0], k = Math.max(0, Math.min(t.length, n - off)); ts.textContent = t.slice(0, k); off += t.length; }); S.measureAt = -1; }
        /* cursor: 0 hidden, 1 blinking, 2 solid (while typing) */
        S.curMode = l < .43 ? 0 : l < .63 ? (n < QLEN && l >= .46 ? 2 : 1) : l < .89 ? 0 : 1;
        const line = l < .63 ? 0 : 1; if (line !== S.curLine) { S.curLine = line; S.cur.setAttribute('y', line ? TY + 132 : PY + 50); S.measureAt = -1; }
        /* execute: a sweep down the screen */
        const sw = seg(l, .63, .69);
        S.sweep.setAttribute('transform', 'translate(0 ' + f1((PB - 50 - (PY + 78)) * E.inOut(sw)) + ')');
        S.sweep.style.opacity = (sw > 0 && sw < 1) ? Math.sin(sw * Math.PI) * .6 : 0;
        /* rows print one by one */
        const rev = (node, t) => { const e = E.out(t); node.style.opacity = e; node.setAttribute('transform', 'translate(0 ' + f1((1 - e) * 8) + ')'); };
        rev(S.hdr, seg(l, .68, .72)); rev(S.body, seg(l, .72, .76)); rev(S.line[0], seg(l, .73, .78)); rev(S.line[1], seg(l, .78, .83));
        rev(S.cnt, seg(l, .84, .88)); rev(S.q2, seg(l, .89, .92)); ctx.show(S.footR, seg(l, .85, .89));
        /* settle: ring pulse + sparks */
        const pu = seg(l, .87, .97), k = 1 + .14 * E.out(pu);
        S.pulse.setAttribute('transform', 'translate(' + CX + ' ' + CY + ') scale(' + k.toFixed(3) + ') translate(' + (-CX) + ' ' + (-CY) + ')');
        S.pulse.style.opacity = (pu > 0 && pu < 1) ? .7 * (1 - pu) : 0;
        S.sparkOn = seg(l, .88, 1); S.sparkG.style.opacity = S.sparkOn;
      }

      /* ---- language (the sentence row) ---- */
      const lang = ctx.lang();
      if (lang !== S.lang) {
        S.lang = lang; const rtl = lang === 'he';
        /* SVG: with direction=rtl, text-anchor=start puts the RIGHT side of the text at x, so the row hugs the cell's right edge */
        S.line.forEach((t, i) => { t.textContent = TXT[lang][i]; t.setAttribute('x', rtl ? TX + TW - 12 : TX + 12); t.setAttribute('text-anchor', 'start'); t.setAttribute('direction', rtl ? 'rtl' : 'ltr'); });
      }

      /* ---- time-driven bits ---- */
      if (S.curMode) {
        const tick = Math.floor(time * 2);
        if (S.measureAt !== tick) { S.measureAt = tick; const src = S.curLine ? S.q2 : S.q; S.cur.setAttribute('x', f1(TX + src.getComputedTextLength() + 2)); }
        S.cur.style.opacity = S.curMode === 2 || (time % 1.1) < .62 ? 1 : 0;
      } else S.cur.style.opacity = 0;
      if (S.last > 0) {
        S.live.style.opacity = .55 + .45 * Math.sin(time * 4);
        S.led[0].style.opacity = S.lit * (Math.sin(time * 6) > -.2 ? 1 : .3); S.led[1].style.opacity = S.lit * (Math.sin(time * 1.7 + 1) > .6 ? 1 : .25);
        S.neu.forEach(N => { if (N.sc <= 0) return; const w = Math.sin(time * 3 + N.ph); N.g.setAttribute('transform', 'translate(' + N.x + ' ' + N.y + ') scale(' + f1(N.sc * (1 + .12 * w)) + ')'); N.halo.style.opacity = .55 + .4 * w; });
        S.core.setAttribute('rx', f1(7 + 1.5 * Math.sin(time * 5))); S.core.setAttribute('ry', f1(3.5 + .75 * Math.sin(time * 5)));
        if (S.sparkOn > 0) S.spark.forEach(s => { const u = ((time * s.v + s.off) % 230) / 230; s.el.setAttribute('cy', f1(720 - u * 230)); s.el.style.opacity = Math.sin(u * Math.PI) * .9; });
      }
    }
  });
})();
