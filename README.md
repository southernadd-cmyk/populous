# The Living Land — The Living Faith

A browser based, real-time 3D god game focused on faith and settlement growth. [Play on GitHub Pages](https://southernadd-cmyk.github.io/populous/).

## The loop

Followers and sacred stones generate faith. Faith can be invested in converting wildmen, blessing huts for permanent income, claiming or protecting sacred stones, or shaping land. Total faith earned accumulates as devotion. The first tribe to reach 300 devotion wins. The Ember tribe also grows, blesses huts, and competes for the stones. There is no combat.

- Move the shaman beside a sacred stone for three seconds to claim it. Ritual claims it immediately for 45 faith or protects an owned stone for 25 seconds for 30 faith.
- Braves gather wood, complete hut plans, and roam. Occupied huts create more followers.
- Convert wildmen for 20 faith, bless a completed hut for 30, or shape land and bridge water.
- Pause or set 1×/2×/3× speed; drag to pan, right drag to rotate, scroll to zoom.

This prototype uses bundled Three.js r180 under the MIT licence (`vendor/THREE-LICENSE.txt`). Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000`. A browser with WebGL 2 support is required. No installation or account is needed for players.
