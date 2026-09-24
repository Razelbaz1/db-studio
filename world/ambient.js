/* ambient.js — RowdyQL scroll story, chapter "ambient" (layer bg, global p 0.25–0.90).
   Background richness: an ETL pipeline across the back band (sources → EXTRACT → TRANSFORM → LOAD),
   a translucent VIEW panel mirroring pipeline rows, a tilted wireframe globe with client pins,
   satellites and great-circle arcs, a data arc from the farm up to the globe, and faint far nodes.
   Everything sits behind the other chapters at <= 60% opacity. */
(function () {
  const D2R = Math.PI / 180;
  const CY = '#5CC3D9', CYH = '#8FE0EF', T0 = '#0E5566', T1 = '#1C6F7F', T2 = '#2F97AD', AM = '#E8A33A', INK = '#E6EEEC', MU = '#93A5A1', F0 = '#0F1B1D', F1 = '#152524';
  const r1 = n => Math.round(n * 10) / 10;
  const PIPE_Y = 140, PIPE_X0 = 263, PIPE_X1 = 1058, VX = 560, VY = 158, VW = 168, VH = 90, VTX = VX + 84; // VIEW panel hangs under the pipe between EXTRACT and TRANSFORM: right of ch3's TABLE OPS brackets (x <= 559), above its query cards (y >= 259)
  const GC = [1330, 230], R = 95, TILT = 22 * D2R, cA = Math.cos(TILT), sA = Math.sin(TILT), SPIN = 4.5 * D2R; // globe centre, radius, view tilt, rad/s
  const PINS = [[32, 35], [49, 2], [-34, 18], [19, 73], [41, -74]];   // lat, lon (deg) — Israel first
  const LON0 = 35 * D2R, PIN_ARCS = [[0, 1], [0, 3], [0, 4], [0, 2]];
  const ARC_A = [575, 440], ARC_C = [820, 0], ARC_B = [1247.7, 277.5];  // farm edge → control → globe lower-left limb
  const S = {};                                                           // node handles
  let lastL = -1, seed = 11;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  /* ---- globe math: unit-sphere vector → [sx, sy, depth] relative to the globe centre (inside the spin group) ---- */
  function p3(X, Y, Z, k) { const s = R * (k || 1); return [X * s, -(Y * cA - Z * sA) * s, Z * cA + Y * sA]; }
  function v3(lat, lon) { const cl = Math.cos(lat); return [cl * Math.sin(lon), Math.sin(lat), cl * Math.cos(lon)]; }
  function arcD(a, b, n) {
    let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; dot = Math.max(-1, Math.min(1, dot));
    const om = Math.acos(dot), so = Math.sin(om) || 1e-6; let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const t = i / n, wa = Math.sin((1 - t) * om) / so, wb = Math.sin(t * om) / so;
      const q = p3(wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2], 1 + .16 * Math.sin(Math.PI * t));
      if (q[2] > .05) { d += (pen ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); pen = true; } else pen = false;
    }
    return d || 'M0,0';
  }
  function orbitD(inc, k, n) { let d = ''; for (let i = 0; i <= n; i++) { const u = i / n * 2 * Math.PI, q = p3(Math.cos(u), Math.sin(u) * Math.sin(inc), Math.sin(u) * Math.cos(inc), k); d += (i ? 'L' : 'M') + r1(q[0]) + ',' + r1(q[1]); } return d + 'Z'; }
  function quad(a, c, b, n) { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return out; }
  const txt = (ctx, parent, x, y, str, attrs) => { const t = ctx.el('text', Object.assign({ x, y, class: 's-mono', 'font-size': 10, style: 'white-space:pre' }, attrs || {}), parent); t.textContent = str; return t; };
  const tr = (n, s) => n.setAttribute('transform', s);
  const op = (n, v) => { n.style.opacity = v; };
  const pop = (ctx, node, t, dy) => { const e = ctx.ease.outBack(t); tr(node, 'translate(0 ' + r1((1 - e) * (dy || 14)) + ')'); op(node, ctx.clamp(t * 1.6)); };

  STORY.register({
    id: 'ambient', layer: 'bg', range: [0.25, 0.90],
    captions: [{ at: [0.665, 0.80],
      he: 'מסביב, צינורות ETL מביאים נתונים ממערכות אחרות, Views מציגים אותם בזווית הנכונה, והמידע נשלח ללקוחות בכל העולם.',
      en: 'All around, ETL pipelines bring data from other systems, views show it from the right angle, and it travels to clients around the world.' }],

    build(ctx, g) {
      const el = (t, a, p) => ctx.el(t, a, p);
      S.root = g; op(g, 0);

      /* ===== far nodes: two small constellations + three twinkle dot fields ===== */
      const far = el('g', { class: 's-am-far' }, g); S.far = far;
      const consts = [[[38, 42], [92, 26], [134, 66], [78, 88], [22, 98], [150, 30]], [[1482, 62], [1532, 30], [1578, 86], [1504, 122], [1562, 150], [1588, 46]]];
      const links = [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [1, 5]];
      let ld = '', dd = '';
      consts.forEach(c => { links.forEach(l => { ld += 'M' + c[l[0]][0] + ',' + c[l[0]][1] + 'L' + c[l[1]][0] + ',' + c[l[1]][1]; }); c.forEach((q, i) => { if (i % 2) dd += 'M' + q[0] + ',' + q[1] + 'h.01'; }); });
      el('path', { d: ld, fill: 'none', stroke: T1, 'stroke-width': .8, opacity: .55 }, far);
      el('path', { d: dd, fill: 'none', stroke: CY, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }, far);
      const dia = (q, parent) => el('polygon', { points: (q[0]) + ',' + (q[1] - 4) + ' ' + (q[0] + 4) + ',' + q[1] + ' ' + q[0] + ',' + (q[1] + 4) + ' ' + (q[0] - 4) + ',' + q[1], fill: F1, stroke: CYH, 'stroke-width': .9, filter: ctx.glow }, parent);
      S.dia = []; consts.forEach(c => c.forEach((q, i) => { if (!(i % 2)) S.dia.push(dia(q, far)); }));
      S.stars = [];
      for (let k = 0; k < 3; k++) { let d = ''; for (let i = 0; i < 9; i++) { const right = rnd() < .3; const x = right ? 1500 + rnd() * 88 : 280 + rnd() * 1000, y = right ? 380 + rnd() * 400 : 14 + rnd() * 84; d += 'M' + r1(x) + ',' + r1(y) + 'h.01'; } S.stars.push(el('path', { d, fill: 'none', stroke: CYH, 'stroke-width': 1.6 + k * .4, 'stroke-linecap': 'round', opacity: .35 }, far)); }
      // low-left: a twinkle field (kept <= .3) and a small three-node cluster, so the bottom-left third is not dead during the full-stage phase
      { let d = ''; for (let i = 0; i < 9; i++) d += 'M' + r1(60 + rnd() * 420) + ',' + r1(650 + rnd() * 210) + 'h.01'; S.stars.push(el('path', { d, fill: 'none', stroke: CYH, 'stroke-width': 1.8, 'stroke-linecap': 'round', opacity: .28 }, far)); }
      el('path', { d: 'M74,706L142,764L98,826', fill: 'none', stroke: T1, 'stroke-width': .8, opacity: .55 }, far);
      el('path', { d: 'M142,764h.01M98,826h.01', fill: 'none', stroke: CY, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }, far);
      S.dia.push(dia([74, 706], far));
      // right column under the globe: a faint cluster that fades out (p .64-.70) before the client chapter starts drawing there
      S.farR = el('g', { class: 's-am-farr', opacity: 0 }, far);
      el('path', { d: 'M1290,560L1430,700L1250,800', fill: 'none', stroke: T1, 'stroke-width': .8, 'stroke-dasharray': '3 6', opacity: .55 }, S.farR);
      el('path', { d: 'M1430,700h.01', fill: 'none', stroke: CY, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }, S.farR);
      S.dia.push(dia([1290, 560], S.farR), dia([1250, 800], S.farR));

      /* ===== globe ===== */
      const gl = el('g', { class: 's-am-globe' }, g); S.globe = gl;
      S.halo = el('circle', { cx: GC[0], cy: GC[1], r: R * 1.3, fill: 'url(#stHalo)', opacity: .6 }, gl);
      const spin = el('g', { transform: 'translate(' + GC[0] + ' ' + GC[1] + ') rotate(-14)' }, gl); S.spin = spin;
      S.orbits = [el('path', { d: orbitD(55 * D2R, 1.42, 64), fill: 'none', stroke: T1, 'stroke-width': .8, 'stroke-dasharray': '3 5', opacity: .6 }, spin),
                  el('path', { d: orbitD(-38 * D2R, 1.62, 64), fill: 'none', stroke: T1, 'stroke-width': .8, 'stroke-dasharray': '3 5', opacity: .5 }, spin)];
      S.par = []; [-60, -30, 0, 30, 60].forEach(la => { const f = la * D2R, cl = Math.cos(f); S.par.push(el('ellipse', { cx: 0, cy: r1(-Math.sin(f) * cA * R), rx: r1(cl * R), ry: r1(cl * sA * R), fill: 'none', stroke: la ? T2 : CY, 'stroke-width': la ? .9 : 1.2, opacity: la ? .55 : .8 }, spin)); });
      S.mer = []; for (let i = 0; i < 6; i++) S.mer.push(el('ellipse', { cx: 0, cy: 0, rx: 1, ry: R, fill: 'none', stroke: T2, 'stroke-width': .9, opacity: .5 }, spin));
      S.outline = el('circle', { cx: 0, cy: 0, r: R, fill: 'none', stroke: CY, 'stroke-width': 1.3, opacity: .85, filter: ctx.glow }, spin);
      S.parcs = PIN_ARCS.map(() => el('path', { d: 'M0,0', fill: 'none', stroke: CYH, 'stroke-width': 1, opacity: .7, filter: ctx.glow }, spin));
      S.pins = PINS.map(() => { const pg = el('g', {}, spin); const ring = el('circle', { cx: 0, cy: 0, r: 6, fill: 'none', stroke: CY, 'stroke-width': 1 }, pg); el('circle', { cx: 0, cy: 0, r: 2.4, fill: CYH, filter: ctx.glow }, pg); return { g: pg, ring }; });
      S.sats = [0, 1].map(i => { const sg = el('g', {}, spin); el('rect', { x: -14, y: -2.5, width: 9, height: 5, fill: T1, stroke: T2, 'stroke-width': .7 }, sg); el('rect', { x: 5, y: -2.5, width: 9, height: 5, fill: T1, stroke: T2, 'stroke-width': .7 }, sg); el('rect', { x: -3.5, y: -3.5, width: 7, height: 7, fill: F1, stroke: CY, 'stroke-width': .8 }, sg); const led = el('circle', { cx: 0, cy: -5, r: 1.3, fill: i ? CYH : AM }, sg); return { g: sg, led }; });
      // landing pad on the lower-left limb (stage coords)
      S.landG = el('g', { class: 's-am-land' }, gl);
      S.landPulse = el('circle', { cx: ARC_B[0], cy: ARC_B[1], r: 6, fill: 'none', stroke: CY, 'stroke-width': 1 }, S.landG);
      el('circle', { cx: ARC_B[0], cy: ARC_B[1], r: 3, fill: CYH, filter: ctx.glow }, S.landG);

      /* ===== farm → globe arc ===== */
      const arcG = el('g', { class: 's-am-arc' }, g); S.arcG = arcG;
      const arcPts = quad(ARC_A, ARC_C, ARC_B, 48); const arcd = 'M' + ARC_A[0] + ',' + ARC_A[1] + ' Q' + ARC_C[0] + ',' + ARC_C[1] + ' ' + ARC_B[0] + ',' + ARC_B[1];
      S.arcBeam = el('path', { d: arcd, fill: 'none', stroke: CY, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .08 }, arcG);
      S.arc = el('path', { d: arcd, fill: 'none', stroke: CY, 'stroke-width': 1.5, 'stroke-linecap': 'round', opacity: .55, filter: ctx.glow }, arcG);
      S.arcFlow = ctx.flow(arcPts, { color: CYH, speed: 210, count: 14, size: 2, tail: 24 });

      /* ===== ETL band ===== */
      const etl = el('g', { class: 's-am-etl' }, g); S.etl = etl;
      // pipe (three strokes = tube)
      S.pipe = [el('path', { d: 'M' + PIPE_X0 + ',' + PIPE_Y + 'H' + PIPE_X1, fill: 'none', stroke: T0, 'stroke-width': 9, 'stroke-linecap': 'round' }, etl),
                el('path', { d: 'M' + PIPE_X0 + ',' + PIPE_Y + 'H' + PIPE_X1, fill: 'none', stroke: T1, 'stroke-width': 5, 'stroke-linecap': 'round' }, etl),
                el('path', { d: 'M' + PIPE_X0 + ',' + (PIPE_Y - 3) + 'H' + PIPE_X1, fill: 'none', stroke: CYH, 'stroke-width': 1, 'stroke-linecap': 'round', opacity: .45 }, etl)];
      // crates riding the pipe (drawn before joints/stations so they pass behind them)
      S.crates = [0, 1, 2].map(() => { const b = ctx.box(etl, [0, 0], 0, 0, 10, 10, 8, 's-am-crate'); b.children[0].setAttribute('style', 'fill:' + T0 + ';stroke:' + T2); b.children[1].setAttribute('style', 'fill:' + T1 + ';stroke:' + T2); b.children[2].setAttribute('style', 'fill:rgba(143,224,239,.55);stroke:' + CYH); return b; });
      // flanges + valves
      S.joints = [300, 396, 466, 600, 726, 796, 930, 1020].map(x => el('rect', { x: x - 2.5, y: PIPE_Y - 7.5, width: 5, height: 15, rx: 1.5, fill: T1, stroke: T2, 'stroke-width': .8, 'data-x': x }, etl));
      S.valves = [485, 870].map(x => { const vg = el('g', { 'data-x': x }, etl); el('path', { d: 'M' + x + ',' + (PIPE_Y - 4) + 'V' + (PIPE_Y - 16), stroke: T2, 'stroke-width': 2 }, vg); el('circle', { cx: x, cy: PIPE_Y - 22, r: 6, fill: F0, stroke: CY, 'stroke-width': 1.2 }, vg); const cross = el('path', { d: 'M' + (x - 4) + ',' + (PIPE_Y - 22) + 'H' + (x + 4) + 'M' + x + ',' + (PIPE_Y - 26) + 'V' + (PIPE_Y - 18), stroke: CY, 'stroke-width': 1 }, vg); return { g: vg, cross, x }; });
      // source systems (left end) feeding a merge joint
      S.src = [['CRM', 62], ['ERP', 102], ['LOGS', 142]].map(s => { const sg = el('g', {}, etl); const b = ctx.box(sg, [206, s[1]], 0, 0, 22, 22, 12, 's-am-src'); b.children[2].setAttribute('style', 'fill:rgba(92,195,217,.28);stroke:' + T2); txt(ctx, sg, 181, s[1] + 12, s[0], { 'text-anchor': 'end', fill: INK, opacity: .7, 'font-size': 9.5, 'letter-spacing': 1 }); return sg; });
      S.feed = [73, 113, 153].map((y, i) => el('path', { d: ctx.curve([225, y], [PIPE_X0, PIPE_Y], [-16, -6, 12][i]), fill: 'none', stroke: T2, 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: .8 }, etl));
      S.merge = el('circle', { cx: PIPE_X0, cy: PIPE_Y, r: 4.5, fill: T1, stroke: CY, 'stroke-width': 1.2 }, etl);
      // stations
      const station = (o, label, w) => { const sg = el('g', {}, etl); el('ellipse', { cx: o[0], cy: o[1] + 30, rx: 48, ry: 14, fill: 'url(#stHalo)', opacity: .8 }, sg); const b = ctx.box(sg, o, 0, 0, w, w, 24, 's-am-st'); b.children[0].setAttribute('style', 'stroke:' + T1); b.children[1].setAttribute('style', 'stroke:' + T1); b.children[2].setAttribute('style', 'fill:rgba(92,195,217,.26);stroke:' + T2);
        const P = (a, c, d) => ctx.iso.P(a, c, d, o); const seam = [P(0, 0, 24), P(w, 0, 24), P(w, w, 24), P(0, w, 24)]; el('path', { d: 'M' + seam.map(q => r1(q[0]) + ',' + r1(q[1])).join('L') + 'Z', fill: 'none', stroke: CYH, 'stroke-width': .9, opacity: .8, filter: ctx.glow }, sg);
        txt(ctx, sg, o[0], o[1] - 31, label, { 'text-anchor': 'middle', fill: INK, opacity: .75, 'font-size': 10.5, 'letter-spacing': 2 }); return sg; };
      S.stE = station([430, 134], 'EXTRACT', 36);
      const sweepG = el('g', { transform: 'translate(430 128) scale(1 .5)' }, S.stE); el('circle', { cx: 0, cy: 0, r: 13, fill: 'none', stroke: CY, 'stroke-width': .8, opacity: .5 }, sweepG); S.sweep = el('path', { d: 'M0,0L13,0', stroke: CYH, 'stroke-width': 1.4, 'stroke-linecap': 'round', filter: ctx.glow }, sweepG);
      S.stT = station([760, 134], 'TRANSFORM', 36);
      const gearG = el('g', { transform: 'translate(760 128) scale(1 .5)' }, S.stT); let gp = ''; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10, rr = i % 2 ? 8 : 11.5; gp += r1(Math.cos(a) * rr) + ',' + r1(Math.sin(a) * rr) + ' '; } S.gear = el('polygon', { points: gp.trim(), fill: 'rgba(92,195,217,.35)', stroke: CYH, 'stroke-width': 1, filter: ctx.glow }, gearG); el('circle', { cx: 0, cy: 0, r: 3, fill: F0, stroke: CYH, 'stroke-width': 1 }, gearG);
      // LOAD = a warehouse cylinder
      S.stL = el('g', {}, etl); const cx = 1085, ty = 118, by = 152;
      el('ellipse', { cx, cy: 156, rx: 48, ry: 14, fill: 'url(#stHalo)', opacity: .8 }, S.stL);
      el('path', { d: 'M' + (cx - 30) + ',' + ty + 'V' + by + 'A30,13 0 0 0 ' + (cx + 30) + ',' + by + 'V' + ty + 'Z', fill: F0, stroke: T2, 'stroke-width': 1 }, S.stL);
      el('path', { d: 'M' + (cx - 30) + ',' + (ty + 12) + 'A30,13 0 0 0 ' + (cx + 30) + ',' + (ty + 12) + 'M' + (cx - 30) + ',' + (ty + 23) + 'A30,13 0 0 0 ' + (cx + 30) + ',' + (ty + 23), fill: 'none', stroke: T1, 'stroke-width': 1 }, S.stL);
      el('ellipse', { cx, cy: ty, rx: 30, ry: 13, fill: 'rgba(92,195,217,.28)', stroke: CYH, 'stroke-width': 1, filter: ctx.glow }, S.stL);
      S.loadBar = el('rect', { x: cx - 24, y: by - 7, width: 0, height: 3, rx: 1, fill: CY, opacity: .85 }, S.stL);
      S.led = el('circle', { cx: cx + 18, cy: ty - 3, r: 2, fill: AM, filter: ctx.glow }, S.stL);
      txt(ctx, S.stL, cx, 97, 'LOAD', { 'text-anchor': 'middle', fill: INK, opacity: .75, 'font-size': 10.5, 'letter-spacing': 2 });
      S.pipeFlow = ctx.flow([[PIPE_X0, PIPE_Y], [PIPE_X1 - 4, PIPE_Y]], { color: CYH, speed: 125, count: 16, size: 1.8, tail: 14 });

      /* ===== VIEW panel ===== */
      const vw = el('g', { class: 's-am-view' }, g); S.view = vw; const vx = VX, vy = VY, vwd = VW, tx = VTX;
      S.tap = el('path', { d: 'M' + tx + ',' + (PIPE_Y + 4) + 'V' + vy, fill: 'none', stroke: T2, 'stroke-width': 1.2, 'stroke-dasharray': '2 3' }, vw);
      S.tee = el('circle', { cx: tx, cy: PIPE_Y, r: 3, fill: T1, stroke: CY, 'stroke-width': 1 }, vw);
      S.viewBody = el('g', {}, vw);
      el('rect', { x: vx, y: vy, width: vwd, height: VH, rx: 4, fill: 'rgba(15,27,29,.7)', stroke: T2, 'stroke-width': 1 }, S.viewBody);
      el('path', { d: 'M' + vx + ',' + (vy + 4) + 'a4,4 0 0 1 4,-4H' + (vx + vwd - 4) + 'a4,4 0 0 1 4,4V' + (vy + 17) + 'H' + vx + 'Z', fill: 'rgba(28,111,127,.55)' }, S.viewBody);
      txt(ctx, S.viewBody, vx + 7, vy + 12, 'VIEW v_daily_rides', { fill: CYH, 'font-size': 10 });
      el('circle', { cx: vx + vwd - 9, cy: vy + 8.5, r: 2, fill: AM }, S.viewBody);
      S.viewHi = el('rect', { x: vx + 2, y: vy + 36, width: vwd - 4, height: 12, fill: 'rgba(92,195,217,.13)' }, S.viewBody);
      txt(ctx, S.viewBody, vx + 8, vy + 28, 'day     city        rides', { fill: MU, 'font-size': 9.5 });
      el('path', { d: 'M' + (vx + 6) + ',' + (vy + 32) + 'H' + (vx + vwd - 6), stroke: T1, 'stroke-width': 1 }, S.viewBody);
      S.rows = ['09-21   Haifa       1,204', '09-21   Tel Aviv    2,310', '09-22   Haifa       1,187', '09-22   Beersheba     642'].map((s, i) => txt(ctx, S.viewBody, vx + 8, vy + 45 + i * 12, s, { fill: INK, 'font-size': 9.5, opacity: .85 }));
    },

    update(p, ctx, dt, time) {
      const l = ctx.seg(p, .25, .90), seg = ctx.seg, E = ctx.ease;
      if (l !== lastL) {
        lastL = l;
        op(S.root, .6 * E.out(seg(l, 0, .08))); op(S.far, seg(l, .04, .22)); op(S.farR, .75 * (1 - seg(l, .60, .69)));
        /* ETL */
        S.src.forEach((n, i) => pop(ctx, n, seg(l, .02 + i * .035, .09 + i * .035), 12));
        S.feed.forEach((n, i) => ctx.drawIn(n, seg(l, .09 + i * .02, .14 + i * .02)));
        op(S.merge, seg(l, .12, .15));
        S.pipe.forEach(n => ctx.drawIn(n, E.out(seg(l, .13, .34))));
        const px = PIPE_X0 + (PIPE_X1 - PIPE_X0) * E.out(seg(l, .13, .34));
        S.joints.forEach(n => op(n, seg(px, +n.getAttribute('data-x') - 2, +n.getAttribute('data-x') + 14)));
        S.valves.forEach(v => pop(ctx, v.g, seg(px, v.x, v.x + 30), 8));
        pop(ctx, S.stE, seg(l, .17, .24), 16); pop(ctx, S.stT, seg(l, .24, .31), 16); pop(ctx, S.stL, seg(l, .31, .38), 16);
        S.pipeFlow.set(seg(l, .32, .42) * .9); S.crates.forEach(n => op(n, seg(l, .34, .42)));
        /* VIEW */
        ctx.drawIn(S.tap, seg(l, .34, .38)); op(S.tee, seg(l, .33, .35)); pop(ctx, S.viewBody, seg(l, .36, .43), -10);
        S.rows.forEach((n, i) => { const t = seg(l, .41 + i * .03, .44 + i * .03); op(n, t * .85); tr(n, 'translate(' + r1((1 - t) * -6) + ' 0)'); });
        /* globe */
        op(S.halo, .6 * seg(l, .44, .56)); op(S.outline, .85 * seg(l, .44, .5));
        S.par.forEach((n, i) => ctx.drawIn(n, seg(l, .45 + i * .012, .53 + i * .012)));
        S.mer.forEach((n, i) => op(n, .5 * seg(l, .48 + i * .012, .54 + i * .012)));
        S.pins.forEach((q, i) => { q.t = E.outBack(seg(l, .56 + i * .025, .61 + i * .025)); });
        S.orbits.forEach((n, i) => op(n, (i ? .5 : .6) * seg(l, .62, .7)));
        S.sats.forEach(s => { s.t = seg(l, .64, .72); });
        S.parcs.forEach((n, i) => op(n, .7 * seg(l, .7 + i * .03, .76 + i * .03)));
        /* arc */
        ctx.drawIn(S.arc, E.inOut(seg(l, .5, .62))); ctx.drawIn(S.arcBeam, E.inOut(seg(l, .5, .62)));
        S.arcFlow.set(seg(l, .6, .7) * .9); op(S.landG, seg(l, .6, .65));
      }
      /* ---- time-driven ---- */
      const T = time || 0;
      S.stars.forEach((n, k) => { const a = k === 3 ? .14 : .2; op(n, a + .02 + a * Math.sin(T * (1.1 + k * .5) + k * 2.1)); });
      S.dia.forEach((n, i) => op(n, .5 + .35 * Math.sin(T * 1.4 + i * 1.3)));
      S.sweep.setAttribute('transform', 'rotate(' + r1((T * 110) % 360) + ')');
      S.gear.setAttribute('transform', 'rotate(' + r1((T * 40) % 360) + ')');
      S.valves.forEach((v, i) => v.cross.setAttribute('transform', 'rotate(' + r1(((T * 30 * (i ? -1 : 1)) % 360)) + ' ' + v.x + ' ' + (PIPE_Y - 22) + ')'));
      S.loadBar.setAttribute('width', r1(48 * ((T * .45) % 1)));
      op(S.led, .5 + .5 * Math.round(.5 + .5 * Math.sin(T * 5)));
      S.crates.forEach((n, i) => { const x = PIPE_X0 + 20 + ((T * 92 + i * 265) % (PIPE_X1 - PIPE_X0 - 40)); tr(n, 'translate(' + r1(x) + ' ' + (PIPE_Y - 15) + ')'); });
      const row = Math.floor(T * .8) % 4; S.viewHi.setAttribute('y', VY + 36 + row * 12);
      /* globe spin */
      const spin = SPIN * T;
      S.mer.forEach((n, i) => { const la = i * 30 * D2R + spin, s = Math.sin(la), c = Math.cos(la); n.setAttribute('rx', r1(Math.max(.4, Math.abs(s) * cA * R))); n.setAttribute('transform', 'rotate(' + r1(Math.atan2(-s * sA, c) / D2R) + ')'); });
      const pv = PINS.map(q => v3(q[0] * D2R, (q[1] * D2R - LON0) + spin));
      S.pins.forEach((q, i) => { const w = p3(pv[i][0], pv[i][1], pv[i][2], 1.01); const vis = ctx.clamp(w[2] * 3.5) * (q.t || 0); tr(q.g, 'translate(' + r1(w[0]) + ' ' + r1(w[1]) + ') scale(' + r1(Math.max(.01, q.t || 0)) + ')'); op(q.g, vis); const ph = (T * 1.2 + i * .9) % 1; q.ring.setAttribute('r', r1(4 + ph * 12)); op(q.ring, 1 - ph); });
      S.parcs.forEach((n, i) => n.setAttribute('d', arcD(pv[PIN_ARCS[i][0]], pv[PIN_ARCS[i][1]], 22)));
      S.sats.forEach((s, i) => { const u = (i ? .16 : .24) * T + (i ? 3.4 : .6), inc = (i ? -38 : 55) * D2R, k = i ? 1.62 : 1.42; const w = p3(Math.cos(u), Math.sin(u) * Math.sin(inc), Math.sin(u) * Math.cos(inc), k); const front = w[2] > 0; tr(s.g, 'translate(' + r1(w[0]) + ' ' + r1(w[1]) + ') rotate(' + r1(u / D2R * .5 + (i ? 20 : -35)) + ') scale(' + (front ? 1 : .8) + ')'); op(s.g, (front ? .95 : .35) * (s.t || 0)); op(s.led, .4 + .6 * Math.round(.5 + .5 * Math.sin(T * 3 + i))); });
      const lp = (T * .9) % 1; S.landPulse.setAttribute('r', r1(4 + lp * 16)); op(S.landPulse, 1 - lp);
    }
  });
})();
