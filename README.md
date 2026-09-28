# The Living Faith

A real-time, browser-based god game about shaping land, growing followers, and competing for sacred stones through faith. It has no combat. [Play the published version](https://southernadd-cmyk.github.io/populous/).

## The gameplay loop

Shape a **clear, level 2×2 plot** near one of your villages or sacred stones. Settlers can then plan a hut, gather wood, and build it. Finished huts provide housing; a hut with enough level ground and growing followers expands into a larger home with a garden. More homes make room for more followers.

Followers provide a little **Faith** to spend on shaping land, blessing huts, converting wildmen, bridges and rituals. **Devotion** is the victory score, earned by productive blessed villages and owned sacred stones. The first tribe to reach **1,200 Devotion** wins. Merely waiting with a large population does not earn Devotion.

Inspect a blessed hut or an owned stone to set its policy:

| Policy | Effect |
| --- | --- |
| **Grow** | Followers build, gather, support local belief, and plan new huts on nearby level plots. |
| **Worship** | Assigns two followers to the site for more Faith and Devotion; fewer builders remain. |
| **Guard** | At sacred stones, keeps one caretaker and one worshipper nearby to slow a rival capture. |

A captured stone starts with a visible, owner-coloured spiritual health bar. Local Faith restores its health; a visiting rival shaman drains it. Move your shaman to defend it, select Guard, or spend Faith on a protective Ritual. Neutral stones need roughly three seconds of uncontested shaman presence. A festival turns 70 stored Faith into an immediate Devotion surge when local belief and worshipper requirements are met. The tribe then waits 60 seconds before another celebration. Four aligned terrace tiles give a stone its full bonus.

The rival can favour a village network or a pilgrimage to the stones. It expands and chooses policies using the same sites and housing rules. Approaching rival shamans trigger an event and a defensive suggestion.

## Controls and running locally

Choose **Move Shaman**, **Plan Hut**, or **Inspect**; spells include single-tile Raise and Lower Land. Hover a tile while shaping to see if it opens a building plot or expands a home. The map presents two plausible moves, and selecting a site opens its Grow / Worship / Guard controls. Drag to pan, right drag to rotate, scroll to zoom; use HOME to find your shaman. Pause or set 1×, 2×, or 3× speed.

The game uses bundled Three.js r180 under the MIT licence (`vendor/THREE-LICENSE.txt`). Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000` in a WebGL 2 browser. Players need no installation or account. Run the logic checks with `node --test tests/gameplay.test.cjs` when developing.
