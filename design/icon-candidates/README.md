# Icon candidates

Favicon options in the site's "Bench gear" style (grey case, song colors as the only color). The live icon is `equalizer.svg`, copied to `client/public/favicon.svg`.

- `equalizer.svg`: equalizer bars in a sunken display, each a song color (in use)
- `vinyl.svg`: a dark record with a rainbow center label
- `note.svg`: beamed eighth notes with colored note heads
- `waveform.svg`: a sound wave whose line runs through the spectrum

## Switching icons

Needs `rsvg-convert` (librsvg) and ImageMagick. From the repo root, with `ICON` set to a candidate:

```sh
ICON=design/icon-candidates/vinyl.svg P=client/public
cp $ICON $P/favicon.svg
rsvg-convert -w 192 -h 192 $ICON -o $P/logo192.png
rsvg-convert -w 512 -h 512 $ICON -o $P/logo512.png
for s in 16 32 48; do rsvg-convert -w $s -h $s $ICON -o /tmp/f$s.png; done
magick /tmp/f16.png /tmp/f32.png /tmp/f48.png $P/favicon.ico
```

`apple-touch-icon.png` (180px) and `logo-maskable512.png` need a full-bleed version: swap the two case `<rect>`s for `<rect width="64" height="64" fill="#d6d5d0"/>` and wrap the rest in `<g transform="translate(32 31) scale(S) translate(-32 -31)">`, with `S` = 1.15 for the touch icon and 0.85 for the maskable one, then render those at 180 and 512.
