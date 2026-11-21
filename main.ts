// Entry point for "Pasar Malam — Cari 7 Perbedaan" (Node 22, standard
// library only). The game is plain static files a desktop browser loads
// offline (game/index.html and its ES modules, no library, no network).
// This program copies game/ and screenshots/ from beside this file into the
// output directory and writes /output/dossier.json, the summary the judge
// reads, with the vendored make.fun library.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory itself is never removed: the grader mounts it, so
// deleting the mount point fails. Only its contents are cleared first.
//
// Before anything is written, every input is validated against the same
// caps the scorer enforces, so a bad input fails fast with a clear error
// and leaves the output directory untouched instead of half-built. After
// the dossier is written, it is read back and checked against the files
// actually copied. Validation writes nothing to the output and never
// changes the dossier bytes for a valid input.

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps, used both for validation and for buildDossier.
const TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MIN = 3;
const SCREENSHOTS_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const INDEX_MAX_BYTES = 1048576;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;
const GAME_PATH_MAX_BYTES = 1000;

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast with a clear message on stderr and a non-zero exit. The
// output directory is never touched before this point, so a failure here
// can never leave /output half-built.
function fail(message) {
  process.stderr.write(`main.ts: ${message}\n`);
  process.exit(1);
}

// --- Pre-build validation: reads only, writes nothing. ---

const gameDir = join(here, 'game');
const indexPath = join(gameDir, 'index.html');
if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
  fail('game/index.html is missing');
}
if (statSync(indexPath).size > INDEX_MAX_BYTES) {
  fail(`game/index.html is ${statSync(indexPath).size} bytes, over the 1 MiB cap`);
}

// Walk game/ once: count files and directories together, sum file bytes,
// refuse symlinks and over-long paths — the same limits the scorer
// enforces, checked here before any copying starts.
let gameEntries = 0;
let gameBytes = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = lstatSync(p);
    gameEntries += 1;
    if (st.isSymbolicLink()) fail(`game/ contains a symlink: ${p}`);
    if (Buffer.byteLength(p, 'utf8') > GAME_PATH_MAX_BYTES) {
      fail(`game/ path over the 1000 byte cap: ${p}`);
    }
    if (st.isDirectory()) walk(p);
    else if (st.isFile()) gameBytes += st.size;
  }
}
walk(gameDir);
if (gameEntries > GAME_MAX_FILES) {
  fail(`game/ has ${gameEntries} files and directories, over the 993 cap`);
}
if (gameBytes > GAME_MAX_BYTES) {
  fail(`game/ is ${gameBytes} bytes, over the 48 MiB cap`);
}

const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  fail('screenshots/ is missing');
}
const shotFiles = readdirSync(shotsDir)
  .filter((name) => !name.startsWith('.') && /\.(png|jpe?g)$/i.test(name))
  .sort();
if (shotFiles.length < SCREENSHOTS_MIN || shotFiles.length > SCREENSHOTS_MAX) {
  fail(`screenshots/ holds ${shotFiles.length} images, need 3 or 4`);
}
// Size, format (magic bytes must match the extension) and hash of every
// screenshot, recorded now so the copy can be verified afterwards.
const shotInfo = new Map();
for (const name of shotFiles) {
  const p = join(shotsDir, name);
  const st = statSync(p);
  if (!st.isFile()) fail(`screenshots/${name} is not a regular file`);
  if (st.size > SCREENSHOT_MAX_BYTES) {
    fail(`screenshots/${name} is ${st.size} bytes, over the 256 KiB cap`);
  }
  const buf = readFileSync(p);
  const isPng =
    buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpeg = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
  const wantPng = name.toLowerCase().endsWith('.png');
  if (wantPng ? !isPng : !isJpeg) {
    fail(`screenshots/${name} is not a ${wantPng ? 'PNG' : 'JPEG'} file (bad magic bytes)`);
  }
  shotInfo.set(name, {
    size: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
  });
}

// --- Build: all inputs are valid now, so it is safe to touch output. ---

// Create the output directory if needed, then empty it entry by entry.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Only text_max_bytes shapes the dossier bytes; the other caps refuse an
// entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files in game/ or 48 MiB of game files in all,
// or a path under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    game_max_files: GAME_MAX_FILES,
    game_max_bytes: GAME_MAX_BYTES,
    game_path_max_bytes: GAME_PATH_MAX_BYTES,
  }),
);

// --- Post-write verification: the dossier must describe exactly what
// was copied, and the copied screenshots must match their sources. ---

const dossierPath = join(out, 'dossier.json');
let dossier;
try {
  dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
} catch (err) {
  fail(`dossier.json is not valid JSON: ${err.message}`);
}
if (dossier.schema !== 'makefun/dossier/v1') {
  fail(`dossier.json has an unexpected schema: ${dossier.schema}`);
}
if (typeof dossier.text !== 'string' || Buffer.byteLength(dossier.text, 'utf8') > TEXT_MAX_BYTES) {
  fail('dossier.json text is missing or over the 163840 byte cap');
}
if (!Array.isArray(dossier.images) || dossier.images.length !== shotFiles.length) {
  fail(`dossier.json lists ${Array.isArray(dossier.images) ? dossier.images.length : 0} images, copied ${shotFiles.length}`);
}
if (
  typeof dossier.cover !== 'number' ||
  dossier.cover < 0 ||
  dossier.cover >= dossier.images.length
) {
  fail(`dossier.json has an invalid cover index: ${dossier.cover}`);
}
for (const image of dossier.images) {
  const src = shotInfo.get(image.name);
  if (!src) fail(`dossier.json lists an unexpected image: ${image.name}`);
  if (image.sha256 !== src.sha256) fail(`dossier.json sha256 mismatch for ${image.name}`);
  const outShot = join(out, 'screenshots', image.name);
  if (!existsSync(outShot)) fail(`screenshots/${image.name} is missing from the output`);
  const outBuf = readFileSync(outShot);
  if (outBuf.length !== src.size) {
    fail(`screenshots/${image.name} in the output is ${outBuf.length} bytes, expected ${src.size}`);
  }
  if (createHash('sha256').update(outBuf).digest('hex') !== src.sha256) {
    fail(`screenshots/${image.name} in the output differs from its source`);
  }
}
