# UI Audit

This document is the source-level contract for the current game chrome. Gameplay
art remains asset-backed; navigation, pause, dashboard, audio, and ad controls
are rendered as DOM buttons with lucide-react.

## Color Tokens

| Token | Value | Use |
| --- | --- | --- |
| --game-surface | #fff8e7 | Primary card and modal surface |
| --game-surface-soft | #fff0c4 | Warm panel gradient |
| --game-surface-deep | #f7ce78 | Panel gradient depth |
| --game-ink | #382047 | Main text |
| --game-ink-muted | #815a2c | Secondary text and timer label |
| --game-accent | #7227b8 | Purple action chrome |
| --game-gold | #f6b51b | Gold borders and action emphasis |
| --game-orange | #f4771a | Score and primary action emphasis |
| --game-brown | #6d3c16 | Headings and icon strokes |
| --game-danger | #c83b4d | Lose and danger states |

The tokens are declared in src/styles/hyper-ui.css and are consumed by the
dashboard and mobile timer. Existing --hyper-* tokens remain as compatibility
aliases for the Pixi/Hyper UI layer.

## Controls

| Control | Component | Icon source | Behavior |
| --- | --- | --- | --- |
| Dashboard | Game.tsx | Hyper trophy/cup asset | Opens DashboardScreen and pauses gameplay |
| Pause | Game.tsx and PauseOverlay.tsx | Pause, Play | Opens/resumes the pause overlay without resetting the game |
| Sound | PauseOverlay.tsx | Volume2, VolumeX | Toggles SFX only |
| Music | PauseOverlay.tsx | Music | Toggles music only |
| Rewarded ad | RewardAdButton.tsx | Clapperboard | Requests a reward; shared by support, revive, and win flows |
| Gameplay support | Game.tsx | Existing Hyper art | Hint, shuffle, and bomb remain game-art controls |

Restart is intentionally absent from Pause and Dashboard. It is only exposed
from the lose/end-game flow so opening a screen cannot silently reset gameplay.

## Mobile Layout

At max-width 1023px, the order is:

1. Top row with timer, cup Dashboard, and Pause controls.
2. Score and lives status row.
3. Gameplay board and its end-state overlays.
4. Hint, shuffle, and bomb support rail.

The end-state overlays are children of the board stage, so timeout, lose, revive,
and win states cover the gameplay region rather than escaping the mobile frame.
