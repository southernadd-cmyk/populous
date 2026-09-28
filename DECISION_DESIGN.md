# The Heartstone: design contract

This rebuild uses Sid Meier's description of gameplay as a series of interesting decisions. His [GDC 2012 talk](https://gdcvault.com/play/1016165/Interesting) specifically calls out pacing, information and feedback. The game is a small test of those ideas, not a claim that its present balance is final.

## One short contest

You have twelve seasons to win Hearthstone, a neutral village between two gods. Reach 70% influence for two consecutive seasons to win early; otherwise the higher influence at the end of season twelve wins. A season advances only when the player presses **End Season**. Each season has two orders and faith is scarce. The rival's next action is visible before either order is spent.

| Choice | Immediate cost | Delayed benefit | Risk or counter |
| --- | --- | --- | --- |
| Raise the marked frontier | 1 order, 2 faith | A new village next season: population, faith and ongoing influence | Gives up an immediate conversion order; rival may found a competing outpost |
| Send pilgrims | 1 order, 3 people and 10 food | Arrive after two seasons and influence Hearthstone for three | Food and people leave home now; late pilgrims may miss the deadline |
| Revelation near Hearthstone | 1 order, 3 faith | Immediate influence | Repeating it during one season yields only 6%; fervour recovers slowly between seasons |
| Bloom a friendly village | 1 order, 2 faith | Food and a ward for the announced Ember attack | Does not directly move Hearthstone's influence |
| Earthquake an Ember village | 1 order, 4 faith | Destroys plots, food and two seasons of local pressure | Expensive; casting close to Hearthstone scares it away |
| Shape elsewhere | 1 order, 2 faith | Suitable flat land can expand housing and farms | Poor terrain or timing may waste the order |

Ember announces one of three moves: inspire Hearthstone, attack a food store, or found a forward village. Forecasts let the player choose a response. Events resolve at the season boundary; changed buildings, pilgrim positions, food, faith and influence appear in both the map and HUD.

## Checks before adding a feature

1. Does it offer an alternative to a current useful choice?
2. Does it spend something that matters in this scenario?
3. Is its likely effect visible before the player commits?
4. Can the player point to the result on the map and in the numbers?
5. Does it alter the next decision soon enough to matter?

## Playtest targets

Test a fresh seed with three new players. Ask what they expect before each first action, then whether its result matched their expectation. Note which orders they use and why. A one-action strategy should not always dominate; at least two plausible plans should be able to win a twelve-season contest. The current deterministic simulations show Revelation alone loses, forward growth plus Revelation wins, and forward growth plus pilgrimage can narrowly win. Human play may expose very different exploits.
