/* ==========================================================================
   Mini-jeu « Vise la poubelle » — lancer de déchet à la PREMIÈRE PERSONNE.
   100 % dessiné au canvas (le feuillage réutilise les SVG de la marque).

   Inspiration assumée des jeux de « paper toss » (vue subjective, boulette au
   premier plan, poubelle au loin, pastille de vent à chevrons, ratés au sol),
   transposée dans l'univers du festival À Dos d'Arts : on regarde un chemin qui
   s'enfonce vers la scène, bordé de feuillage jungle, sous une guirlande
   lumineuse. Une poubelle de tri se trouve plus ou moins loin (au hasard) ; un
   vent de travers (au hasard) dévie le lancer.

   On lance d'un GESTE : clic + glissé (souris) ou swipe (tactile) vers le haut,
   en direction de la poubelle. Geste ample = lancer puissant ; inclinaison
   gauche/droite = visée ; il faut compenser le vent.

   Rendu : projection perspective (sténopé), monde 3D (x latéral, y hauteur,
   z profondeur). Physique : balistique + accélération latérale du vent.
   ========================================================================== */

const W = 800, H = 450;
const HORIZON = 180;
const FOCAL = 340;
const EYE_H = 58;
const CENTER_X = W / 2;

const G = 900;
const WIND_MAX = 110;   // vent volontairement modéré : déviation rattrapable (cf. « paper toss »)
const SESSION_TIME = 25; // durée d'une partie, en secondes

const POWER_PX = 240;
const MIN_UP = 22;
const VX_PER_PX = 1.15;
const VX_MAX = 240;

const C = {
  skyGlowTop: "#f6a93c",
  skyGlowBot: "#ec683b",
  wallTop: "#16504f",
  wallBot: "#0c3b3a",
  grassNear: "#0c7a3c",
  grassFar: "#2f8f57",
  path: "#d8b072",
  pathFar: "#c69a59",
  plank: "rgba(120,78,34,0.35)",
  bin: "#ec683b",
  binDark: "#c0431f",
  binRim: "#27367e",
  binInner: "#231b12",
  ink: "#1a1430",
  bulb: "#ffe27a",
  bulbGlow: "rgba(255,214,33,0.45)",
  shadow: "rgba(10,20,15,0.28)",
  paper: "#fbf7ee",
  paperShade: "#cfc7b4",
  aim: "#ffd621",
  pill: "#f08111",
  pillEdge: "#c4610a",
};

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Habillage : feuilles de la marque + illustrations extraites des sources
// client (ciel coucher de soleil, platelage bois, herbe, feuilles volantes).
const ASSETS = (() => {
  const load = (src) => { const i = new Image(); i.src = src; return i; };
  return {
    leafA: load("assets/img/elements/feuille-1-0.svg"),
    leafB: load("assets/img/elements/feuille-2-0.svg"),
    paper: load("assets/img/boule-papier.svg"),   // boulette froissée (240×240)
    bin: load("assets/img/corbeille.svg"),         // corbeille de tri (240×260)
    sky: load("assets/img/jeu/ciel.png"),          // ciel coucher de soleil
    wood: load("assets/img/jeu/sol-bois.png"),     // texture platelage bois (chemin)
    grass: load("assets/img/jeu/touffes-herbe.svg"), // touffes d'herbe vectorielles (3 variantes)
    leaves: load("assets/img/jeu/feuilles-vent.svg"), // feuilles au vent (5 variantes)
  };
})();

// Découpe des 3 touffes dans le SVG (viewBox 600×360). Pour chacune : rectangle
// source + point d'ancrage au pied (bx,by) afin de la poser sur le sol en
// respectant la perspective du joueur.
const GRASS_TUFTS = [
  { sx: 66,  sy: 126, sw: 172, sh: 221, bx: 151, by: 333 },
  { sx: 272, sy: 187, sw: 121, sh: 162, bx: 332, by: 335 },
  { sx: 382, sy: 153, sw: 148, sh: 194, bx: 456, by: 333 },
];
// Bande d'herbe (les 3 touffes) pour habiller la ligne d'horizon.
const GRASS_STRIP = { sx: 60, sy: 150, sw: 472, sh: 195 };

// Découpe des 5 feuilles dans le SVG « feuilles au vent » (viewBox 660×200),
// pour piocher une feuille différente par projectile volant.
const LEAVES = [
  { sx: 37,  sy: 43, sw: 98,  sh: 74 },
  { sx: 177, sy: 65, sw: 86,  sh: 68 },
  { sx: 301, sy: 37, sw: 108, sh: 90 },
  { sx: 437, sy: 73, sw: 114, sh: 44 },
  { sx: 573, sy: 55, sw: 74,  sh: 68 },
];

export function initGamePoubelle(root) {
  if (!root) return;
  const canvas = root.querySelector("[data-jeu-canvas]");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  const nextBtn = root.querySelector("[data-jeu-suivant]");
  const startBtn = root.querySelector("[data-jeu-demarrer]");
  const windOut = root.querySelector("[data-jeu-vent]");
  const distOut = root.querySelector("[data-jeu-distance]");
  const timerOut = root.querySelector("[data-jeu-timer]");
  const scoreOut = root.querySelector("[data-jeu-score]");
  const statusOut = root.querySelector("[data-jeu-status]");

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Touffes d'herbe et feuilles volantes (décor).
  const tufts = Array.from({ length: 60 }, () => ({ x: rand(-340, 340), z: rand(40, 480) }))
    .sort((a, b) => b.z - a.z);
  const flyers = Array.from({ length: 12 }, () => ({ x: rand(-300, 300), y: rand(30, 130), z: rand(70, 440), r: rand(0, 6.28) }));
  // Guirlande : positions des ampoules le long de courbes en chaînette.
  const strands = [
    { y: 16, sag: 40, n: 12 },
    { y: 46, sag: 70, n: 10 },
  ];

  const state = {
    phase: "aim",
    session: "ready",        // ready | playing | over
    timeLeft: SESSION_TIME,
    bestSession: 0,
    bin: { x: 0, dist: 300 },
    wind: 0,
    score: 0,
    tries: 0,
    ball: null,
    landed: null,
    misses: [],          // ratés au sol {x,z}
    swayPhase: 0,
    drag: null,
    kbAim: 0,
    kbPower: 0.55,
    ballSpin: rand(0, 6.28),
    flash: null,        // compte à rebours furtif des 5 dernières secondes {n,t0}
    lastSec: null,
  };

  /* ----------------------------------------------------- Projection 3D→2D */
  function project(x, y, z) {
    const s = FOCAL / z;
    return { sx: CENTER_X + x * s, sy: HORIZON - (y - EYE_H) * s, s };
  }

  /* ------------------------------------------------------------- Manche */
  function newRound() {
    state.bin.dist = rand(200, 360);
    state.bin.x = rand(-26, 26);
    state.wind = rand(-WIND_MAX, WIND_MAX);
    state.ball = null;
    state.landed = null;
    state.misses = [];
    state.phase = "aim";
    state.drag = null;
    if (distOut) distOut.textContent = `${Math.round(state.bin.dist / 9)} m`;
    if (windOut) windOut.textContent = describeWind(state.wind);
    setStatus("Visez la corbeille et lancez ! Compensez le vent de travers.");
  }

  /* ----------------------------------------------------------- Session */
  function updateTimer() {
    if (!timerOut) return;
    const s = Math.max(0, Math.ceil(state.timeLeft));
    timerOut.textContent = `${s} s`;
    timerOut.classList.toggle("is-low", state.session === "playing" && s <= 5);
  }

  function startSession() {
    state.session = "playing";
    state.timeLeft = SESSION_TIME;
    state.score = 0;
    state.tries = 0;
    state.misses = [];
    state.flash = null;
    state.lastSec = null;
    updateScore();
    updateTimer();
    if (startBtn) startBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = false;
    newRound();
  }

  function endSession() {
    state.session = "over";
    state.phase = "result";
    state.ball = null;
    state.drag = null;
    updateTimer();
    const isRecord = state.score > state.bestSession && state.score > 0;
    state.bestSession = Math.max(state.bestSession, state.score);
    if (startBtn) { startBtn.hidden = false; startBtn.textContent = "Rejouer"; }
    if (nextBtn) nextBtn.hidden = true;
    const n = state.score;
    const tail = isRecord ? " 🏆 Nouveau record !" : (state.bestSession ? ` (record : ${state.bestSession})` : "");
    setStatus(`⏱️ Temps écoulé ! ${n} déchet${n > 1 ? "s" : ""} dans la corbeille en ${SESSION_TIME} s.${tail} Appuyez sur « Rejouer ».`);
  }

  function readyScreen() {
    state.session = "ready";
    state.phase = "aim";
    state.ball = null;
    state.landed = null;
    state.misses = [];
    state.flash = null;
    state.lastSec = null;
    state.timeLeft = SESSION_TIME;
    state.bin.dist = 280; state.bin.x = 0; state.wind = 0;
    if (distOut) distOut.textContent = `${Math.round(state.bin.dist / 9)} m`;
    if (windOut) windOut.textContent = describeWind(state.wind);
    updateScore();
    updateTimer();
    if (startBtn) { startBtn.hidden = false; startBtn.textContent = "Démarrer la partie"; }
    if (nextBtn) nextBtn.hidden = true;
    setStatus(`Mettez un maximum de déchets dans la corbeille en ${SESSION_TIME} secondes. Appuyez sur « Démarrer la partie ».`);
  }

  function describeWind(w) {
    const kmh = Math.round((Math.abs(w) / WIND_MAX) * 55);
    if (kmh < 4) return "Vent nul — conditions idéales.";
    const dir = w > 0 ? "vers la droite ▶" : "◀ vers la gauche";
    const f = kmh < 20 ? "léger" : kmh < 38 ? "modéré" : "fort";
    return `Vent ${f} ${dir} (${kmh} km/h)`;
  }
  const setStatus = (m) => { if (statusOut) statusOut.textContent = m; };
  const updateScore = () => { if (scoreOut) scoreOut.textContent = `${state.score} / ${state.tries}`; };

  /* -------------------------------------------------------------- Lancer */
  function makeVelocity(vx, p) {
    return { vx, vy: 175 + p * 285, vz: 150 + p * 365 };
  }
  function launch(vx, p) {
    if (state.phase === "flying") return;
    const v = makeVelocity(vx, clamp(p, 0, 1));
    state.ball = { x: 0, y: 42, z: 12, vx: v.vx, vy: v.vy, vz: v.vz, spin: state.ballSpin };
    state.landed = null;
    state.phase = "flying";
    state.tries += 1;
    updateScore();
    setStatus("En vol…");
  }

  function step(dt) {
    const b = state.ball;
    if (!b) return;
    b.vx += state.wind * dt;
    b.vy -= G * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    b.spin += dt * 9;

    const bin = state.bin, hBin = 46, rx = 42, rz = 58;
    const inFp = Math.abs(b.x - bin.x) <= rx && Math.abs(b.z - bin.dist) <= rz;
    // Plus indulgent : la boulette compte dès qu'elle redescend dans l'emprise du
    // panier, sans devoir franchir le rebord au pixel près (cf. jeux « paper toss »).
    if (b.vy < 0 && b.y <= hBin && inFp) { b.y = hBin - 4; land("in"); return; }
    if (b.y <= 0 || b.z > 540) land("out");
  }

  function land(result) {
    if (state.landed) return;
    state.landed = result;
    state.phase = "result";
    if (result === "in") {
      state.score += 1;
      updateScore();
      setStatus("🎯 Dans le mille ! Un déchet de moins dans la nature. Au suivant…");
      setTimeout(() => { if (state.session === "playing") newRound(); }, 600);
    } else {
      const b = state.ball;
      if (b) state.misses.push({ x: clamp(b.x, -120, 120), z: clamp(b.z, 60, 500) });
      if (state.misses.length > 8) state.misses.shift();
      updateScore();
      setStatus("Raté ! Le déchet tombe à côté. On retente, compensez le vent.");
      setTimeout(() => {
        if (state.session === "playing" && state.phase === "result") { state.ball = null; state.landed = null; state.phase = "aim"; state.ballSpin = rand(0, 6.28); }
      }, 550);
    }
  }

  function predict(vx, p) {
    const v = makeVelocity(vx, clamp(p, 0, 1));
    let x = 0, y = 42, z = 12, vy = v.vy;
    const pts = [], dt = 0.02;
    for (let i = 0; i < 200; i++) {
      v.vx += state.wind * dt; vy -= G * dt;
      x += v.vx * dt; y += vy * dt; z += v.vz * dt;
      if (z > 2) pts.push({ x, y, z });
      if (y <= 0 || z > 540) break;
    }
    return pts;
  }

  /* ---------------------------------------------- Briques de dessin */

  /** Boulette de papier froissé (ombrée), centrée (cx,cy), rayon r. */
  function paperBall(cx, cy, r, rot) {
    // SVG de marque si chargé : on le dessine centré, mis à l'échelle sur 2r.
    const img = ASSETS.paper;
    if (img.complete && img.naturalWidth) {
      const d = r * 2.2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.drawImage(img, -d / 2, -d / 2, d, d);
      ctx.restore();
      return;
    }
    // Repli : boulette dessinée au canvas.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r * 1.15);
    g.addColorStop(0, C.paper);
    g.addColorStop(1, C.paperShade);
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(80,72,55,0.5)";
    ctx.lineWidth = Math.max(0.6, r * 0.05);
    ctx.beginPath();
    const pts = 11;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = r * (0.82 + ((i * 53) % 7) / 7 * 0.3);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // plis
    ctx.strokeStyle = "rgba(120,110,90,0.45)";
    ctx.lineWidth = Math.max(0.5, r * 0.04);
    for (const [a, b] of [[-0.5, 0.6], [0.3, -0.4], [-0.8, -0.2]]) {
      ctx.beginPath();
      ctx.moveTo(a * r, b * r);
      ctx.quadraticCurveTo(0, 0, -b * r, a * r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBackdrop() {
    // Ciel coucher de soleil : illustration si chargée, sinon dégradé chaud.
    const skyImg = ASSETS.sky;
    if (skyImg.complete && skyImg.naturalWidth) {
      const dw = W;
      const dh = dw * (skyImg.naturalHeight / skyImg.naturalWidth);
      // bas de l'image (le soleil) calé sur l'horizon ; le haut déborde hors champ
      ctx.drawImage(skyImg, 0, HORIZON + 30 - dh, dw, dh);
    } else {
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 30);
      sky.addColorStop(0, C.skyGlowTop);
      sky.addColorStop(1, C.skyGlowBot);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, HORIZON + 30);
    }

    // Mur de feuillage sombre à l'horizon (festonné)
    const wall = ctx.createLinearGradient(0, HORIZON - 70, 0, HORIZON + 10);
    wall.addColorStop(0, C.wallTop);
    wall.addColorStop(1, C.wallBot);
    ctx.fillStyle = wall;
    ctx.beginPath();
    ctx.moveTo(0, HORIZON);
    for (let x = 0; x <= W; x += 40) {
      ctx.quadraticCurveTo(x + 10, HORIZON - 46, x + 20, HORIZON - 14);
      ctx.quadraticCurveTo(x + 30, HORIZON - 40, x + 40, HORIZON - 10);
    }
    ctx.lineTo(W, HORIZON + 12);
    ctx.lineTo(0, HORIZON + 12);
    ctx.closePath();
    ctx.fill();
  }

  function drawLights() {
    for (const s of strands) {
      // câble
      ctx.strokeStyle = "rgba(20,16,30,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, s.y);
      ctx.quadraticCurveTo(W / 2, s.y + s.sag, W + 10, s.y);
      ctx.stroke();
      // ampoules
      for (let i = 0; i <= s.n; i++) {
        const t = i / s.n;
        const x = -10 + t * (W + 20);
        const y = s.y + Math.sin(Math.PI * t) * s.sag;
        const tw = 0.7 + 0.3 * Math.sin(state.swayPhase * 2 + i);
        ctx.fillStyle = C.bulbGlow;
        ctx.beginPath(); ctx.arc(x, y + 6, 6 * tw, 0, 6.28); ctx.fill();
        ctx.fillStyle = C.bulb;
        ctx.beginPath(); ctx.arc(x, y + 6, 3, 0, 6.28); ctx.fill();
      }
    }
  }

  // Demi-largeur du chemin (en x monde) à une profondeur z donnée.
  const pathHalf = (z) => 150 - (150 - 46) * clamp(z / 470, 0, 1);

  function drawGround() {
    // herbe (plan vert de base)
    const grass = ctx.createLinearGradient(0, HORIZON, 0, H);
    grass.addColorStop(0, C.grassFar);
    grass.addColorStop(1, C.grassNear);
    ctx.fillStyle = grass;
    ctx.fillRect(0, HORIZON, W, H - HORIZON);

    // bande d'herbe le long de la ligne d'horizon (touffes du SVG, répétées
    // avec recouvrement pour combler les creux et former un liseré continu)
    const grassImg = ASSETS.grass;
    if (grassImg.complete && grassImg.naturalWidth) {
      const bh = 30, scale = bh / GRASS_STRIP.sh, bw = GRASS_STRIP.sw * scale;
      for (let x = -bw * 0.4; x < W + bw; x += bw * 0.6) {
        ctx.drawImage(grassImg, GRASS_STRIP.sx, GRASS_STRIP.sy, GRASS_STRIP.sw, GRASS_STRIP.sh,
          x, HORIZON - bh + 8, bw, bh);
      }
    }

    // chemin central en perspective (trapèze) vers la poubelle
    const pNearL = project(-150, 0, 14), pNearR = project(150, 0, 14);
    const pFarL = project(-46, 0, 470), pFarR = project(46, 0, 470);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pNearL.sx, pNearL.sy);
    ctx.lineTo(pNearR.sx, pNearR.sy);
    ctx.lineTo(pFarR.sx, pFarR.sy);
    ctx.lineTo(pFarL.sx, pFarL.sy);
    ctx.closePath();

    const wood = ASSETS.wood;
    if (wood.complete && wood.naturalWidth) {
      // platelage bois : on découpe au trapèze puis on étire la texture dessus
      ctx.clip();
      const top = pFarL.sy, bot = pNearL.sy;
      ctx.drawImage(wood, 0, top, W, bot - top);
      // assombrissement vers le fond pour la profondeur
      const fade = ctx.createLinearGradient(0, top, 0, bot);
      fade.addColorStop(0, "rgba(40,24,8,0.45)");
      fade.addColorStop(0.4, "rgba(40,24,8,0.10)");
      fade.addColorStop(1, "rgba(40,24,8,0)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, top, W, bot - top);
    } else {
      const pg = ctx.createLinearGradient(0, HORIZON, 0, H);
      pg.addColorStop(0, C.pathFar);
      pg.addColorStop(1, C.path);
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = C.plank;
      ctx.lineWidth = 1.5;
      for (let z = 40; z <= 460; z += 36) {
        const a = project(-pathHalf(z), 0, z);
        const b = project(pathHalf(z), 0, z);
        ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      }
    }
    ctx.restore();

    // touffes d'herbe en perspective, de part et d'autre du chemin : chaque
    // touffe est posée au sol (pied ancré au point projeté) et dimensionnée
    // selon sa distance, pour rester cohérente avec le point de vue du joueur.
    const lean = (state.wind / WIND_MAX) * 0.16;
    let idx = 0;
    for (const t of tufts) {
      idx++;
      if (Math.abs(t.x) < pathHalf(t.z) + 6) continue; // pas d'herbe sur le platelage
      const p = project(t.x, 0, t.z);
      if (p.s <= 0) continue;
      const sway = lean + Math.sin(state.swayPhase + t.x * 0.05) * 0.05;
      if (grassImg.complete && grassImg.naturalWidth) {
        const src = GRASS_TUFTS[idx % GRASS_TUFTS.length];
        const hScreen = clamp(82 * p.s, 10, 160);
        const sc = hScreen / src.sh;
        const lx = (src.bx - src.sx) * sc;   // pied dans le repère destination
        const ly = (src.by - src.sy) * sc;
        ctx.save();
        ctx.translate(p.sx, p.sy);
        ctx.rotate(sway);
        ctx.drawImage(grassImg, src.sx, src.sy, src.sw, src.sh,
          -lx, -ly, src.sw * sc, src.sh * sc);
        ctx.restore();
      } else {
        const h = 16 * p.s;
        ctx.strokeStyle = "rgba(8,60,30,0.8)";
        ctx.lineWidth = Math.max(0.8, 1.4 * p.s);
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.quadraticCurveTo(p.sx + sway * 18 * p.s, p.sy - h * 0.6, p.sx + sway * 30 * p.s, p.sy - h);
        ctx.stroke();
      }
    }
  }

  function drawMisses() {
    const all = state.misses.map((m) => ({ ...m, p: project(m.x, 0, m.z) }))
      .sort((a, b) => b.z - a.z);
    for (const m of all) {
      if (m.p.s <= 0) continue;
      const r = 9 * m.p.s;
      ctx.fillStyle = C.shadow;
      ctx.beginPath(); ctx.ellipse(m.p.sx, m.p.sy + r * 0.5, r * 1.1, r * 0.45, 0, 0, 6.28); ctx.fill();
      paperBall(m.p.sx, m.p.sy - r * 0.4, r, (m.x + m.z) % 6.28);
    }
  }

  function drawBin() {
    const { x, dist } = state.bin;
    const halfW = 30, hBin = 62;
    const baseL = project(x - halfW, 0, dist), baseR = project(x + halfW, 0, dist);
    const topL = project(x - halfW, hBin, dist), topR = project(x + halfW, hBin, dist);
    const s = baseL.s;
    const cxTop = (topL.sx + topR.sx) / 2, cyTop = (topL.sy + topR.sy) / 2;
    const rxTop = (topR.sx - topL.sx) / 2, ryTop = Math.max(5, rxTop * 0.32);

    // ombre portée
    ctx.fillStyle = C.shadow;
    ctx.beginPath();
    ctx.ellipse((baseL.sx + baseR.sx) / 2, baseL.sy, (baseR.sx - baseL.sx) / 2 + 8, ryTop + 5, 0, 0, 6.28);
    ctx.fill();

    // SVG de marque si chargé : corbeille posée au sol, centrée sur (x,dist).
    const binImg = ASSETS.bin;
    if (binImg.complete && binImg.naturalWidth) {
      const cx = (baseL.sx + baseR.sx) / 2;
      const w = (baseR.sx - baseL.sx) * 1.35;          // un poil plus large que l'empreinte
      const h = w * (binImg.naturalHeight / binImg.naturalWidth);
      ctx.drawImage(binImg, cx - w / 2, baseL.sy - h, w, h);
      return;
    }

    // corps (tronc de cône)
    const body = ctx.createLinearGradient(topL.sx, 0, topR.sx, 0);
    body.addColorStop(0, C.binDark);
    body.addColorStop(0.5, C.bin);
    body.addColorStop(1, C.binDark);
    ctx.fillStyle = body;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(1.5, 2.4 * s);
    ctx.beginPath();
    ctx.moveTo(topL.sx, cyTop);
    ctx.lineTo(baseL.sx, baseL.sy);
    ctx.quadraticCurveTo((baseL.sx + baseR.sx) / 2, baseL.sy + ryTop * 0.8, baseR.sx, baseR.sy);
    ctx.lineTo(topR.sx, cyTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // intérieur sombre + ouverture
    ctx.fillStyle = C.binInner;
    ctx.beginPath(); ctx.ellipse(cxTop, cyTop, rxTop - 1, ryTop, 0, 0, 6.28); ctx.fill();
    // rebord
    ctx.strokeStyle = C.binRim;
    ctx.lineWidth = Math.max(2, 4 * s);
    ctx.beginPath(); ctx.ellipse(cxTop, cyTop, rxTop, ryTop, 0, 0, 6.28); ctx.stroke();

    // pictogramme recyclage sur le corps
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `bold ${Math.round(26 * s)}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("♻", cxTop, (cyTop + baseL.sy) / 2);
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  }

  /** Pastille de vent à chevrons, façon « paper toss », placée près de la poubelle. */
  function drawWindPill() {
    // Ancrée bien au-dessus du rebord de la poubelle, sans la recouvrir.
    const binTop = project(state.bin.x, 70, state.bin.dist);
    const val = (Math.abs(state.wind) / WIND_MAX * 6).toFixed(2);
    const right = state.wind >= 0;
    const w = 96, h = 34;
    const px = clamp(binTop.sx - w / 2, 8, W - w - 8);
    const py = clamp(binTop.sy - h - 26, 40, HORIZON - h - 6);

    ctx.save();
    ctx.translate(px, py);
    // corps de la pastille
    ctx.fillStyle = C.pill;
    ctx.strokeStyle = C.pillEdge;
    ctx.lineWidth = 2;
    roundRect(0, 0, w, h, 8);
    ctx.fill(); ctx.stroke();
    // valeur
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(val, 10, h / 2 + 1);
    // chevrons animés dans le sens du vent
    const t = (state.swayPhase * 2) % 1;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i++) {
      const prog = (t + i / 3) % 1;
      const cxp = right ? (w - 30 + prog * 16) : (28 - prog * 16);
      const dir = right ? 1 : -1;
      ctx.globalAlpha = 0.4 + 0.6 * (1 - prog);
      ctx.beginPath();
      ctx.moveTo(cxp - dir * 5, h / 2 - 6);
      ctx.lineTo(cxp + dir * 5, h / 2);
      ctx.lineTo(cxp - dir * 5, h / 2 + 6);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  }

  function drawFlyingBall() {
    const b = state.ball;
    if (!b || b.z <= 0) return;
    const sh = project(b.x, 0, b.z);
    ctx.fillStyle = C.shadow;
    ctx.beginPath(); ctx.ellipse(sh.sx, sh.sy, 10 * sh.s + 2, 4 * sh.s + 1, 0, 0, 6.28); ctx.fill();
    const p = project(b.x, b.y, b.z);
    paperBall(p.sx, p.sy, Math.max(4, 12 * p.s), b.spin);
  }

  function drawForegroundBall() {
    if (state.phase !== "aim") return;
    let lift = 0, side = 0;
    if (state.drag) { lift = clamp(state.drag.y0 - state.drag.y, 0, 160) * 0.4; side = (state.drag.x - state.drag.x0) * 0.3; }
    const cx = CENTER_X + side, cy = H - 46 - lift, r = 38;
    ctx.fillStyle = C.shadow;
    ctx.beginPath(); ctx.ellipse(CENTER_X, H - 18, 46, 14, 0, 0, 6.28); ctx.fill();
    paperBall(cx, cy, r, state.ballSpin);
  }

  function drawAim() {
    if (state.phase !== "aim") return;
    let vx, p;
    if (state.drag) {
      const d = pointerToThrow(state.drag); vx = d.vx; p = d.power;
    } else { vx = state.kbAim * VX_MAX; p = state.kbPower; }
    const pts = predict(vx, p);
    ctx.fillStyle = "rgba(255,214,33,0.9)";
    for (let i = 0; i < pts.length; i += 4) {
      if (pts[i].z < 60) continue; // évite les points trop proches (projetés en énormes disques)
      const pp = project(pts[i].x, pts[i].y, pts[i].z);
      ctx.beginPath(); ctx.arc(pp.sx, pp.sy, clamp(2.4 * pp.s, 1.4, 5), 0, 6.28); ctx.fill();
    }
    const last = pts[pts.length - 1];
    if (last) {
      const g = project(last.x, 0, last.z);
      ctx.strokeStyle = C.aim; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(g.sx, g.sy, 12 * g.s + 4, 5 * g.s + 2, 0, 0, 6.28); ctx.stroke();
    }
  }

  function drawFoliageFrame() {
    // Grandes feuilles de marque en cadrage (coins bas), si chargées.
    const a = ASSETS.leafA, b = ASSETS.leafB;
    if (a.complete && a.naturalWidth) {
      const sway = Math.sin(state.swayPhase) * 0.04 + (state.wind / WIND_MAX) * 0.05;
      ctx.save(); ctx.translate(-30, H + 40); ctx.rotate(-0.5 + sway); ctx.globalAlpha = 0.96;
      ctx.drawImage(a, 0, 0, 230, 283); ctx.restore();
    }
    if (b.complete && b.naturalWidth) {
      const sway = Math.cos(state.swayPhase) * 0.04 + (state.wind / WIND_MAX) * 0.05;
      ctx.save(); ctx.translate(W + 30, H + 50); ctx.scale(-1, 1); ctx.rotate(-0.5 + sway); ctx.globalAlpha = 0.96;
      ctx.drawImage(b, 0, 0, 250, 308); ctx.restore();
    }
  }

  function drawFlyers(dt) {
    for (let i = 0; i < flyers.length; i++) {
      const l = flyers[i];
      l.x += state.wind * dt * 0.6; l.r += dt * 2 * (state.wind >= 0 ? 1 : -1);
      if (l.x > 340) l.x = -340; if (l.x < -340) l.x = 340;
      const p = project(l.x, l.y, l.z);
      if (p.s <= 0 || p.sy < 0) continue;
      const leafImg = ASSETS.leaves;
      if (leafImg.complete && leafImg.naturalWidth) {
        const src = LEAVES[i % LEAVES.length];
        const w = clamp(30 * p.s, 7, 44);
        const h = w * (src.sh / src.sw);
        ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(l.r); ctx.globalAlpha = 0.95;
        ctx.drawImage(leafImg, src.sx, src.sy, src.sw, src.sh, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else {
        const size = 6 * p.s;
        ctx.save(); ctx.translate(p.sx, p.sy); ctx.rotate(l.r);
        ctx.fillStyle = "rgba(0,152,58,0.85)";
        ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.45, 0, 0, 6.28); ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawKbHint() {
    if (state.phase !== "aim" || state.drag || state.session !== "playing") return;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText("Clavier : ←/→ viser · ↑/↓ puissance · Entrée pour lancer", 14, H - 12);
  }

  /** Chiffre du compte à rebours (5→1) : surgit en grand au centre, fondu sortant. */
  function drawCountdown(now) {
    const f = state.flash;
    if (!f) return;
    const DUR = 750;                         // durée d'apparition (ms)
    const t = (now - f.t0) / DUR;
    if (t >= 1) { state.flash = null; return; }
    const alpha = Math.max(0, 1 - t * t);    // fondu sortant rapide
    const scale = 0.7 + t * 0.8;             // léger zoom en sortie
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 170px 'Arial Black', system-ui, sans-serif";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(26,20,48,0.85)";
    ctx.lineWidth = 14;
    ctx.strokeText(String(f.n), 0, 0);
    ctx.fillStyle = C.aim;
    ctx.fillText(String(f.n), 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ----------------------------------------------------------- Boucle */
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    state.swayPhase += dt;

    if (state.session === "playing") {
      state.timeLeft -= dt;
      // Compte à rebours furtif : à chaque seconde entière de 5 à 1, le chiffre
      // surgit en grand au centre puis disparaît en fondu (cf. drawCountdown).
      const sec = Math.ceil(state.timeLeft);
      if (sec !== state.lastSec) {
        if (sec >= 1 && sec <= 5) state.flash = { n: sec, t0: now };
        state.lastSec = sec;
      }
      if (state.timeLeft <= 0) { state.timeLeft = 0; endSession(); }
      updateTimer();
    }

    if (state.phase === "flying" && state.landed === null) {
      step(dt / 2); if (state.landed === null) step(dt / 2);
    }

    ctx.clearRect(0, 0, W, H);
    drawBackdrop();
    drawLights();
    drawGround();
    drawFlyers(dt);
    drawMisses();
    drawBin();
    drawWindPill();
    drawAim();
    drawFlyingBall();
    drawFoliageFrame();
    drawForegroundBall();
    drawKbHint();
    drawCountdown(now);

    requestAnimationFrame(frame);
  }

  /* --------------------------------------------------------- Entrées */
  function toCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) };
  }
  function pointerToThrow(drag) {
    const dx = drag.x - drag.x0, up = drag.y0 - drag.y;
    return { vx: clamp(dx * VX_PER_PX, -VX_MAX, VX_MAX), power: clamp(up / POWER_PX, 0, 1), up };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (state.session !== "playing" || state.phase === "flying") return;
    const p = toCanvas(e);
    state.drag = { x0: p.x, y0: p.y, x: p.x, y: p.y };
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!state.drag) return;
    const p = toCanvas(e); state.drag.x = p.x; state.drag.y = p.y; e.preventDefault();
  });
  function endDrag(e) {
    if (!state.drag) return;
    const { vx, power, up } = pointerToThrow(state.drag);
    state.drag = null;
    if (up >= MIN_UP) launch(vx, power);
    else setStatus("Geste trop court : glissez plus franchement vers le haut, vers la poubelle.");
    e?.preventDefault?.();
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  canvas.setAttribute("tabindex", "0");
  canvas.addEventListener("keydown", (e) => {
    if (state.session !== "playing" || state.phase === "flying") return;
    switch (e.key) {
      case "ArrowLeft": state.kbAim = clamp(state.kbAim - 0.1, -1, 1); break;
      case "ArrowRight": state.kbAim = clamp(state.kbAim + 0.1, -1, 1); break;
      case "ArrowUp": state.kbPower = clamp(state.kbPower + 0.07, 0, 1); break;
      case "ArrowDown": state.kbPower = clamp(state.kbPower - 0.07, 0, 1); break;
      case "Enter": case " ": launch(state.kbAim * VX_MAX, state.kbPower); break;
      default: return;
    }
    e.preventDefault();
  });

  nextBtn?.addEventListener("click", () => { if (state.session === "playing") newRound(); });
  startBtn?.addEventListener("click", startSession);

  updateScore();
  readyScreen();
  requestAnimationFrame(frame);
}
