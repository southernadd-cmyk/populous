# Gameplay decisions — current build

The player reshapes a living landscape and guides a tribe to win a contest of devotion. There are no seasons or combat. Actions should have a visible consequence within a few seconds; site policies make the next few minutes play out differently.

## One loop, several plans

**Shape useful ground → followers build or worship → productive sites earn Devotion and Faith → spend Faith to extend or protect them.** Workers build and gather automatically. Faith is the spendable stock; Devotion is the single victory score. Passive followers earn only Faith. A finished, blessed home or built stone circle earns Devotion according to worshippers and local belief.

| Plan | Opening decision | Ongoing tradeoff | Opponent response |
| --- | --- | --- | --- |
| Village network | Bless a home and set a growth hub; shape plots as housing fills. | More builders now versus worshippers scoring now. | Rival builders may finish a sacred circle while the player expands. |
| Stone focus | Shape a 2×2 site foundation, spend 20 Faith and commit builders to a circle. | Early investment and fewer hut builders for later Faith, worship and festivals. | Rival shapes competing sites, slows a project with its shaman or contests a finished circle. |
| Flexible | Develop one village, then choose the best reachable stone or plot. | Spend Faith on expansion, festivals or protection. | Rival's selected style changes the timing and pressure. |

Grow on a productive site attracts huts on nearby level 2×2 plots as housing approaches its limit. A single tile change can also unlock a plot immediately. A hut grows into a house after two births and four clear level neighbours, a fort after four births and six neighbours on a clear 2×2 footprint, and a castle after six births and all eight neighbours on a clear 3×3 footprint. Later buildings claim those tiles, add housing and improve the Faith and Devotion of a blessed village. Their models change from thatch and timber to a palisade and finally a stone keep with towers. This makes land shaping matter after the first hut is built.

Free workers compare fuzzy degrees of proximity, building urgency, low belief, housing pressure and local staffing. They select the strongest build, tend or support intention, hold it for a short interval, then reconsider. Supporting workers stay near villages or completed circles, where their presence improves births and local belief. Delivering wood and the player-assigned Worship and Guard roles remain dependable commitments.

## Rules that keep the choices readable

- Each land spell changes exactly one tile for 4 Faith. The tile preview explains when an edit opens a plot, expands a home, or improves a stone.
- A sacred site begins empty. Its rune must lie within a clear, level 2×2 footprint; the player chooses the footprint, pays 20 Faith with a nearby shaman, and followers build the circle. The rival obeys the same cost and building rules. Empty sites generate nothing, and no Ritual can skip construction.
- A site has one policy: **Grow**, **Worship**, or **Guard** (stones only). Policies automatically move available followers, while leaving three workers free when assigning worshippers.
- While a circle is being built, its coloured progress bar and rising stones show work; a nearby rival shaman halves construction speed. Finished circles use the same bar for spiritual health. A keeper on Guard slows pressure; a nearby friendly shaman, worshippers, or a Ritual also helps. A rival can convert the completed structure.
- A stone's first four aligned neighbouring tiles improve output. Later matching tiles do not provide more bonuses, so reshaping the whole ring is optional.
- A Festival needs two present worshippers, belief of at least 55 and 70 Faith. The whole tribe then waits 60 seconds before another celebration, keeping this a timing choice.
- The opponent chooses a settlement or pilgrimage emphasis per map. It cannot maximise both approaches at once, and it switches to Guard when its stones are threatened. Five sites on the larger map offer two flanking routes and a centre route; the minimap lets the player switch attention between them.

## Verification and next playtest

The checks cover a one-tile plot unlock, automatic hut planning, graded follower job changes, all four building stages and their reserved footprints, housing and passive Devotion, the required stone construction sequence, Guard pressure, terrain batch updates and picking, and winning scripts for both village and stone strategies against both opponent styles. These scripts establish viable mechanics, not human enjoyment.

A WebGL playtest should check that the first terrain edit feels worthwhile, followers reach the promised stone foundation, the exact click target is clear without a tutorial, a threatened stone gives enough response time, and the two strategies stay competitive when a human makes imperfect decisions. Tune pacing from those observations before adding new currencies or powers.
