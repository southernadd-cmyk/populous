# The Living Land

A single-player, browser-only god game prototype inspired by terrain shaping and emergent worship. All terrain, vegetation, buildings and followers are drawn at runtime on Canvas. A numeric world seed reproduces the initial terrain; append `?seed=12345` to the URL to try one.

## Play locally

Run `python -m http.server 8000` in this directory and open `http://localhost:8000`. No package install or build step is required. GitHub Pages can publish directly from the repository root on `main`.

The Verdant is the human player; the Ember is a simulated rival. Raise and lower ground, bloom farmland, reveal your influence or blight crops. Settlements produce food, grow and change allegiance gradually. Visible followers choose activities from fuzzy utility scores based on hunger, fatigue, danger, devotion and local needs.

## Prototype boundaries

This is a playable simulation, not yet a networked game. Settlement population is abstracted; a limited number of visible followers represents it. The rival chooses occasional blessings or religious influence. World state currently resets on refresh, and the current simulation uses seeded generation but random simulation decisions are dependent on action order. Before multiplayer, extract simulation into an authoritative server module, move player actions into validated commands and add reconnectable snapshots and persistent rooms.
