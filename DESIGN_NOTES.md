# Making the god game fun: manual comparison

The supplied *Populous* manual is a scan. Page numbers below refer to its printed page numbers (the PDF page index is two pages earlier for most gameplay pages). This prototype uses the manual for mechanical inspiration; it has its own graphics, setting, and worship based victory condition.

| Manual system | Why it creates decisions | Prototype status / next step |
| --- | --- | --- |
| Flat land determines settlement size, advancement, crop area and mana (pp. 8–9, 16) | A terrain edit visibly improves a town, which makes more followers and divine power. | Implemented: six land heights, plot based expansion, farm production, house capacity and mana from followers. Towns now show their population capacity, occupied tiles and elevation; terrain at the matching height must be prepared to expand. High altitude costs need later tuning. |
| Full settlements release walkers to find new land (p. 9) | Growth turns into outward expansion and contested frontier. | Partly implemented: new villages form from prepared land near existing villages, with representative builders travelling there. Next: visibly dispatch a migrating party when capacity is reached. |
| Free influence commands and Papal Magnet (pp. 20–22) | The player chooses whether followers settle, rally or fight without controlling individuals. | Implemented as free Settle and Pilgrimage directives with a movable land beacon. A small group routes around water, consumes food and pressures nearby rival worship. Next: improve pathfinding and add leader risk. |
| Leader and Knight (pp. 10, 18, 21–22) | A concentrated population can become a risky mobile strategic tool. | Missing. Add a leader, then an optional champion who can raid farms and temples, with real population cost. |
| Swamps, rocks, ruined land, earthquakes, fire, volcano, flood (pp. 9–10, 17–20) | Terrain can be damaged, repaired or reshaped; miracles have counters. | Partial: blight and bloom affect farming; earthquakes ruin plots and Bloom/sculpting repair them. Add swamp, rocks, flood and their counters later. |
| Terrain worlds have different growth and survival rules (pp. 34–35) | New maps demand new strategies. | Missing. Add biome rules and balanced generation, with clear on-screen modifiers. |
| Population and mana bars, view commands and inspection shield (pp. 14–15, 23–24) | The player understands causes and can respond. | Partial: population, faith, village cards and worshipper inspection exist. Settlement cards now jump to that location; add a minimap and alerts for threatened settlements. |

## New systems specific to this game

The source manual has crops, settlements and era advancement but **does not have factories**. Our workshops and later factories are an original extension: workshops add capacity; factories replace workshops at higher population and extend the settlement’s reach and capacity. Farms directly produce food; homes set population capacity; shrines add faith income; stronger religious reach is a possible later upgrade. Religious conversion remains a distinctive route to victory, and should visibly trace causes such as a rival miracle, food shortage or temple pressure.

## Next playtest

1. On a fresh seed, raise the marked patch and time the new village (target: under ten seconds).
2. Watch a town until its district claims more plots; verify farms increase food, homes increase capacity and growth stops if suitable land runs out.
3. Sculpt a plateau near a full town and verify it expands rather than only changing a population number.
4. Use Revelation on a rival village; verify its faith meter changes immediately and ownership changes only after sustained influence.
5. Inspect an individual; verify its activity and reason change as food, faith and local development change.
