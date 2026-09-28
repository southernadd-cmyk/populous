# The Living Faith

A browser god game about shaping land, growing villages, guiding followers, and building stone circles. [Play the published version](https://southernadd-cmyk.github.io/populous/).

## Goal

Be the first tribe to earn **4,000 Devotion** and hold a festival in each of **North, Crossing, and South**. Your rival, Ember, has the same goal. Blessed homes and finished stone circles earn Devotion over time. The first festival in each region adds 900 bonus Devotion to its normal award. A region stays complete even if you later lose its site.

**Faith** pays for actions and festivals. Followers generate a little Faith; blessed homes, worshippers, and finished stone circles add more. You start with 45 Faith and can store up to 160. Faith and Devotion are separate: earning or spending Faith does not change your score.

## First steps

1. Find a clear, level 2×2 plot near your village. Choose **Plan Hut** and click its top-left tile, or shape one tile with Raise or Lower Land to create a new plot. Braves gather wood and build it.
2. Bless a completed home to make it earn Devotion and Faith. Level nearby land and keep workers close to help it grow from a hut to a house, fort, and castle.
3. Prepare a festival site near each region's rune. Build a stone circle on a rune, or grow a blessed home close to it. Assign two worshippers, maintain the site's belief, and celebrate when the Festival button becomes available.

The opening **How to Play** guide has seven tabs: Goal, Land & homes, Followers, Stones, Festivals, Spells, and Controls. Open it again at any time; the match pauses while you read.

## Land, homes, and followers

The world spans 64×48 tiles with five sacred runes, hills, mountains, connected rivers, and lakes. Plan Hut needs a clear, level 2×2 square near a completed friendly building or owned circle. Trees, water, structures, and runes block a plot. Settlers also plan huts automatically on suitable land, especially land you have just shaped. Raise and Lower each change **one tile by one level** for 4 Faith. The land spell preview highlights a newly available plot, stone foundation, or possible home upgrade.

A home grows automatically when nearby workers have supported it enough, the required neighbours match its height, and enough time has passed since construction. Forts and castles also need clear space for a larger footprint.

| Stage | Level neighbours | Growth | Time since completion | Beds added |
| --- | ---: | ---: | --- | ---: |
| Hut | — | — | Built | 6 |
| House | 4 | 3 | 25 seconds | 9 |
| Fort | 6 and clear 2×2 | 6 | 85 seconds; 35 since house | 13 |
| Castle | 8 and clear 3×3 | 10 | 160 seconds; 50 since fort | 18 |

Growth counts periods of worker support. It continues even at full housing, although a new brave can appear only when there is room. Each home adds the beds shown above, and each tribe can hold at most 72 people. Inspect a home for its next milestone.

Braves choose work according to nearby construction, housing, staffing, and belief. They gather wood, build, tend sites, or stay near homes and stones. Inspect a blessed home or owned circle to set its policy:

| Policy | What it does |
| --- | --- |
| Grow | Releases assigned worshippers to work. Available level plots can attract new homes, and nearby workers support belief and growth. |
| Worship | Assigns up to two braves. Once they reach the site, they increase Faith and Devotion; two present worshippers are needed for a festival. |
| Guard | At a stone circle, assigns one keeper and one worshipper. The keeper helps resist a rival shaman; switch to Worship when preparing a festival. |

Policies leave at least three workers available. If there are not enough free braves yet, assignments fill as people become available.

## Stone circles and festivals

Each rune begins as empty sacred ground. Prepare a clear, level **2×2 foundation containing the rune**, bring your shaman within three tiles, choose **Build Stone**, and click the foundation's top-left tile. Building costs 20 Faith. Braves finish the circle; a nearby rival shaman slows construction. A finished circle earns Faith and Devotion and has an owner-coloured spiritual health bar. A rival shaman close to it can drain that bar and take the circle when it reaches zero. Your shaman, local worship, a Guard keeper, or a protective Ritual help keep it yours.

The eight tiles around a rune are its terrace. Four tiles matching the rune's height give the full production bonus; seven prepare the circle for its **first regional festival**. You can also use a blessed home within 5.5 tiles of a rune. A North or South home must reach at least house level, and a Crossing home must reach fort level.

Choose **Inspect** on your blessed home or finished circle to hold a festival. It needs 55 belief, two assigned worshippers who have arrived, a healthy site, 70 Faith, and the end of your tribe's 60-second cooldown. Belief rises with a completed friendly hut and two nearby working braves; a circle can also stay healthy with two present worshippers and four matching terrace tiles. A festival lowers the site's belief by 18. It also restores 12 spiritual health at a circle. Later festivals still award Devotion, but only the first in each region counts toward the goal.

## Commands and spells

Choose a command or spell in the bottom bar, then click its target. **Move Shaman** sends the shaman to land; **Plan Hut** marks a valid plot for free; **Build Stone** costs 20 Faith and needs the shaman within three tiles of the rune; **Inspect** opens a site panel or identifies what you clicked.

| Spell | Cost | Effect |
| --- | ---: | --- |
| Convert | 20 Faith | Turn a grey wildman into your brave if housing allows. |
| Bless Hut | 30 Faith | Bless a finished friendly home so it earns Faith and Devotion. |
| Ritual | 30 / 45 Faith | Restore 35 health and shield your circle for 12 seconds, or remove 35 health from a rival's built circle. Bring your shaman beside it to convert it at zero health. |
| Raise Land | 4 Faith | Raise one tile by one level, up to height 5. |
| Lower Land | 4 Faith | Lower one tile by one level, down to water at height 0. |
| Land Bridge | 30 Faith | Turn water along a short straight line into low land. |

For Convert, Bless, Raise, Lower, and Land Bridge, the shaman must be within 5.5 tiles of the clicked tile. Ritual needs the shaman within three tiles of a completed circle. Invalid targets do not spend Faith.

Left drag pans with the pointer, right drag rotates, and scrolling or the ± buttons zoom. Click the minimap to move the camera, use its arrow keys when focused, or press **Home** to find the shaman. Pause and the 1×, 2×, 3× speed setting control simulation time. **New World** generates a fresh map.

## Running locally

The game uses bundled Three.js r180 under the MIT licence (`vendor/THREE-LICENSE.txt`). Run `python3 -m http.server 8000` in the repository root and open `http://localhost:8000` in a WebGL 2 browser. Run checks with `node --test tests/*.test.*`.
