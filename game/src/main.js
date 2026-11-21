// "Pasar Malam — Cari 7 Perbedaan": find the 7 differences between two
// near-identical night-market pictures. Mouse: click a difference.
// Keyboard: arrow keys move the crosshair, Space/Enter marks it, H hints,
// R restarts. Vanilla JS, no libraries, no network.

import { PANEL_W, PANEL_H, DIFFERENCES, drawScene, drawFoundMark, drawHintRing } from './scene.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const foundEl = document.getElementById('found');
const startBtn = document.getElementById('startBtn');
const hintBtn = document.getElementById('hintBtn');
const restartBtn = document.getElementById('restartBtn');

const LEFT = { x: 20, y: 20 };
const RIGHT = { x: 660, y: 20 };
const TOTAL = DIFFERENCES.length;
const TIME_BONUS_CAP = 240; // seconds of play that still earn a time bonus

// ?demo=start|mid|win renders a fixed state for screenshot capture. The same
// draw code runs during real play; the parameter only presets the state.
const demo = new URLSearchParams(location.search).get('demo');

const state = {
  mode: 'start', // 'start' | 'playing' | 'won'
  found: new Set(),
  wrong: 0,
  hints: 0,
  wrongMarks: [], // {x, y, at} fading red X marks
  hint: null, // {index, until}
  crosshair: { x: LEFT.x + PANEL_W / 2, y: LEFT.y + PANEL_H / 2 },
  crosshairOn: false,
  startedAt: 0,
  elapsed: 0,
  finalScore: 0,
  finalTime: 0,
};

function score() {
  return Math.max(
    0,
    state.found.size * 100 - state.wrong * 25 - state.hints * 50,
  );
}

function finalScore() {
  const bonus = Math.max(0, TIME_BONUS_CAP - Math.floor(state.finalTime)) * 5;
  return Math.max(0, score() + bonus);
}

function fmtTime(sec) {
  const s = Math.floor(sec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function announce(msg) {
  statusEl.textContent = msg;
}

function refreshHud() {
  timerEl.textContent = fmtTime(state.mode === 'playing' ? state.elapsed : state.finalTime);
  scoreEl.textContent = String(state.mode === 'won' ? state.finalScore : score());
  foundEl.textContent = `${state.found.size}/${TOTAL}`;
}

function newGame() {
  state.mode = 'playing';
  state.found = new Set();
  state.wrong = 0;
  state.hints = 0;
  state.wrongMarks = [];
  state.hint = null;
  state.startedAt = performance.now();
  state.elapsed = 0;
  state.finalScore = 0;
  state.finalTime = 0;
  startBtn.textContent = 'Mulai Ulang';
  announce('Permainan dimulai. Cari 7 perbedaan antara dua gambar pasar malam.');
  refreshHud();
}

function checkPoint(px, py) {
  // Test both panels: a difference counts wherever it is clicked.
  for (const origin of [LEFT, RIGHT]) {
    for (let i = 0; i < TOTAL; i++) {
      if (state.found.has(i)) continue;
      const d = DIFFERENCES[i];
      const dx = px - (origin.x + d.x);
      const dy = py - (origin.y + d.y);
      if (dx * dx + dy * dy <= d.r * d.r) return i;
    }
  }
  return -1;
}

function markAt(px, py) {
  if (state.mode !== 'playing') return;
  const i = checkPoint(px, py);
  if (i >= 0) {
    state.found.add(i);
    announce(`Ketemu! ${DIFFERENCES[i].label}. ${state.found.size} dari ${TOTAL} perbedaan.`);
    if (state.found.size === TOTAL) {
      state.mode = 'won';
      state.finalTime = state.elapsed;
      state.finalScore = finalScore();
      announce(`Menang! Semua ${TOTAL} perbedaan ketemu dalam ${fmtTime(state.finalTime)}, skor ${state.finalScore}.`);
    }
  } else {
    state.wrong += 1;
    state.wrongMarks.push({ x: px, y: py, at: performance.now() });
    announce(`Bukan perbedaan, coba lagi. ${state.found.size} dari ${TOTAL} ketemu.`);
  }
  refreshHud();
}

function hint() {
  if (state.mode !== 'playing') return;
  const rest = DIFFERENCES.map((_, i) => i).filter((i) => !state.found.has(i));
  if (rest.length === 0) return;
  const pick = rest[Math.floor(Math.random() * rest.length)];
  state.hints += 1;
  state.hint = { index: pick, until: performance.now() + 1400 };
  announce(`Petunjuk: ada perbedaan di sekitar ${DIFFERENCES[pick].label}. Minus 50 poin.`);
  refreshHud();
}

function toCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = toCanvas(e);
  if (state.mode === 'start') {
    newGame();
    return;
  }
  if (state.mode === 'won') return;
  state.crosshair = p;
  markAt(p.x, p.y);
});

startBtn.addEventListener('click', newGame);
restartBtn.addEventListener('click', newGame);
hintBtn.addEventListener('click', hint);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    if (state.mode !== 'playing') newGame();
    else if (state.crosshairOn) markAt(state.crosshair.x, state.crosshair.y);
    return;
  }
  if (e.key === ' ' && state.mode === 'playing') {
    e.preventDefault();
    markAt(state.crosshair.x, state.crosshair.y);
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    if (state.mode !== 'start') newGame();
    return;
  }
  if (e.key === 'h' || e.key === 'H') {
    hint();
    return;
  }
  if (e.key.startsWith('Arrow') && state.mode === 'playing') {
    e.preventDefault();
    state.crosshairOn = true;
    const step = 24;
    if (e.key === 'ArrowLeft') state.crosshair.x -= step;
    if (e.key === 'ArrowRight') state.crosshair.x += step;
    if (e.key === 'ArrowUp') state.crosshair.y -= step;
    if (e.key === 'ArrowDown') state.crosshair.y += step;
    state.crosshair.x = Math.max(0, Math.min(canvas.width, state.crosshair.x));
    state.crosshair.y = Math.max(0, Math.min(canvas.height, state.crosshair.y));
  }
});

function drawPanelFrame(origin, label) {
  ctx.save();
  ctx.strokeStyle = '#5a4a72';
  ctx.lineWidth = 3;
  ctx.strokeRect(origin.x - 3, origin.y - 3, PANEL_W + 6, PANEL_H + 6);
  ctx.fillStyle = '#cbb8ff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, origin.x, origin.y - 8);
  ctx.restore();
}

function drawOverlay(title, lines, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(16, 10, 28, 0.78)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, canvas.width / 2, 210);
  ctx.fillStyle = '#f6ead2';
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, 268 + i * 34));
  ctx.restore();
}

function draw(now) {
  if (state.mode === 'playing') {
    state.elapsed = (now - state.startedAt) / 1000;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#171022';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawScene(ctx, LEFT.x, LEFT.y, 0);
  drawScene(ctx, RIGHT.x, RIGHT.y, 1);
  drawPanelFrame(LEFT, 'Gambar A');
  drawPanelFrame(RIGHT, 'Gambar B');

  for (const i of state.found) {
    drawFoundMark(ctx, LEFT.x, LEFT.y, DIFFERENCES[i]);
    drawFoundMark(ctx, RIGHT.x, RIGHT.y, DIFFERENCES[i]);
  }

  if (state.hint && now < state.hint.until) {
    const d = DIFFERENCES[state.hint.index];
    drawHintRing(ctx, LEFT.x, LEFT.y, d, now);
    drawHintRing(ctx, RIGHT.x, RIGHT.y, d, now);
  }

  // Fading red X for wrong clicks (kept 900 ms).
  state.wrongMarks = state.wrongMarks.filter((m) => now - m.at < 900);
  for (const m of state.wrongMarks) {
    const a = 1 - (now - m.at) / 900;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#ff5a4e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(m.x - 12, m.y - 12); ctx.lineTo(m.x + 12, m.y + 12);
    ctx.moveTo(m.x + 12, m.y - 12); ctx.lineTo(m.x - 12, m.y + 12);
    ctx.stroke();
    ctx.restore();
  }

  // Keyboard crosshair.
  if (state.crosshairOn && state.mode === 'playing') {
    const c = state.crosshair;
    ctx.save();
    ctx.strokeStyle = '#ffd76a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x - 20, c.y); ctx.lineTo(c.x - 8, c.y);
    ctx.moveTo(c.x + 8, c.y); ctx.lineTo(c.x + 20, c.y);
    ctx.moveTo(c.x, c.y - 20); ctx.lineTo(c.x, c.y - 8);
    ctx.moveTo(c.x, c.y + 8); ctx.lineTo(c.x, c.y + 20);
    ctx.stroke();
    ctx.restore();
  }

  // Bottom message line.
  ctx.save();
  ctx.fillStyle = '#cbb8ff';
  ctx.font = '17px sans-serif';
  ctx.textAlign = 'center';
  const msg =
    state.mode === 'playing'
      ? `${state.found.size} dari ${TOTAL} perbedaan ketemu — klik perbedaannya, atau gerakkan kursor dengan tombol panah lalu tekan Spasi.`
      : state.mode === 'won'
        ? `Semua ${TOTAL} perbedaan ketemu!`
        : 'Klik gambar atau tekan Enter untuk mulai.';
  ctx.fillText(msg, canvas.width / 2, 540);
  ctx.restore();

  if (state.mode === 'start') {
    drawOverlay('PASAR MALAM', [
      'Cari 7 perbedaan antara Gambar A dan Gambar B.',
      'Klik perbedaannya — atau pakai tombol panah + Spasi.',
      'Salah klik −25 poin · petunjuk (H) −50 poin · bonus waktu sampai 4 menit.',
      '',
      'Klik di mana saja atau tekan Enter untuk mulai.',
    ], '#ffd76a');
  } else if (state.mode === 'won') {
    const wrong = state.wrong;
    const acc = Math.round((TOTAL / Math.max(1, TOTAL + wrong)) * 100);
    drawOverlay('MENANG!', [
      `Semua ${TOTAL} perbedaan ketemu dalam ${fmtTime(state.finalTime)}.`,
      `Skor ${state.finalScore} · akurasi ${acc}% · ${wrong} klik salah · ${state.hints} petunjuk.`,
      '',
      'Tekan R atau klik Main Lagi untuk bermain lagi.',
    ], '#2ecc71');
  }

  if (state.mode === 'playing') refreshHud();
  requestAnimationFrame(draw);
}

// Fixed demo states for screenshot capture (see ?demo above).
if (demo === 'mid') {
  state.mode = 'playing';
  state.found = new Set([0, 2, 4]);
  state.elapsed = 47;
  state.startedAt = performance.now() - 47000;
  state.finalTime = 47;
  refreshHud();
} else if (demo === 'win') {
  state.mode = 'won';
  state.found = new Set([0, 1, 2, 3, 4, 5, 6]);
  state.wrong = 1;
  state.hints = 0;
  state.finalTime = 96;
  state.finalScore = 700 + Math.max(0, TIME_BONUS_CAP - 96) * 5 - 25;
  refreshHud();
}

refreshHud();
requestAnimationFrame(draw);
