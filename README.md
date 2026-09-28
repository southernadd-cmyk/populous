# The Living Land — The Beginning

A browser based, real time 3D god game prototype inspired by the play loop of **Populous: The Beginning**. [Play the current published version](https://southernadd-cmyk.github.io/populous/) (the hosted version may lag this branch).

## Play

- Convert wildmen with the shaman, then command braves to build huts from nearby trees.
- Occupied huts spawn new braves. Followers replenish mana over time.
- Move the shaman into range to cast Convert, Raise, Lower, Land Bridge and Blast.
- Send braves toward the opposing tribe. Enemy followers build and raid autonomously.
- Pause, set 1×/2×/3× speed, drag to pan, right drag to rotate, scroll to zoom.
- Win by defeating all enemy followers; lose if all friendly followers are defeated.

This is the first foundation, not an asset or code port of the original. It does not yet have the original's training huts, specialized follower classes, spell charging, multiple tribes, spherical world, or network multiplayer. The original turn based Heartstone prototype is retained in Git history. `vendor/three.module.js` is Three.js r180 under the MIT license; see `vendor/THREE-LICENSE.txt`.

Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000`. A browser with WebGL 2 support is required. There is no build step or installation for players.
