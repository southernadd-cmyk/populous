# The Living Land: The Heartstone

A short single-player god-game prototype. [Play on GitHub Pages](https://southernadd-cmyk.github.io/populous/).

Hearthstone is a neutral village between the Verdant and the Ember. Use two orders each season to shape ground, found a frontier village, send pilgrims, nourish and ward towns, influence Hearthstone or damage the rival. Ember announces its next move before you commit. Reach 70% influence for two seasons, or lead after season 12.

The tutorial starts on a new browser and can be replayed from the header. Select an order in the fixed toolbar and click the map. Drag to pan, scroll or use +/− to zoom. The Villages drawer shows food, population, growth and event history.

This is a new game ruleset rather than an extension of the previous real-time simulation. Its deterministic simulation lives in `src/main.js`, with a procedural isometric Canvas renderer; no build step or account is needed. The design rationale and playtest criteria are in [DECISION_DESIGN.md](DECISION_DESIGN.md). The original Populous comparison is in [DESIGN_NOTES.md](DESIGN_NOTES.md). Different world seeds change the surrounding terrain while preserving the central scenario's key positions.

## Local preview

Run a static server from the repository root, such as `python3 -m http.server 8000`, then open `http://localhost:8000/` in a browser. Use `?seed=12345&tutorial=1` to replay the opening with a known map.
