[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/haidildariell/isla-brasa-gta6-v7/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/haidildariell/isla-brasa-gta6-v7/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# ISLA BRASA

https://make.fun/bounty/gta6-01

An original open-world crime game in the browser. **Brasa Bay** is a sun-soaked coastal city at golden hour — a curved beach boulevard, a marina, boardwalk and palms on the east shore, and four districts inland: Marina District, Old Town, Las Palmas and Financial Row.

You are **Dario Venn**, a getaway driver who owes the bay more than he can pay. His handler **Vera Quintana** runs jobs out of the marina safehouse: ten story jobs that climb from stealing a first set of wheels to the Brasa Crown — robbing the Brasa Bay Bank and escaping five stars by speedboat. The rival crew **Los Corales** holds the piers, and the **BBPD** answers everything with named dispatch units, roadblocks, spike strips and the FALCON air unit.

## The 10 story jobs

1. **First Wheels** — steal a car, bring it to the safehouse garage.
2. **Marina Run** — one package, three drops, one clock.
3. **Heat Check** — raise 3 stars, then lose the BBPD completely.
4. **Coral Kings** — clear Los Corales off Pier 3 in a gunfight.
5. **Night Deposit** — rob the Old Town store, escape the roadblocks.
6. **Regent Run** — ram the Regent courier before it reaches the pier.
7. **Air Mail** — grab cargo in Financial Row under the FALCON spotlight.
8. **Turf War** — take three district corners from Los Corales.
9. **The Long Fare** — escort Vera across the city at wanted 4.
10. **Brasa Crown** — rob the Brasa Bay Bank, escape wanted 5 to the marina, out by speedboat.

## Systems

- **Procedural city** (`city.js`) — deterministic Brasa Bay: grid streets, a curved beach boulevard, beach + boardwalk + marina piers, pastel buildings with emissive windows, neon signs, palms, lamps and props, building collision.
- **Sky & ocean** (`sky.js`, `ocean.js`) — golden-hour gradient dome, dynamic sun + shadows, drifting clouds, animated sea, bobbing moored boats and sailboats.
- **Vehicles** (`vehicles.js`) — 7 drivable types (compact, sedan, sports, convertible, pickup, van, motorbike) with glass cabins, wheels, lights, spoilers, arcade physics, nitro, visual damage and engine smoke.
- **Traffic** (`traffic.js`) — lane-following traffic with braking and avoidance, densest on the boulevard.
- **Pedestrians** (`pedestrians.js`) — grouped walkers in varied clothes who flee danger.
- **Player** (`player.js`) — walk/sprint, enter/exit with E, hotwiring locked cars, health + armour.
- **Boats** (`boat.js`) — a drivable speedboat on open water.
- **Police** (`police.js`) — 5-star wanted, patrol/pursuit AI with PURSUIT, RAMMING and FLANKING roles, busted meter, heat loss out of sight.
- **Air unit** (`airunit.js`) — FALCON helicopter at wanted 4+ (3+ on jobs) with a live spotlight cone: AIR UNIT DEPLOYED.
- **Roadblocks** (`roadblocks.js`) — transverse BBPD formations + spike strips at wanted 3+.
- **Dispatch** (`dispatch.js`) — named BBPD units (BRASA-12, FALCON, RB-1…) with roles and live distances feeding the HUD panel.
- **Weapons** (`weapons.js`) — 6 weapons: Fists, Harbor Bat, P9 Pistol, Mako SMG, 12G Breaker, AR Carbine; ammo pools, rank locks, hold-Q weapon wheel.
- **Combat** (`combat.js`) — Los Corales enemy AI with health bars, muzzle flash, tracers, car explosions with fire and radius damage.
- **Missions** (`missions.js`) — the 10 sequential story jobs above: stages, timers, chase target, turf fights, escort, heist finale.
- **Races** (`races.js`) — 3 street races (Boulevard Burn, Old Town Circuit, Row Rush) vs 3 AI rivals, live P x/4 and checkpoint counter.
- **Side activities** (`activities.js`) — Courier Sprint, Boulevard Drift and Pier Rampage spots (press T), each paying cash + RP.
- **Garage** (`garage.js`) — store up to 4 cars at the safehouse, per-car condition %, armor/nitro upgrades and resprays.
- **Shops** (`shops.js`) — Harbor Arms gun stores (weapons + ammo) and Brasa Respray (paint + heat reduction).
- **Ranks** (`ranks.js`) — Respect ranks 1–8, Dock Hand → Brasa Kingpin, unlocking weapon tiers and garage upgrades.
- **Crew** (`crew.js`) — three crew abilities on cooldown: Swap Plates, Quick Fix, Eyes Out.
- **Districts** (`districts.js`) — per-district standing that shifts with your activity, shown on entry.
- **Radio** (`radio.js`) — 3 synthesized stations: Brasa FM synthwave, Radio Mango, Isla Talk, with station/track toasts.
- **Audio** (`audio.js`) — all-synthesized WebAudio: engine, sirens, heli rotor, gunshots, explosions, UI.
- **Effects** (`effects.js`) — sparks, smoke, fire, splashes, skid marks, camera shake.
- **HUD + minimap** (`hud.js`, `minimap.js`) — mission panel with stage pips, BBPD dispatch panel, weapon bar, rank bar, crew chips, portrait dialog, radio toast, speedo with car name + condition, health/armour, district banner, and a live top-down minimap with blips and objective route.
- **Save** (`save.js`) — localStorage: cash, job progress, RP/rank, garage, weapons, district standing. Title screen with Start / Continue, pause menu with Esc.

## Controls

- **WASD / arrows** — drive or walk · **Mouse** — camera (click the game to lock the pointer)
- **E** — enter/exit car or boat · **F** — start job / garage / shop / store car
- **Mouse click** — shoot · **Q (hold)** — weapon wheel · **Mouse wheel** — switch weapon
- **1 / 2 / 3** — crew abilities (Swap Plates / Quick Fix / Eyes Out) · **R** — street race
- **Tab or V** — change radio station · **Shift** — sprint / nitro · **G** — horn · **Esc** — pause

## Play locally

```
node serve.ts
```

then open http://localhost:8080 — fully offline, no build step, no network requests. Hand the entry in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

MIT licensed. All names, characters, places, art and sounds are original to this game.
