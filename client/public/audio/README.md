# Audio assets

Used by the Ambient Audio admin page (`/admin/games/:id/ambient`).

Expected files (drop in this directory, names must match exactly):

- `gong.mp3` — played on every correct card or mission answer
- `bum-bum.mp3` — played on every incorrect answer

Sourcing suggestions:

- freesound.org (CC0/CC-BY) — search "temple gong", "bell toll", "fail thud"
- pixabay.com/sound-effects — royalty-free, no attribution required
- mixkit.co/free-sound-effects — same

Keep both clips short (under ~1.5s of audible content) so a burst of events
doesn't pile up. The player staggers events ~450ms apart anyway, but tighter
clips feel snappier in the room.
