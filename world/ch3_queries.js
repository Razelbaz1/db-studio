/* ch3_queries.js — RowdyQL scroll story · chapter "queries" (layer: queries, p 0.42–0.70)
   Query boxes float up from the three workstations and type themselves, then compress into glowing operator chips
   (σ ⋈ γ) that ride the cables to the server farm. Above the farm a holographic TABLE OPS panel runs the three
   operations on two mini tables: σ dims the rows that fail the filter, ⋈ draws lines between matching rows,
   γ collapses the matched rows into three counted bars and ORDER BY re-sorts them. Result rows then flow back up
   the cables into a small result card above each workstation. Everything is one STORY.register call; no globals. */
(function () {
  'use strict';
  const RANGE = [0.42, 0.70];
  const CY = '#5CC3D9', CYL = '#8FE0EF', WHT = '#CFF5FC', TEAL2 = '#2F97AD', INK = '#E6EEEC', MUT = '#93A5A1', AMB = '#E8A33A', DARK = '#0F1B1D', GND = '#0B1416';
  const PORT = [560, 470];                                   // where the cables leave the farm (ch2's cable origin)
  const PN = { x: 190, y: 170, w: 365, h: 128 };             // panel frame (above the farm, below the ETL band)
  const TB = { rx: 200, sx: 336, ox: 442, w: 86, y0: 214, pitch: 9, rh: 6, labelY: 201, headY: 205, rp: 13 };
  const RIDES_W = [72, 58, 80, 64, 50, 76, 62, 84], ST_W = [60, 78, 52, 70, 66];
  const LIT = [0, 2, 3, 5, 7];                               // Rides rows that pass the σ filter
  const MATCH = { 0: 1, 2: 3, 3: 1, 5: 0, 7: 3 };            // Rides row → Stations row (⋈)
  const GROUPS = [{ st: 0, rows: [5], slot: 2 }, { st: 1, rows: [0, 3], slot: 0 }, { st: 3, rows: [2, 7], slot: 1 }]; // γ groups in station order; slot = place after ORDER BY 2 DESC
  const CARD = { w: 118, h: 46, bars: [88, 62, 74] };
  const CHW = 7.4;                                           // forced mono char width (textLength)
  const QUERIES = [
    { sym: 'σ', hover: [728, 272], join: .74, bend: -90, n: 44, toks: [['SELECT', 'k'], [' name ', 'i'], ['FROM', 'k'], [' Riders ', 'i'], ['WHERE', 'k'], [' city = ', 'i'], ["'Haifa'", 's']] },
    { sym: '⋈', hover: [935, 490], join: .80, bend: 40, n: 54, toks: [['SELECT', 'k'], [' s.name, ', 'i'], ['COUNT', 'k'], ['(*) ', 'i'], ['FROM', 'k'], [' Rides r ', 'i'], ['JOIN', 'k'], [' Stations s …', 'i']] },
    { sym: 'γ', hover: [1115, 326], join: .85, bend: -40, n: 33, toks: [['… ', 'i'], ['GROUP BY', 'k'], [' s.name ', 'i'], ['ORDER BY', 'k'], [' 2 ', 'i'], ['DESC', 'k']] }
  ];
  /* per-query timeline (local progress): rise R0..R1, type T0..T1, travel V0..V1 (arrival = V1) */
  const TL = QUERIES.map((q, i) => { const R0 = .04 + i * .05, V0 = .33 + i * .04; return { R0, R1: R0 + .10, T0: R0 + .04, T1: R0 + .16, V0, V1: V0 + .13 }; });   // all three finish typing (.30) and hover together before any leaves (.33)
  const OPS = [[.46, .52], [.53, .59], [.60, .68]];   // σ, ⋈, γ one after another, no overlap         // σ, ⋈, γ windows on the panel

  const S = {};
  let seed = 17;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const f1 = n => Math.round(n * 10) / 10;
  const setA = (e, k, v) => { const c = e._qa || (e._qa = {}); if (c[k] !== v) { c[k] = v; e.setAttribute(k, v); } };
  const setS = (e, k, v) => { const c = e._qs || (e._qs = {}); if (c[k] !== v) { c[k] = v; e.style[k] = v; } };
  const setO = (e, v) => setS(e, 'opacity', Math.round(Math.max(0, Math.min(1, v)) * 200) / 200);
  const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
  const pulse = (t, k) => (t <= 0 || t >= 1) ? 0 : (t < k ? t / k : 1 - (t - k) / (1 - k));
  const tr = (x, y, s) => 'translate(' + f1(x) + ' ' + f1(y) + ')' + (s != null && s !== 1 ? ' scale(' + (Math.round(s * 1000) / 1000) + ')' : '');
  const rr = (x, y, w, h, r) => 'M' + f1(x + r) + ',' + f1(y) + 'h' + f1(w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r + 'v' + f1(h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 -' + r + ',' + r + 'h-' + f1(w - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 -' + r + ',-' + r + 'v-' + f1(h - 2 * r) + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',-' + r + 'z';

  /* polyline track with arc-length lookup */
  function track(pts) {
    const seg = []; let len = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); len += d; }
    const at = t => { let s = Math.max(0, Math.min(1, t)) * len, i = 0; while (i < seg.length - 1 && s > seg[i]) { s -= seg[i]; i++; } const a = pts[i], b = pts[i + 1] || a, u = seg[i] ? Math.min(1, s / seg[i]) : 0; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
    const ang = t => { const a = at(t - .012), b = at(t + .012); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
    return { pts, len, at, ang };
  }
  /* jagged electric stroke from (ox,oy) at angle a, length L */
  function bolt(ox, oy, a, L) { let d = 'M' + f1(ox) + ',' + f1(oy); const ca = Math.cos(a), sa = Math.sin(a); for (let i = 1; i <= 4; i++) { const s = L * i / 4, j = i < 4 ? (rnd() - .5) * 11 : 0; d += 'L' + f1(ox + ca * s - sa * j) + ',' + f1(oy + sa * s + ca * j); } return d; }
  function mkBurst(ctx, parent, ox, oy, n, L0, L1) {
    const g = ctx.el('g', { class: 's-qburst', filter: ctx.glow }, parent); g.style.opacity = 0; const paths = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (rnd() - .5) * .7; paths.push(ctx.el('path', { d: bolt(ox, oy, a, L0 + rnd() * (L1 - L0)), fill: 'none', stroke: WHT, 'stroke-width': 1.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)); }
    return { g, paths, t: 0 };
  }
  const groupOf = j => { for (let gi = 0; gi < GROUPS.length; gi++) if (GROUPS[gi].rows.indexOf(j) >= 0) return gi; return 0; };

  STORY.register({
    id: 'queries', layer: 'queries', range: RANGE,
    captions: [{ at: [0.455, 0.66], he: 'כל שאילתה היא בקשה: לסנן, לחבר, לקבץ. השרת מבצע את זה על הטבלאות ומחזיר תשובה.', en: 'Every query is a request: filter, join, group. The server runs it on the tables and answers.' }],

    build(ctx, root) {
      const A = ctx.anchors, el = ctx.el;

      /* ---------- TABLE OPS panel: a hologram floating above the farm ---------- */
      const P = S.pn = {};
      P.g = el('g', { class: 's-qpanel' }, root); P.g.style.opacity = 0;
      P.glow = el('ellipse', { cx: PN.x + PN.w / 2, cy: PN.y + PN.h / 2 + 6, rx: 220, ry: 74, fill: 'url(#stHalo)' }, P.g); P.glow.style.opacity = 0;
      P.frame = el('path', { d: rr(PN.x, PN.y, PN.w, PN.h, 8), fill: DARK, stroke: CY, 'stroke-width': 1, 'stroke-opacity': .75 }, P.g); P.frame.style.fillOpacity = 0;
      P.strip = el('path', { d: 'M' + (PN.x + 8) + ',' + (PN.y + .5) + 'h' + (PN.w - 16) + 'a8,8 0 0 1 8,8v10h-' + PN.w + 'v-10a8,8 0 0 1 8,-8z', fill: CY, 'fill-opacity': .09 }, P.g); P.strip.style.opacity = 0;
      P.live = el('circle', { cx: PN.x + 13, cy: PN.y + 9.5, r: 2.4, fill: CY, filter: ctx.glow }, P.g); P.live.style.opacity = 0;
      P.title = el('text', { class: 's-mono', x: PN.x + 22, y: PN.y + 13, 'font-size': 10, fill: MUT, 'letter-spacing': 1.4 }, P.g); P.title.textContent = 'TABLE OPS'; P.title.style.opacity = 0;
      const cx0 = PN.x - 4, cy0 = PN.y - 4, cx1 = PN.x + PN.w + 4, cy1 = PN.y + PN.h + 4, L = 11;
      P.corners = el('path', { d: 'M' + cx0 + ',' + (cy0 + L) + 'V' + cy0 + 'H' + (cx0 + L) + 'M' + (cx1 - L) + ',' + cy0 + 'H' + cx1 + 'V' + (cy0 + L) + 'M' + cx1 + ',' + (cy1 - L) + 'V' + cy1 + 'H' + (cx1 - L) + 'M' + (cx0 + L) + ',' + cy1 + 'H' + cx0 + 'V' + (cy1 - L), fill: 'none', stroke: CYL, 'stroke-width': 1.3, 'stroke-linecap': 'round' }, P.g); P.corners.style.opacity = 0;
      P.symG = el('g', { class: 's-mono', 'font-size': 12, 'text-anchor': 'middle', filter: ctx.glow }, P.g);
      P.syms = ['σ', '⋈', 'γ'].map((s, k) => { const t = el('text', { x: PN.x + PN.w - 56 + k * 21, y: PN.y + 14, fill: MUT }, P.symG); t.textContent = s; t.style.opacity = 0; return t; });
      P.labels = el('g', { class: 's-mono', 'font-size': 9.5, fill: MUT }, P.g); P.labels.style.opacity = 0;
      [['Rides', TB.rx], ['Stations', TB.sx], ['result', TB.ox]].forEach(q => { const t = el('text', { x: q[1], y: TB.labelY }, P.labels); t.textContent = q[0]; });
      P.heads = [TB.rx, TB.sx, TB.ox].map(x => { const r = el('rect', { x, y: TB.headY, width: 0, height: 3, rx: 1, fill: TEAL2 }, P.g); return r; });
      P.rides = RIDES_W.map((w, j) => { const y = TB.y0 + j * TB.pitch; const g = el('g', null, P.g); g.style.opacity = 0;
        const key = el('rect', { x: TB.rx, y, width: 4, height: TB.rh, rx: 1, fill: CY }, g); const bar = el('rect', { x: TB.rx + 7, y, width: 0, height: TB.rh, rx: 1, fill: TEAL2 }, g); return { g, key, bar, y, w: w - 7 }; });
      P.st = ST_W.map((w, j) => { const y = TB.y0 + j * TB.pitch; const g = el('g', null, P.g); g.style.opacity = 0;
        const key = el('rect', { x: TB.sx, y, width: 4, height: TB.rh, rx: 1, fill: CY }, g); const bar = el('rect', { x: TB.sx + 7, y, width: 0, height: TB.rh, rx: 1, fill: TEAL2 }, g); return { g, key, bar, y, w: w - 7 }; });
      P.ghosts = LIT.map(j => { const r = el('rect', { x: TB.rx, y: TB.y0 + j * TB.pitch, width: RIDES_W[j], height: TB.rh, rx: 1, fill: CY, filter: ctx.glow }, P.g); r.style.opacity = 0; return r; });
      P.res = GROUPS.map((G, gi) => { const y = TB.y0 + gi * TB.rp; const g = el('g', null, P.g); g.style.opacity = 0;
        el('rect', { x: TB.ox, y, width: 20, height: 7, rx: 1, fill: TEAL2 }, g); const bar = el('rect', { x: TB.ox + 24, y, width: 0, height: 7, rx: 1, fill: CY }, g);
        const lab = el('text', { class: 's-mono', x: TB.ox + 24, y: y + 6.5, 'font-size': 9, fill: MUT }, g); lab.textContent = String(G.rows.length); lab.style.opacity = 0; return { g, bar, lab, y }; });
      P.jg = el('g', { filter: ctx.glow }, P.g);
      P.joins = LIT.map(j => { const y1 = TB.y0 + j * TB.pitch + 3, y2 = TB.y0 + MATCH[j] * TB.pitch + 3;
        const ln = el('line', { x1: TB.rx + TB.w + 2, y1, x2: TB.sx - 2, y2, stroke: CYL, 'stroke-width': 1.4, 'stroke-linecap': 'round' }, P.jg); ln.style.opacity = 0;
        const sp = el('circle', { cx: TB.sx - 2, cy: y2, r: 2.6, fill: WHT }, P.jg); sp.style.opacity = 0; return { ln, sp }; });
      P.scan = el('line', { x1: TB.rx - 3, x2: TB.rx + TB.w + 3, y1: 0, y2: 0, stroke: WHT, 'stroke-width': 1.5, 'stroke-linecap': 'round', filter: ctx.glow }, P.g); P.scan.style.opacity = 0;
      P.bursts = [mkBurst(ctx, P.g, TB.rx + TB.w + 3, TB.headY + 2, 6, 18, 34), mkBurst(ctx, P.g, (TB.rx + TB.w + TB.sx) / 2, TB.y0 + 32, 6, 16, 30), mkBurst(ctx, P.g, TB.ox + 2, TB.headY + 2, 6, 18, 34)];

      /* ---------- farm port: ring + burst where the chips land ---------- */
      S.ring = el('circle', { cx: PORT[0], cy: PORT[1], r: 4, fill: 'none', stroke: CYL, 'stroke-width': 1.5 }, root); S.ring.style.opacity = 0;
      S.portBurst = mkBurst(ctx, root, PORT[0], PORT[1], 7, 22, 44);

      /* ---------- query boxes, travel tracks, result cards ---------- */
      S.q = QUERIES.map((q, i) => {
        const pc = A.PCS[i], H = q.hover;
        const scr = ctx.iso.P(58, -40, 19.5, [pc[0], pc[1] - 8.5]);        // centre of ch2's monitor screen for this desk
        q.from = [scr[0], scr[1] - 6];
        const tl = q.n * CHW, w = tl + 36, h = 26;
        /* travel track: hover → drop onto the cable → along ch2's cable to the port (same curve as ch2) */
        const path = el('path', { d: ctx.curve(PORT, pc, q.bend), fill: 'none', stroke: 'none' }, root);
        const cp = ctx.sample(path, 60), jn = Math.round(60 * q.join), J = cp[jn], B = cp[jn - 6];
        const dx = B[0] - J[0], dy = B[1] - J[1], dl = Math.hypot(dx, dy) || 1;
        const C = [(H[0] + J[0]) / 2 + dx / dl * 46, (H[1] + J[1]) / 2 + dy / dl * 46];
        let d = 'M' + f1(H[0]) + ',' + f1(H[1]) + ' Q' + f1(C[0]) + ',' + f1(C[1]) + ' ' + f1(J[0]) + ',' + f1(J[1]);
        for (let k = jn - 1; k >= 0; k--) d += ' L' + f1(cp[k][0]) + ',' + f1(cp[k][1]);
        path.setAttribute('d', d);
        const tk = track(ctx.sample(path, 110));
        const flow = ctx.flow(tk.pts.slice().reverse(), { color: CYL, speed: 230, count: 10, size: 1.8, tail: 14 });
        /* projection beam from the monitor to the hover spot */
        const beam = el('line', { x1: q.from[0], y1: q.from[1] - 8, x2: H[0], y2: H[1] + h / 2 - 1, stroke: CY, 'stroke-width': 1, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }, root); beam.style.opacity = 0;
        const tail = el('path', { d: 'M0,0', fill: 'none', stroke: CYL, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', filter: ctx.glow }, root); tail.style.opacity = 0;
        const g = el('g', { class: 's-qbox' }, root); g.style.opacity = 0;
        const body = el('g', null, g);
        el('path', { d: rr(-w / 2, -h / 2, w, h, 7), fill: DARK, 'fill-opacity': .94, stroke: CY, 'stroke-width': 1, filter: ctx.glow }, body);
        const clip = el('clipPath', { id: 'queries-clip' + i }, ctx.defs);
        const clipRect = el('rect', { x: -w / 2 + 22, y: -h / 2, width: 0, height: h }, clip);
        const tx = -w / 2 + 22;
        const text = el('text', { class: 's-mono', x: tx, y: 4.5, 'font-size': 12.5, fill: INK, textLength: f1(tl), lengthAdjust: 'spacingAndGlyphs', 'clip-path': 'url(#queries-clip' + i + ')' }, body);
        q.toks.forEach(t => { const ts = el('tspan', { fill: t[1] === 'k' ? CY : t[1] === 's' ? AMB : INK }, text); ts.textContent = t[0]; });
        const cursor = el('rect', { x: tx, y: -8, width: 1.6, height: 15, fill: CY }, body); cursor.style.opacity = 0;
        const badge = el('g', null, g);
        el('circle', { r: 9.5, fill: DARK, stroke: CY, 'stroke-width': 1.2 }, badge);
        const fill = el('circle', { r: 9.5, fill: CY, filter: ctx.glow2 }, badge); fill.style.opacity = 0;
        const sym = el('text', { class: 's-mono', 'text-anchor': 'middle', y: 4.3, 'font-size': 12.5, fill: CY }, badge); sym.textContent = q.sym;
        /* result rows travelling back + the result card that collects them */
        const rbars = [0, 1, 2].map(() => { const r = el('rect', { x: -9, y: -1.9, width: 18, height: 3.8, rx: 1.9, fill: CYL, filter: ctx.glow }, root); r.style.opacity = 0; return r; });
        const card = el('g', { class: 's-qcard' }, root); card.style.opacity = 0;
        el('path', { d: rr(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 6), fill: DARK, 'fill-opacity': .92, stroke: CY, 'stroke-width': 1, 'stroke-opacity': .85 }, card);
        const ct = el('text', { class: 's-mono', x: -CARD.w / 2 + 9, y: -CARD.h / 2 + 14, 'font-size': 9.5, fill: MUT }, card); ct.textContent = 'result · 3 rows';
        const cbars = CARD.bars.map((bw, j) => el('rect', { x: -CARD.w / 2 + 9, y: -CARD.h / 2 + 20 + j * 8, width: 0, height: 5, rx: 1, fill: CY }, card));
        return { q, w, h, tl, tx, tk, flow, beam, tail, g, body, clipRect, cursor, badge, fill, sym, rbars, card, cbars };
      });
    },

    update(p, ctx, dt, time) {
      const seg = ctx.seg, lerp = ctx.lerp, E = ctx.ease;
      const l = seg(p, RANGE[0], RANGE[1]);
      const fade = 1 - seg(p, .69, .74);                    // per-workstation bits leave as the client screen appears and the camera moves
      const key = l * 1000 + fade; const changed = key !== S.key; S.key = key;
      const P = S.pn;
      const pfade = 1 - seg(p, .74, .90);                   // the panel fades out completely while the camera zooms to the client (its corner would otherwise peek into the finale)

      /* ===== progress-driven writes ===== */
      if (changed) {
        /* --- query boxes --- */
        S.q.forEach((Q, i) => {
          const T = TL[i], vis = seg(l, T.R0, T.R0 + .05), typed = seg(l, T.T0, T.T1), tv = seg(l, T.V0, T.V1);
          Q.tv = tv; Q.rise = E.outBack(seg(l, T.R0, T.R1)); Q.typed = typed;
          Q.alive = vis > 0 && tv < 1 && fade > 0;
          setO(Q.g, Q.alive ? vis * fade : 0);
          const cv = E.outCubic(seg(l, .74 + i * .03, .80 + i * .03));
          setO(Q.beam, Q.alive ? vis * (1 - seg(tv, 0, .12)) * (.9 - .55 * seg(l, T.R1, T.R1 + .06)) * fade : cv * .45 * fade);   // tethers the box, later the result card, to its monitor
          setA(Q.clipRect, 'width', f1(Q.tl * typed + (typed > 0 ? 2 : 0)));
          setA(Q.cursor, 'x', f1(Q.tx + Q.tl * typed));
          const cmp = smooth(seg(tv, 0, .3));
          Q.bodyS = lerp(1, .1, cmp); Q.chipS = lerp(1, 1.55, cmp) * (1 - smooth(seg(tv, .93, 1))); Q.chipX = lerp(-Q.w / 2 + 1, 0, cmp);
          setO(Q.body, 1 - seg(tv, .03, .2));
          setO(Q.fill, cmp);
          setA(Q.sym, 'fill', cmp > .5 ? GND : CY);
          if (tv > .04 && tv < .985) { let d = ''; for (let k = 0; k <= 9; k++) { const pt = Q.tk.at(smooth(tv) - k * .009); d += (k ? ' L' : 'M') + f1(pt[0]) + ',' + f1(pt[1]); } setA(Q.tail, 'd', d); setO(Q.tail, seg(tv, .04, .16) * (1 - seg(tv, .9, .985)) * fade); }
          else setO(Q.tail, 0);
          /* result card + rows travelling back up the same track */
          setO(Q.card, cv * fade); setA(Q.card, 'transform', tr(Q.q.hover[0], Q.q.hover[1] + (1 - cv) * 10));
          Q.rbars.forEach((b, j) => { const w0 = .66 + i * .03 + j * .055, w1 = w0 + .16, tb = seg(l, w0, w1);
            if (tb > 0 && tb < 1 && fade > 0) { const u = 1 - smooth(tb), pt = Q.tk.at(u); setA(b, 'transform', 'translate(' + f1(pt[0]) + ' ' + f1(pt[1]) + ') rotate(' + f1(Q.tk.ang(u)) + ')'); setO(b, fade * seg(tb, 0, .08) * (1 - seg(tb, .9, 1))); }
            else setO(b, 0);
            setA(Q.cbars[j], 'width', f1(CARD.bars[j] * E.outBack(seg(l, w1 - .01, w1 + .035)))); });
          Q.flow.set(seg(l, .72 + i * .02, .80 + i * .02) * (1 - seg(l, .93, 1)) * fade * .9);
        });

        /* --- panel: appearance --- */
        S.ap = seg(l, .14, .32);
        ctx.drawIn(P.frame, E.out(seg(l, .14, .24)));
        setS(P.frame, 'fillOpacity', .8 * seg(l, .18, .26));
        setO(P.glow, seg(l, .17, .32));
        setO(P.strip, seg(l, .20, .26)); setO(P.title, seg(l, .21, .27)); setO(P.corners, seg(l, .22, .29)); setO(P.labels, seg(l, .20, .25));
        P.heads.forEach((h, k) => setA(h, 'width', f1(TB.w * E.outCubic(seg(l, .20 + k * .015, .25 + k * .015)))));
        P.symApp = P.syms.map((t, k) => seg(l, .23 + k * .015, .27 + k * .015));

        /* --- σ: scan line sweeps the Rides table, rows that fail dim --- */
        const sc = seg(l, OPS[0][0], OPS[0][0] + .07);
        const scanY = lerp(TB.y0 - 4, TB.y0 + RIDES_W.length * TB.pitch, sc);
        setA(P.scan, 'y1', f1(scanY)); setA(P.scan, 'y2', f1(scanY)); P.scanOn = sc > 0 && sc < 1;
        /* --- γ: matched rows fly into the result rows; ORDER BY re-sorts --- */
        const gp = seg(l, OPS[2][0], OPS[2][0] + .10), ob = E.inOut(seg(l, .69, .74));
        const arrived = [0, 0, 0];
        P.rides.forEach((r, j) => {
          const e = E.outCubic(seg(l, .21 + j * .011, .26 + j * .011)); setA(r.bar, 'width', f1(r.w * e));
          const cy = r.y + TB.rh / 2, passed = sc > 0 ? smooth(seg(scanY - cy, -4, 7)) : 0, k = LIT.indexOf(j);
          let o = e > 0 ? 1 : 0;
          if (k < 0) o *= 1 - .84 * passed;
          else {
            setA(r.bar, 'fill', passed > .5 ? CY : TEAL2); setA(r.key, 'fill', passed > .5 ? WHT : CY);
            const fl = E.inOut(seg(gp, k * .07, k * .07 + .6)), gi = groupOf(j), gh = P.ghosts[k];
            arrived[gi] += smooth(seg(fl, .7, 1));
            o *= 1 - .55 * smooth(seg(fl, 0, .3));
            if (fl > 0 && fl < 1) { const ty = P.res[gi].y - r.y, tx = TB.ox - TB.rx; setA(gh, 'transform', tr(tx * fl, ty * fl)); setA(gh, 'width', f1(lerp(RIDES_W[j], 20, fl))); setO(gh, 1 - smooth(seg(fl, .75, 1))); }
            else setO(gh, 0);
          }
          setO(r.g, o);
        });
        /* --- ⋈: lines between matching rows, sparks at the Stations end --- */
        const jn = seg(l, OPS[1][0], OPS[1][1]);
        const stLit = [0, 0, 0, 0, 0];
        P.joins.forEach((J, k) => { const dr = E.out(seg(jn, k * .1, k * .1 + .5)); ctx.drawIn(J.ln, dr); setO(J.ln, dr > 0 ? (.95 - .35 * smooth(seg(gp, .2, 1))) : 0); J.sp.t = seg(jn, k * .1 + .35, k * .1 + .8); if (dr >= .999) stLit[MATCH[LIT[k]]] = 1; });
        P.st.forEach((r, j) => { const e = E.outCubic(seg(l, .225 + j * .013, .275 + j * .013)); setA(r.bar, 'width', f1(r.w * e)); setO(r.g, e > 0 ? 1 : 0); setA(r.bar, 'fill', stLit[j] ? CY : TEAL2); setA(r.key, 'fill', stLit[j] ? WHT : CY); });
        P.res.forEach((R, gi) => { const G = GROUPS[gi]; setO(R.g, seg(gp, gi * .07 + .05, gi * .07 + .35)); setA(R.bar, 'width', f1(30 * arrived[gi])); setO(R.lab, seg(arrived[gi], G.rows.length - .3, G.rows.length)); setA(R.lab, 'x', f1(TB.ox + 24 + 30 * arrived[gi] + 5)); setA(R.g, 'transform', tr(0, (G.slot - gi) * TB.rp * ob)); });
        /* --- bursts + step symbols + port ring --- */
        P.bursts.forEach((b, k) => { b.t = seg(l, OPS[k][0], OPS[k][0] + .06); b.paths.forEach((pt, i) => ctx.drawIn(pt, Math.min(1, b.t * 2.4 * (1.12 - i * .04)))); });
        let pb = 0, ring = 0; TL.forEach(T => { const a = seg(l, T.V1, T.V1 + .05); if (a > 0 && a < 1) pb = a; const r = seg(l, T.V1, T.V1 + .07); if (r > 0 && r < 1) ring = r; });
        S.portBurst.t = pb; S.portBurst.paths.forEach((pt, i) => ctx.drawIn(pt, Math.min(1, pb * 2.4 * (1.12 - i * .05))));
        setA(S.ring, 'r', f1(4 + 36 * E.out(ring))); setO(S.ring, ring > 0 ? (1 - ring) * .9 : 0);
        P.symState = OPS.map(o => l >= o[1] ? 2 : (l >= o[0] ? 1 : 0));
        P.syms.forEach((t, k) => setA(t, 'fill', P.symState[k] === 2 ? CY : P.symState[k] === 1 ? WHT : MUT));
      }

      /* ===== time-driven writes (also run when p is frozen) ===== */
      const t = time;
      S.q.forEach((Q, i) => {
        if (!Q.alive) return;
        const tv = Q.tv, bob = Math.sin(t * 1.7 + i * 2.1) * 2.2 * (1 - seg(tv, 0, .2));
        let x, y, s = 1;
        if (tv <= 0) { x = lerp(Q.q.from[0], Q.q.hover[0], Q.rise); y = lerp(Q.q.from[1], Q.q.hover[1], Q.rise) + bob; s = lerp(.45, 1, Q.rise); }
        else { const pt = Q.tk.at(smooth(tv)); x = pt[0]; y = pt[1] + bob; }
        setA(Q.g, 'transform', tr(x, y, s));
        setA(Q.body, 'transform', Q.bodyS === 1 ? 'scale(1)' : 'scale(' + (Math.round(Q.bodyS * 1000) / 1000) + ')');
        setA(Q.badge, 'transform', tr(Q.chipX, 0, Q.chipS * (tv > 0 ? 1 + .09 * Math.sin(t * 9 + i) : 1)));
        setO(Q.cursor, tv <= 0 ? ((Q.typed > 0 && Q.typed < 1) ? 1 : (Math.sin(t * 7) > 0 ? 1 : 0)) : 0);
      });
      if (S.ap > 0 && pfade > 0) {                       // once the panel has fully faded it stays at 0 (the flicker term must not resurrect it)
        setO(P.g, pfade * (1 - .045 * Math.abs(Math.sin(t * 23) * Math.sin(t * 7.3))));
        setO(P.live, S.ap * (.55 + .45 * Math.max(0, Math.sin(t * 2.6))));
        setO(P.scan, P.scanOn ? .8 + .2 * Math.sin(t * 37) : 0);
        P.syms.forEach((s, k) => { const st = P.symState[k], ap = P.symApp[k]; setO(s, st === 1 ? ap * (.75 + .25 * Math.sin(t * 12)) : st === 2 ? ap * .95 : ap * .55); });
        P.joins.forEach(J => setO(J.sp, pulse(J.sp.t, .3) * (.7 + .3 * Math.sin(t * 29))));
        P.bursts.forEach((b, k) => setO(b.g, pulse(b.t, .3) * (.75 + .25 * Math.sin(t * 41 + k))));
      } else setO(P.g, 0);
      setO(S.portBurst.g, pulse(S.portBurst.t, .3) * (.75 + .25 * Math.sin(t * 43)));
    }
  });
})();
