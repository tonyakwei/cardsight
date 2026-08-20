# Act 3 Timer Display Decisions

The `/timer/:gameId` display and `/admin/games/:gameId/timer-remote` remote are reused
for the Temple of the QRians Day 3 tribunal and ending presentation.

## Display Modes

- `timer` shows the existing day-themed countdown.
- `tribunal` shows a Day 3 tribunal title, two simultaneous meetings, and a countdown.
- `artifact` shows a selected ending image full-screen with a fade-in.
- `ending` shows a typed final ending title.

The timer display polls every 2 seconds.

## Tribunal Structure

There are three tribunals. Each tribunal has two meetings of two groups, run simultaneously.
Each tribunal button starts a 6-minute countdown.

| Tribunal | Meeting A | Meeting B |
|---|---|---|
| Tribunal 1 | Politics meets Culture | Science meets Spirituality |
| Tribunal 2 | Politics meets Spirituality | Science meets Culture |
| Tribunal 3 | Politics meets Science | Culture meets Spirituality |

## Artifact Image Controls

Artifact images are static Temple-specific assets copied into
`client/public/assets/temple-ending/`.

The remote groups buttons alphabetically by artifact name. Image buttons use `GOOD`/`BAD`
labels when the valence is clear and `IMAGE 1`/`IMAGE 2` style labels when the image pair is
better treated as alternate presentation material.

The rejected images folder from the Mystery Room Studio repo is not copied.
