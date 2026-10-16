# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One guitarist, the owner. Knows open chords, now learning major and minor triads across the neck on each three-string set. Uses it at home while holding the guitar, so the screen is read at arm's length or further with both hands busy.

## Product Purpose

Show every shape of one triad on one string set at once, coloured by chord tone, so the player can see where the chord lives on the whole neck. Comping mode plays a progression and shows the same view for whichever chord is sounding. Success is the player finding a shape for any chord without stopping to think.

## Positioning

A single-chord, whole-neck view coloured by movable-do role (do = root, mi = third, so = fifth, the same names for minor), rather than a chord dictionary or a drill. Comping uses the same view in time with a backing.

## Operating Context

- Mostly a laptop or desktop on a desk or stand; must also work on a phone.
- Viewed from about a metre away while playing. Taps happen between phrases, not mid-phrase.
- Served from a Raspberry Pi on the home wifi at `https://triads.julianjelfs.co.uk`; also over Tailscale away from home.
- Comping fetches piano and guitar samples from the internet the first time.

## Capabilities and Constraints

- Learn mode: pick key (12), quality (major/minor), string set (6-5-4, 5-4-3, 4-3-2, 3-2-1). Fretboard to fret 15 with every shape, note names toggle, three-beat metronome with BPM.
- Comping mode: progression, key, string set, sound (piano/guitar), BPM. One bar of count-in, then the loop. Shows current chord, next chord, progression strip, and loop count.
- Settings persist in SQLite on the Pi. No accounts.
- Stack: Svelte 5 + Vite frontend, FastAPI backend. No CSS framework.
- Note names are spelled by key (Db major, C# minor; Bb in F).

## Evidence on Hand

- Screenshot of learn mode: `docs/learn.png`.
- No users other than the owner, no testimonials, no marketing surface.

## Product Principles

1. The fretboard is the product. Everything else is a control for it.
2. Readable from a metre away. Size and contrast win over density.
3. Colour carries meaning (do, mi, so) and nothing else may compete with it.
4. One chord at a time. No scoring, logging or drills.

## Accessibility & Inclusion

Do/mi/so must stay distinguishable without relying on hue alone where possible (note names inside dots, legend), and keep enough contrast to read at distance.
