# Pasar Malam — Cari 7 Perbedaan

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

Dua gambar pasar malam yang hampir sama, berdampingan di kanvas. Ada **7 perbedaan**
di antaranya — bulan, atap kios, lampion, balon, kucing, bendera, dan lampu jendela.
Klik perbedaannya untuk menandainya dengan lingkaran hijau. Ketemu semua, kamu menang.

## Cara main

- **Mouse:** klik perbedaan di Gambar A atau Gambar B.
- **Keyboard:** tombol panah menggerakkan kursor, **Spasi** menandai, **H** minta
  petunjuk (−50 poin), **R** mulai dari awal, **Enter** mulai.
- Klik salah −25 poin. Bonus waktu dihitung sampai 4 menit permainan.

## Run it

```sh
node serve.mjs   # lalu buka http://localhost:8080
```

Atau buka `game/index.html` langsung dari file — game ini file statis tanpa
dependensi dan tanpa network. `?demo=start|mid|win` di URL menampilkan keadaan
tetap (layar awal / tengah permainan / menang) untuk pengambilan screenshot;
saat bermain normal parameter itu tidak dipakai.

## Struktur

- `game/index.html` — halaman game
- `game/src/main.js` — logika game (state, klik, keyboard, skor, timer)
- `game/src/scene.js` — gambar pasar malam (satu fungsi menggambar kedua panel;
  varian kanan punya tepat 7 perbedaan, semuanya deterministik)
- `screenshots/` — tangkapan layar asli dari game yang berjalan di browser
- `main.ts` — entrypoint: menyalin `game/` + `screenshots/` ke `/output` dan
  menulis `dossier.json` (Node 22 stdlib saja)

---

<sub>Entered on [make.fun](https://make.fun/?ref=pergingopi&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards</sub>
