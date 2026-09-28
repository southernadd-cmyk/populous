# The Living Faith

A real-time, browser-based god game about shaping land, growing followers, and building stone circles at sacred sites. It has no combat. [Play the published version](https://southernadd-cmyk.github.io/populous/).

The world is **64×48 tiles**. The two villages begin on opposite sides of a broad central crossing. Five sacred sites form upper, lower and central routes, with wild followers scattered along the approaches. Every new world has paired mountain ridges, hills, two winding rivers and broad lakes connected to them. Settlements can grow to 72 people and 12 huts per tribe. Click the minimap to jump the camera between fronts, or use Home to return to your shaman.

## The gameplay loop

Shape a **clear, level 2×2 plot** near one of your villages or sacred stones. Settlers can then plan a hut, gather wood, and build it. Families grow automatically as workers support the settlement. Level ground prepares a hut for a **house** (four clear neighbours, three family growth steps, and at least 25 seconds since completion), a **fort** (six neighbours, six family growth steps, a clear 2×2 footprint, at least 85 seconds old and 35 seconds after the house), then a **castle** (all eight neighbours, ten family growth steps, a clear 3×3 footprint, at least 160 seconds old and 50 seconds after the fort). Supported families keep progressing even if the tribe reaches its population cap; a new brave appears only when housing is available. The game advances through these stages one at a time. A home claims its larger footprint as it grows, so other buildings and terrain edits cannot overlap it. Housing increases from 6 to 9, 13 and 18; blessed homes also produce more Faith and Devotion at each stage.

Followers provide a little **Faith** to spend on shaping land, building stone circles, blessing huts, converting wildmen, bridges and rituals. **Devotion** is the victory score, earned by productive blessed villages and finished stone circles. The first tribe to reach **4,000 Devotion and complete all three regional faith works** wins. A faith work is a festival at a prepared stone circle or blessed home near a rune in the North, Crossing, or South. Its first festival awards a large 900-Devotion bonus, so preparing and celebrating across the map drives the score as well as the victory condition. Merely waiting with a large population does not earn Devotion or complete a region.

Sacred sites start as empty glowing runes. Flatten a clear **2×2 foundation containing the rune**, bring the shaman within three tiles, select **Build Stone**, and click the foundation's top-left tile. This spends 20 Faith and reserves that exact footprint. Nearby followers walk there and build the circle automatically. A progress bar fills as the standing stones rise; the finished circle is consecrated and starts earning Faith and Devotion. A rival shaman near the site slows construction. Each site can hold one circle, and players can choose among four possible 2×2 foundations around its rune.

Inspect a blessed hut or an owned stone to set its policy:

| Policy | Effect |
| --- | --- |
| **Grow** | Followers build, gather, support local belief, and plan new huts on nearby level plots. |
| **Worship** | Assigns two followers to the site for more Faith and Devotion; fewer builders remain. |
| **Guard** | At sacred stones, keeps one caretaker and one worshipper nearby to slow a rival capture. |

A finished circle has a visible, owner-coloured spiritual health bar. Local Faith restores its health; a visiting rival shaman drains it and can convert the completed structure. Move your shaman to defend it, select Guard, or spend Faith on a protective Ritual. Empty sacred ground cannot be claimed or converted by a Ritual. A festival turns 70 stored Faith into an immediate Devotion surge when local belief reaches 55, two assigned worshippers arrive, and the site is healthy. The tribe then waits 60 seconds before another celebration. Four aligned terrace tiles give a stone its full production bonus; **seven** are needed for its first regional festival. A blessed home within 5.5 tiles of a rune qualifies after reaching a house in North or South, or a fort at the Crossing. Repeated festivals in the same region earn Devotion but do not complete another faith work.

The rival can favour a village network or building circles at sacred sites. Its shaman shapes uneven sacred ground, spends Faith on construction and regional terraces, and its followers build using the same rules. It expands, chooses policies and holds festivals under the same regional victory requirements. Approaching rival shamans trigger an event so their pressure is visible.

## Follower decisions

Unassigned followers now weigh three jobs: **build** an unfinished hut or stone circle, **tend** belief at a productive site, or **support** a village or circle by staying nearby. Each option gets a graded score from distance, belief, housing pressure, staffing, construction progress and rival proximity. A follower keeps an intention briefly before reconsidering, and a worker carrying wood finishes that delivery. This keeps assignments responsive without sending people back and forth every frame. Player choices for Grow, Worship and Guard still reserve their requested followers; the scoring guides the remaining workers.

## Controls and running locally

The opening screen uses a snapshot of the current Three.js world and a tabbed field guide covering the objective, land, followers, faith and controls. Open the same guide from **How to Play** at any time; the match pauses while it is open. There are no one-click suggestion cards in the game. The objective bar shows regional progress, while Inspect shows the requirements of a chosen site.

Choose **Move Shaman**, **Plan Hut**, **Build Stone**, or **Inspect**; spells include single-tile Raise and Lower Land. Hover a tile while shaping to see if it opens a stone foundation, a building plot, or grows a home, with the new footprint highlighted. Inspect a home to see its land, family growth and age milestones. Completed sites offer Grow / Worship / Guard controls. Drag to move the map in the same direction as the pointer, right drag to rotate, scroll to zoom; click the minimap to pan across the world or use HOME to find your shaman. Pause or set 1×, 2×, or 3× speed.

Terrain elevations, decorative pebbles and trees render in batches. A single Raise or Lower updates the affected terrain instance, leaving the rest of the map in place. The minimap refreshes at a lower rate than the game simulation.

The game uses bundled Three.js r180 under the MIT licence (`vendor/THREE-LICENSE.txt`). Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000` in a WebGL 2 browser. Players need no installation or account. Run the logic and rendering checks with `node --test tests/*.test.*` when developing.
