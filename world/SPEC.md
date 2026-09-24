# RowdyQL scroll story — build spec

A scroll-driven section on the RowdyQL landing page (rowdyql.com, a Hebrew/English study site for a database-design course).
As the visitor scrolls, a fixed 1600×900 stage tells one continuous story: **a glowing server farm → cables and neurons reach
workstations and holograms → queries fly to the servers and table operations light up → around it all, ETL pipelines, views
and a globe move data across the world → the last cable lands on a client screen that prints the query result and a sentence,
with a sign-up button under it.**

Visual language: isometric vector graphics, dark ground `#0B1416`, cyan `#5CC3D9` (glow), deep teal `#0E5566`/`#1C6F7F`/`#2F97AD`,
amber `#E8A33A` (the one warm accent, use sparingly), ink `#E6EEEC`, muted `#93A5A1`, edge lines `#2B3A37`, faces `#0F1B1D`/`#152524`.
The site logo is an isometric grid of cells with one cyan cell risen from its socket and a 3×3×3 lattice hologram around it — the story
should feel like the world that logo lives in. "Magic" = glow, halos, pulses, particles. Not cartoons, not photoreal.

## Files (all in this folder)
- `engine.js` — the engine. **Read it. Do not edit it.** If it blocks you, report the problem in your `concerns`.
- `story.css` — shared CSS. Do not edit; if your chapter needs CSS, set inline `style`/attributes from JS.
- `preview.html` — harness. Loads engine + `ch1_farm.js`, `ch2_links.js`, `ch3_queries.js`, `ambient.js`, `ch5_client.js`.
- `SPEC.md` — this file.
- Screenshots: `node C:/Users/razel/Projects/rowdyql/tools/storyshot.js <p> <out.png> [lang]` renders the preview frozen at
  progress `p` (0..1) and prints JSON `{errors, nodes, chapters, caption}`. Write shots to `shots/<chapter>_<p>.png`, then
  **look at them with the Read tool** and iterate. Always run it from any directory (absolute path). `lang` = `en` for English.

## Chapter contract
Each chapter is ONE file that calls `STORY.register({...})` at top level and defines nothing else global:

```js
STORY.register({
  id: 'farm',                      // fixed per chapter, see table
  layer: 'farm',                   // one of: bg floor farm cables pcs queries client fx  (drawn in this order, bg first)
  range: [0.00, 0.25],             // global progress window this chapter animates in (it may still be visible outside it)
  captions: [{ at: [0.03, 0.22], he: '…', en: '…' }],   // 1–2 short sentences shown under the stage; keep 8–16 words
  build(ctx, g){ /* create all SVG nodes once, inside g (an <svg:g>) — create everything here, hidden if needed */ },
  update(p, ctx, dt, time){ /* p = global progress 0..1, dt = seconds since last frame, time = seconds; mutate attributes/styles */ }
});
```
`update` runs every frame (also when p is frozen), so continuous motion (LED blink, rotation, hover) uses `time`; scroll-driven motion
uses `p` via `ctx.seg(p, a, b)` (0..1 within a window) and the eases. Cache the last local progress and skip DOM writes when unchanged
except for the time-based bits. Never create/destroy nodes in `update`.

### ctx helpers (see engine.js for exact code)
- `ctx.el(tag, attrs, parent)` — create an SVG element. `ctx.box(parent, origin, x, y, w, d, h, cls)` — isometric box
  (origin = stage px `[sx, sy]`, footprint x,y,w,d and height h in world px; faces get classes `s-lf s-rt s-tp`; add `s-lit` for cyan faces).
- `ctx.iso.P(x, y, z, origin)` — project a world point to stage px (x right-back, y left-back, z up; 30° isometric).
- `ctx.curve(a, b, bend)` — quadratic path d-string between stage points; `ctx.sample(pathEl, n)` — n+1 points along a path
  (for particle flows); `ctx.drawIn(pathEl, t)` — reveal a stroke 0..1; `ctx.show(node, on|0..1)` — opacity.
- `ctx.flow(points, {color, speed, count, size, tail})` — particle stream on the canvas along stage points; returns `{set(intensity 0..1), setPoints(pts)}`.
  Call `set(...)` in `update` (0 hides it). Budget: ≤ 4 flows and ≤ 60 particles per chapter.
- `ctx.seg, ctx.lerp, ctx.clamp, ctx.ease.{in,out,inOut,outBack,expoIn,outCubic}`, `ctx.lang()` → 'he'|'en'.
- `ctx.glow` = `url(#stGlow)`, `ctx.glow2` = stronger; gradients `url(#stCyan)`, `url(#stHalo)`, `url(#stAmberHalo)`; blur filter `url(#stBlur)`.
- `ctx.layer(name)` — another layer's group (e.g. a chapter may add a cable to `cables`). `ctx.defs` — add your own defs; prefix ids with your chapter id.
- `ctx.anchors` — the shared layout (stage px, before camera):
  `FARM [380,470]` farm floor centre · `PCS [[820,330],[960,560],[1120,400]]` three workstations · `HOLO [960,250]` hologram above the middle desk ·
  `GLOBE [1330,230]` · `PIPES {x1:150,x2:1450,y1:110,y2:190}` back band for ETL pipes · `CLIENT [1060,610]` final client screen.
- Camera (engine-owned): p 0→.3 pulls back from the farm (scale 1.3 → 1); .3→.72 full stage; .72→.92 zooms to CLIENT at 1.35.
  Keep important detail inside the stage; the visible window at p=1 is roughly x 470…1650, y 270…930 around CLIENT.

### Rules
- Plain ES2018, no libraries, no images, no external URLs. Everything is generated geometry.
- **All SVG class names start with `s-`** (the host page has classes like `.node`, `.top`, `.edge` that would collide).
- Budget: ≤ 350 SVG nodes per chapter (`nodes` in the storyshot JSON is the total). Prefer `<polygon>/<path>/<rect>/<circle>`, group repeated shapes.
- Text inside the SVG: English mono for code/labels (`class="s-mono"`); Hebrew only where the brief says, with `direction="rtl"` on the
  `<text>` and `text-anchor="end"`; use `ctx.lang()` to pick the string and update it in `update` when it changes.
- Nothing may extend past the stage: x 0…1600, y 0…900 (the stage clips).
- Reduced motion / static: at p=1 with time=0 your chapter must look complete and good (the engine renders p=1 once, no loop).
- Coordinate with neighbours by the anchors only; don't draw where another chapter owns the space (see table).
- Check with the storyshot tool at least at the start, middle and end of your range, plus p=1 (everything settled) and p=0.5 (mid-story).
  Check the English caption once (`lang=en`).

## Chapters
| id | file | layer | range | owns (stage region) | brief |
|---|---|---|---|---|---|
| farm | ch1_farm.js | farm (+floor) | 0–0.25 | around FARM: x 120…640, y 300…640 | A server farm rises out of a glowing floor: a floor plate with a faint grid, 6–8 isometric rack cabinets in two rows (each cabinet: a tall box with 4–6 unit slots as thin lines, small LEDs — cyan, a couple amber — blinking with `time`), racks rise one after another with an exponential-then-settle feel (like a button pushed up), a soft cyan halo under the floor (ellipse with `url(#stHalo)`), and a central "core" rack that ends with an amber pulse. Optional: thin light rings expanding from the core. Caption HE: "ברוכים הבאים לעולם של מסדי הנתונים. הכול מתחיל בחוות שרתים." EN: "Welcome to the world of databases. It all starts in a server farm." |
| links | ch2_links.js | cables (+pcs) | 0.18–0.48 | cables from FARM to each of PCS; the three workstations; the hologram at HOLO | Glowing cables grow from the farm (start near the farm's right edge, about `[560,470]`) to the three workstations (`ctx.drawIn` on `s-cable` paths, use `ctx.curve` with different bends), with neuron-like nodes along them (small circles that pulse with `time`, a few short dendrite branches). Each workstation: an isometric desk (flat box), a monitor (box with a lit screen face), a tiny keyboard. The middle desk gets a hologram above it at HOLO: a 3×3×3 lattice (points + lines, cyan, 50% opacity) rotating slowly with `time` (re-project points every frame like the site logo). Particle flows along the cables from farm to desks (intensity rises with local progress). Caption HE: "השרתים לא עובדים לבד. כבלים, רשתות ומחשבים מדברים איתם כל הזמן." EN: "Servers never work alone. Cables, networks and computers talk to them all the time." |
| queries | ch3_queries.js | queries | 0.42–0.70 | above each PC and along their cables; a "table operations" panel above the farm around `[380,250]` | From each workstation a glowing query box floats up (rounded rect, mono text, one line each: `SELECT name FROM Riders WHERE city = 'Haifa'`, `SELECT s.name, COUNT(*) FROM Rides r JOIN Stations s …`, `… GROUP BY s.name ORDER BY 2 DESC`), then travels along its cable toward the farm (position by local progress; you may re-sample the same curves as ch2 by drawing your own invisible paths between the same anchors — ch2 uses `ctx.curve(from, PCS[i], bend)` with from `[560,470]` and bends −90, 40, −40 for PCS 0,1,2). Above the farm a table-operations panel appears: two mini tables (rows as thin bars), a filter that dims rows (σ), a join that draws lines between matching rows (⋈), a group-by that collapses rows into 3 bars — sequenced by local progress, with electric bursts (short bright strokes) at each step. Result rows (small cyan bars) flow back down the cables (a reverse flow). Caption HE: "כל שאילתה היא בקשה: לסנן, לחבר, לקבץ. השרת מבצע את זה על הטבלאות ומחזיר תשובה." EN: "Every query is a request: filter, join, group. The server runs it on the tables and answers." |
| ambient | ambient.js | bg | 0.25–0.90 | the back band PIPES (top), the GLOBE region (top-right), faint far-background elements; never in front of others | Background richness that grows with progress: (1) an ETL pipeline across the back band: three glowing stations labelled `EXTRACT`, `TRANSFORM`, `LOAD` (mono, small, muted) joined by pipes with valves/joints, packets flowing left→right (a flow), a small "source systems" cluster at the left end (3 tiny boxes: `CRM`, `ERP`, `LOGS`) feeding it; (2) a `VIEW` panel: a translucent window (rect with a title bar reading `VIEW v_daily_rides`) that mirrors 4–5 rows from the pipeline, sitting between the pipes and the farm at about `[640,200]`, appearing at local .35; (3) a wireframe globe at GLOBE (r≈95: meridians + parallels as ellipses, rotating slowly with `time` by shifting meridian phases), with 3–4 client pins and a great-circle arc from the farm's right edge up to the globe, packets flowing along it (a flow) from local .5; (4) a few faint far-away nodes/satellites twinkling. Everything at ≤ 60% opacity so the foreground stays dominant. Caption HE: "מסביב, צינורות ETL מביאים נתונים ממערכות אחרות, Views מציגים אותם בזווית הנכונה, והמידע נשלח ללקוחות בכל העולם." EN: "All around, ETL pipelines bring data from other systems, views show it from the right angle, and it travels to clients around the world." Place your caption window at [0.72, 0.86] so it does not clash with the others (they end by 0.70). |
| client | ch5_client.js | client (+cables for its cable) | 0.68–1.00 | around CLIENT: x 800…1500, y 420…860 | The last cable leaves the farm (start `[560,500]`, add it to `ctx.layer('cables')`, bend ≈ 120 so it sweeps under the desks) and lands on a client: an isometric laptop/monitor seen at CLIENT whose screen is drawn as a flat, camera-facing panel for legibility (rect ≈ 520×300 centred a little above CLIENT, dark `#0F1B1D` with a cyan 1px border, a thin title bar "rowdyql · live" in mono). On the screen, by local progress: the query types itself (`SELECT * FROM Students WHERE ready = 1;`, mono, cyan keywords), then a result table prints row by row: header `result` and one row with the sentence — HE `ברוכים הבאים לעולם של מסדי הנתונים. מכאן זה רק נהיה מעניין.` / EN `Welcome to the world of databases. From here it only gets interesting.` (Heebo, ink colour, `direction="rtl"` + `text-anchor="end"` for Hebrew; split into two lines if needed), then `(1 row)` in muted mono. A cursor blinks with `time`. A flow of particles runs along the cable into the screen (intensity by local progress) and a soft cyan halo behind the screen. The screen must be fully legible at the p=1 camera (scale 1.35 centred near [1060,600]); leave the bottom 110 px of the visible window (below y≈820 in stage px) empty — the HTML sign-up button sits there. Caption HE: "…והתשובה חוזרת אליכם, למסך שלכם." EN: "…and the answer comes back to you, on your screen." Caption window [0.87, 0.93]. |

## Report
When done, report: file path, one-paragraph summary of what is drawn and how it moves, SVG node count of your chapter, the shots you checked,
and concerns (engine bugs, budget, anything a reviewer should look at).
