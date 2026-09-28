# The Living Faith

A real-time, browser-based god game about shaping land, growing followers, and building stone circles at sacred sites. It has no combat. [Play the published version](https://southernadd-cmyk.github.io/populous/).

## The gameplay loop

Shape a **clear, level 2×2 plot** near one of your villages or sacred stones. Settlers can then plan a hut, gather wood, and build it. Families grow automatically as workers support the settlement. Level ground around a hut turns it into a **house** (four clear neighbours, two births), a **fort** (six neighbours, four births and a clear 2×2 footprint), then a **castle** (all eight neighbours, six births and a clear 3×3 footprint). A home claims its larger footprint as it grows, so other buildings and terrain edits cannot overlap it. Housing increases from 6 to 9, 13 and 18; blessed homes also produce more Faith and Devotion at each stage.

Followers provide a little **Faith** to spend on shaping land, building stone circles, blessing huts, converting wildmen, bridges and rituals. **Devotion** is the victory score, earned by productive blessed villages and finished stone circles. The first tribe to reach **1,200 Devotion** wins. Merely waiting with a large population does not earn Devotion.

Sacred sites start as empty glowing runes. Flatten a clear **2×2 foundation containing the rune**, bring the shaman within three tiles, select **Build Stone**, and click the foundation's top-left tile. This spends 20 Faith and reserves that exact footprint. Nearby followers walk there and build the circle automatically. A progress bar fills as the standing stones rise; the finished circle is consecrated and starts earning Faith and Devotion. A rival shaman near the site slows construction. Each site can hold one circle, and players can choose among four possible 2×2 foundations around its rune.

Inspect a blessed hut or an owned stone to set its policy:

| Policy | Effect |
| --- | --- |
| **Grow** | Followers build, gather, support local belief, and plan new huts on nearby level plots. |
| **Worship** | Assigns two followers to the site for more Faith and Devotion; fewer builders remain. |
| **Guard** | At sacred stones, keeps one caretaker and one worshipper nearby to slow a rival capture. |

A finished circle has a visible, owner-coloured spiritual health bar. Local Faith restores its health; a visiting rival shaman drains it and can convert the completed structure. Move your shaman to defend it, select Guard, or spend Faith on a protective Ritual. Empty sacred ground cannot be claimed or converted by a Ritual. A festival turns 70 stored Faith into an immediate Devotion surge when local belief and worshipper requirements are met. The tribe then waits 60 seconds before another celebration. Four aligned terrace tiles give a stone its full bonus.

The rival can favour a village network or building circles at sacred sites. Its shaman shapes uneven sacred ground, spends Faith on construction, and its followers build using the same rules. It expands and chooses policies using the same sites and housing rules. Approaching rival shamans trigger an event and a defensive suggestion.

## Follower decisions

Unassigned followers now weigh three jobs: **build** an unfinished hut or stone circle, **tend** belief at a productive site, or **support** a village or circle by staying nearby. Each option gets a graded score from distance, belief, housing pressure, staffing, construction progress and rival proximity. A follower keeps an intention briefly before reconsidering, and a worker carrying wood finishes that delivery. This keeps assignments responsive without sending people back and forth every frame. Player choices for Grow, Worship and Guard still reserve their requested followers; the scoring guides the remaining workers.

## Controls and running locally

Choose **Move Shaman**, **Plan Hut**, **Build Stone**, or **Inspect**; spells include single-tile Raise and Lower Land. Hover a tile while shaping to see if it opens a stone foundation, a building plot, or grows a home, with the new footprint highlighted. Inspect a home to see its next land and birth milestones. Completed sites offer Grow / Worship / Guard controls. Drag to pan, right drag to rotate, scroll to zoom; use HOME to find your shaman. Pause or set 1×, 2×, or 3× speed.

The game uses bundled Three.js r180 under the MIT licence (`vendor/THREE-LICENSE.txt`). Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000` in a WebGL 2 browser. Players need no installation or account. Run the logic checks with `node --test tests/gameplay.test.cjs` when developing.
