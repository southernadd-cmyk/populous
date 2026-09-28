# Gameplay decisions — current build

The player reshapes a living landscape and guides a tribe to win a contest of devotion. There are no seasons or combat. Actions should have a visible consequence within a few seconds; site policies make the next few minutes play out differently.

## One loop, several plans

**Shape useful ground → followers settle or worship → productive sites earn Devotion and Faith → spend Faith to extend or protect them.** Workers build and gather automatically. Faith is the spendable stock; Devotion is the single victory score. Passive followers earn only Faith. A finished, blessed home or an owned stone earns Devotion according to worshippers and local belief.

| Plan | Opening decision | Ongoing tradeoff | Opponent response |
| --- | --- | --- | --- |
| Village network | Bless a home and set a growth hub; shape plots as housing fills. | More builders now versus worshippers scoring now. | Rival pilgrims may claim stones while the player expands. |
| Stone focus | Send the shaman to stones; assign worshippers and level four terrace tiles. | Faith output and festivals versus leaving a stone open to capture. | Rival guards a threatened stone or sends its shaman elsewhere. |
| Flexible | Develop one village, then choose the best reachable stone or plot. | Spend Faith on expansion, festivals or protection. | Rival's selected style changes the timing and pressure. |

Grow on a productive site attracts huts on nearby level 2×2 plots as housing approaches its limit. A single tile change can also unlock a plot immediately. Two births and enough level neighbours expand a hut; further growth can expand it again. Expanded homes gain housing and Devotion, and show a larger house and garden. This makes land shaping matter after the first hut is built.

## Rules that keep the choices readable

- Each land spell changes exactly one tile for 4 Faith. The tile preview explains when an edit opens a plot, expands a home, or improves a stone.
- A site has one policy: **Grow**, **Worship**, or **Guard** (stones only). Policies automatically move available followers, while leaving three workers free when assigning worshippers.
- Stones use one coloured spiritual health bar. A keeper on Guard slows pressure; a nearby friendly shaman, worshippers, or a Ritual also helps. The rival uses the same capture rules.
- A stone's first four aligned neighbouring tiles improve output. Later matching tiles do not provide more bonuses, so reshaping the whole ring is optional.
- A Festival needs two present worshippers, belief of at least 55 and 70 Faith. The whole tribe then waits 60 seconds before another celebration, keeping this a timing choice.
- The opponent chooses a settlement or pilgrimage emphasis per map. It cannot maximise both approaches at once, and it switches to Guard when its stones are threatened.

## Verification and next playtest

The logic checks cover a one-tile plot unlock, automatic hut planning, housing and passive Devotion, Guard pressure, and winning scripts for both village and stone strategies against both opponent styles. Scripted victories currently take roughly **2½–3¼ minutes** on the tested seeds. These scripts establish viable mechanics, not human enjoyment.

A WebGL playtest should check that the first terrain edit feels worthwhile, followers reach the promised plot, the two choices are clear without a tutorial, a threatened stone gives enough response time, and the two strategies stay competitive when a human makes imperfect decisions. Tune pacing from those observations before adding new currencies or powers.
