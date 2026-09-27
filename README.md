# The Living Land

A single-player, browser-only god game prototype inspired by terrain shaping and emergent worship. All terrain, vegetation, buildings and followers are drawn at runtime on Canvas. A numeric world seed reproduces the initial terrain; append `?seed=12345` to the URL to try one. Terrain hashing uses integer arithmetic rather than transcendental functions, although this alone does not make the full simulation deterministic across clients.

## Play locally

Run `python -m http.server 8000` in this directory and open `http://localhost:8000`. No package install or build step is required. GitHub Pages can publish directly from the repository root on `main`.

The Verdant is the human player; the Ember is a simulated rival. Raise the marked 3×3 starter patch for a village within a few seconds. Elsewhere, raise and lower ground patches across six land heights to prepare level, fertile sites near existing villages. Settlements claim buildable tiles as they grow: homes add capacity, farms produce food, workshops add capacity, factories improve expansion reach and capacity, and shrines increase faith income. Bloom farmland, reveal your influence or blight crops. Select Inspect worshipper to see an individual’s needs and current decision. Settlements produce food, grow and change allegiance gradually. Visible followers choose activities from fuzzy utility scores based on hunger, fatigue, danger, devotion and local needs.

## Prototype boundaries

This is a playable simulation, not yet a networked game. Settlement population is abstracted; a limited number of visible followers represents it. The rival chooses occasional blessings or religious influence. World state currently resets on refresh. See `DESIGN_NOTES.md` for a comparison with the supplied manual and the next gameplay priorities. For multiplayer, have the server generate and send the canonical heightmap and other initial world data on join; then send validated terrain edits and authoritative settlement/follower snapshots. Even integer-based terrain generation should not be relied on as the sole synchronization mechanism for the changing world. Extract simulation into an authoritative server module and add reconnectable snapshots and persistent rooms.
