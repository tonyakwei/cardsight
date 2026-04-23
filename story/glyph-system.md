# QRian Central Glyph System

## Overview

The Central Glyph System is the primary QRian writing system used across all puzzle types. Each glyph maps to an English letter (A-Z) or digit (1-9) — 35 characters total.

## Design Principles

Based on initial hand-drawn prototypes:
- All glyphs are based on a **square/rectangular frame** — "cube-like," matching the lore of a language shaped by the Source
- Variation comes from: **which sides are open/closed**, **internal lines** (horizontal/vertical), and **dot placement**
- All roughly the **same size** — they line up in rows like text
- **Drawable by hand** quickly — players will copy them onto index cards
- Share a family resemblance but are individually distinct

## Production Plan

1. Anthony finalizes glyph designs for all 35 characters on paper
2. Fill in a Calligraphr template (one character per box)
3. Upload to Calligraphr → download as `.ttf` font
4. Add to CardSight as a web font (`font-family: 'QRian'`)
5. Displaying glyphs anywhere is then just a CSS class — type English, render as glyphs
6. Same font works in printed materials (story cards, design docs)

**Status: Awaiting Anthony's finalized character designs.**

## Usage

- The font maps English letters to QRian glyphs — type "ALL PATHS DESCEND" with the QRian font and it renders as glyphs
- Underlying data stays as English (searchable, storable in DB)
- Works in: CardSight React app (web font), printed story cards, design documents

## Multiple Glyph Systems

While this is the Central Glyph System (letter/number substitution), other glyph modes exist in the puzzle bank:
- **Conceptual glyphs** (Type C) — glyphs representing concepts/words, not letters
- **Mathematical glyphs** (Type H) — glyphs as variables and operations
- **Temporal glyphs** (Type L) — glyphs describing time

These may use the same visual style but with different semantic rules. The Central Glyph System is the foundation.
