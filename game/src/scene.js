// Night-market scene for "Pasar Malam — Cari 7 Perbedaan".
// Two panels are drawn by the same function; variant 0 is the left picture,
// variant 1 is the right picture with exactly 7 differences. Everything is
// deterministic: stars come from a fixed-seed generator, no Math.random,
// no clock reads, so the two panels match except for the listed differences.

export const PANEL_W = 600;
export const PANEL_H = 480;

// Each difference: centre + radius in panel-local coordinates, and a label
// used by the HUD / screen-reader status line. The radius is the click
// target; the drawn change sits inside it.
export const DIFFERENCES = [
  { x: 520, y: 72, r: 40, label: 'bentuk bulan' },
  { x: 318, y: 168, r: 46, label: 'warna atap kios tengah' },
  { x: 550, y: 212, r: 28, label: 'lampion yang hilang' },
  { x: 55, y: 250, r: 30, label: 'balon merah' },
  { x: 500, y: 362, r: 34, label: 'kucing di konter' },
  { x: 275, y: 108, r: 24, label: 'warna bendera' },
  { x: 320, y: 280, r: 38, label: 'lampu jendela kios tengah' },
];

// Fixed-seed pseudo-random numbers, so star placement is identical on every
// run and on both panels.
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function stripes(ctx, x, y, w, h, a, b, n) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 === 0 ? a : b;
    ctx.fillRect(x + (i * w) / n, y, w / n + 1, h);
  }
}

function awning(ctx, x, y, w, a, b) {
  // Sloped awning: striped top, scalloped edge.
  stripes(ctx, x, y, w, 26, a, b, 10);
  ctx.fillStyle = a;
  ctx.fillRect(x, y + 26, w, 6);
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(x + ((i + 0.5) * w) / 10, y + 32, w / 20, 0, Math.PI);
    ctx.fillStyle = i % 2 === 0 ? a : b;
    ctx.fill();
  }
}

function lantern(ctx, x, y, color) {
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 26);
  ctx.lineTo(x, y - 12);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 40, 20, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - 5, 13, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 13, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(x - 1, y + 16, 2, 8);
}

function drawMoon(ctx, variant) {
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(520, 72, 34, 0, Math.PI * 2);
  ctx.fill();
  if (variant === 0) {
    // Full moon with craters.
    ctx.fillStyle = 'rgba(200, 160, 90, 0.55)';
    ctx.beginPath(); ctx.arc(508, 62, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(530, 80, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(516, 88, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    // Crescent: cover part of the disc with sky colour.
    ctx.fillStyle = '#3a2a63';
    ctx.beginPath();
    ctx.arc(534, 64, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStall(ctx, x, awningA, awningB, sign, variant) {
  // Posts and counter.
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x + 6, 186, 8, 200);
  ctx.fillRect(x + 186, 186, 8, 200);
  ctx.fillStyle = '#7a4a28';
  ctx.fillRect(x, 378, 200, 16);
  ctx.fillStyle = '#93582f';
  ctx.fillRect(x, 378, 200, 5);
  awning(ctx, x, 150, 200, awningA, awningB);
  // Sign board on the awning.
  ctx.fillStyle = '#2c1c10';
  ctx.fillRect(x + 62, 196, 76, 24);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sign, x + 100, 209);
  // Back wall.
  ctx.fillStyle = '#241a33';
  ctx.fillRect(x + 14, 226, 172, 152);
}

export function drawScene(ctx, ox, oy, variant) {
  ctx.save();
  ctx.translate(ox, oy);

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 300);
  sky.addColorStop(0, '#241645');
  sky.addColorStop(0.55, '#4a2a63');
  sky.addColorStop(1, '#c65a3c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PANEL_W, 300);

  // Stars (identical both sides).
  const rnd = seeded(20261121);
  ctx.fillStyle = '#fff6c9';
  for (let i = 0; i < 42; i++) {
    const sx = rnd() * PANEL_W;
    const sy = 8 + rnd() * 150;
    const sr = 0.8 + rnd() * 1.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  drawMoon(ctx, variant);

  // String lights across the top.
  ctx.strokeStyle = '#1d1426';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 44);
  ctx.quadraticCurveTo(300, 66, 600, 44);
  ctx.stroke();
  const bulbColors = ['#ffd76a', '#ff7a6b', '#7ad7ff', '#9dff8a'];
  for (let i = 0; i < 13; i++) {
    const bx = 24 + i * 46;
    const by = 44 + Math.sin((bx / 600) * Math.PI) * 20 + 4;
    ctx.fillStyle = bulbColors[i % 4];
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bunting flags. Flag index 5 is difference #6.
  ctx.strokeStyle = '#1d1426';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 92);
  ctx.quadraticCurveTo(300, 108, 600, 92);
  ctx.stroke();
  const flagColors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'];
  for (let i = 0; i < 12; i++) {
    const fx = 25 + i * 50;
    const fy = 94 + Math.sin((fx / 600) * Math.PI) * 14;
    let color = flagColors[i % 5];
    if (i === 5) color = variant === 0 ? '#2ecc71' : '#e67e22';
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(fx - 11, fy);
    ctx.lineTo(fx + 11, fy);
    ctx.lineTo(fx, fy + 22);
    ctx.closePath();
    ctx.fill();
  }

  // Ground.
  ctx.fillStyle = '#2e2138';
  ctx.fillRect(0, 394, PANEL_W, 86);
  ctx.fillStyle = 'rgba(255, 190, 90, 0.12)';
  ctx.beginPath(); ctx.ellipse(120, 430, 110, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(330, 440, 130, 24, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(520, 428, 100, 20, 0, 0, Math.PI * 2); ctx.fill();

  // Stall A — fruit (red/white awning).
  drawStall(ctx, 24, '#d23b2e', '#f6ead2', 'BUAH', variant);
  // Apples on its counter.
  ctx.fillStyle = '#e33e2f';
  for (const [ax, ay] of [[64, 366], [88, 362], [112, 366]]) {
    ctx.beginPath(); ctx.arc(ax, ay, 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#3f9e4d';
  ctx.fillRect(86, 348, 3, 7);
  // A jar next to the apples.
  ctx.fillStyle = '#7ad7ff';
  ctx.fillRect(150, 352, 22, 26);
  ctx.fillStyle = '#d8f2ff';
  ctx.fillRect(150, 352, 22, 6);

  // Stall B — satay (teal/white awning on the left, purple/white on the right).
  drawStall(ctx, 228, variant === 0 ? '#1f8a70' : '#7a4fc0', '#f6ead2', 'SATE', variant);
  // Window: lit warm on the left, dark on the right (difference #7).
  ctx.fillStyle = variant === 0 ? '#ffd76a' : '#1a1430';
  ctx.fillRect(290, 240, 60, 80);
  ctx.strokeStyle = '#2c1c10';
  ctx.lineWidth = 3;
  ctx.strokeRect(290, 240, 60, 80);
  ctx.beginPath();
  ctx.moveTo(320, 240); ctx.lineTo(320, 320);
  ctx.moveTo(290, 280); ctx.lineTo(350, 280);
  ctx.stroke();
  if (variant === 0) {
    ctx.fillStyle = 'rgba(255, 215, 106, 0.25)';
    ctx.beginPath(); ctx.ellipse(320, 330, 46, 12, 0, 0, Math.PI * 2); ctx.fill();
  }
  // Skewers on its counter.
  ctx.strokeStyle = '#caa06a';
  ctx.lineWidth = 3;
  for (const sx of [252, 272, 292]) {
    ctx.beginPath(); ctx.moveTo(sx, 352); ctx.lineTo(sx + 8, 378); ctx.stroke();
  }
  ctx.fillStyle = '#b06a2e';
  for (const sx of [254, 274, 294]) {
    ctx.beginPath(); ctx.arc(sx + 4, 360, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Stall C — lanterns (yellow/white awning).
  drawStall(ctx, 432, '#e8a91c', '#f6ead2', 'LAMPION', variant);
  lantern(ctx, 470, 212, '#ff5a4e');
  lantern(ctx, 510, 222, '#ffd76a');
  if (variant === 0) lantern(ctx, 550, 212, '#7ad7ff');
  // Cat sitting on stall C's counter (difference #5).
  if (variant === 0) {
    ctx.fillStyle = '#3b3b46';
    ctx.beginPath(); ctx.ellipse(500, 368, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(500, 348, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(492, 340); ctx.lineTo(494, 330); ctx.lineTo(499, 339); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(502, 339); ctx.lineTo(507, 330); ctx.lineTo(509, 340); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3b3b46';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(514, 372); ctx.quadraticCurveTo(526, 366, 524, 352); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(496, 347, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(504, 347, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Balloons tied at stall A. The red one is missing on the right.
  ctx.strokeStyle = '#e8dcc8';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(60, 380); ctx.lineTo(55, 268); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, 380); ctx.lineTo(85, 253); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60, 380); ctx.lineTo(115, 268); ctx.stroke();
  if (variant === 0) {
    ctx.fillStyle = '#e33e2f';
    ctx.beginPath(); ctx.ellipse(55, 250, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#3f7de3';
  ctx.beginPath(); ctx.ellipse(85, 235, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath(); ctx.ellipse(115, 250, 14, 18, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Green ring + soft fill marking a found difference on one panel.
export function drawFoundMark(ctx, ox, oy, diff) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, diff.r + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(46, 204, 113, 0.18)';
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, diff.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Pulsing ring for the hint: points at one still-hidden difference.
export function drawHintRing(ctx, ox, oy, diff, t) {
  const pulse = 1 + 0.12 * Math.sin(t / 160);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, (diff.r + 6) * pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
