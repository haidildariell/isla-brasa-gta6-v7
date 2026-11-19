// ISLA BRASA — entry program for gta6-01 "Make GTA 6" (Node 22, stdlib only).
// The game itself is the static site in game/ (Three.js open-world crime game,
// fully offline). This program hands it in: it copies game/ and screenshots/
// into the output directory and writes dossier.json with buildDossier from
// the kit's vendor/makefun-game.ts, byte-for-byte the scorer's own library.
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play locally with: node serve.ts  ->  http://localhost:8080

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the playable game and the maker's screenshots exactly as they sit in
// the repository; the gate re-derives the dossier from these bytes.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// Dossier caps mirror reference/gate.json so a local run fails the same way
// the scorer would: 160 KiB of source text, at most 4 screenshots of at most
// 256 KiB, at most 993 game files / 48 MiB, paths under 1000 bytes.
const dossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierJson);
console.log('ISLA BRASA handed in to', outputDir);
