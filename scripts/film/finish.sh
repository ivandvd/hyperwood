#!/bin/sh
# A film clip's finish, from the clip as it was generated to the files the page plays
# (src/assets/film/<name>.mp4 and <name>.jpg). Needs ffmpeg and node.
#
# The look follows the reference's films: everything soft, whatever moves smeared as by a long exposure,
# the lights haloed, the film grainy, flickering and scratched. A generated clip comes sharp and clean; this
# takes it there.
#
#   1. Black and white (here): deeper blacks; the room falls away into the dark around the subject, so the
#      lit figure is the subject; whatever moves is smeared over seven frames (what stands still stays as it
#      is); a soft focus; halation; grain; a slight flicker.
#   2. Colour (tint.cjs): the picture is laid on the page's Ink, the bulb's light is turned to Hyper Neon,
#      and the film gets its scratches and dust.
#
# usage: sh scripts/film/finish.sh <the generated clip> <name> <bulb window: x y w h> <subject: x y> [fall-off] [work folder]
#   bulb window  a part of the frame that surely holds the bulb and nothing as bright, as shares of its
#                width and height
#   subject      where the fall-off into the dark is centred, as shares of the width and height
#   fall-off     how steeply the room falls away (0.8 as a rule; 0 for none)
# In the environment, to tune a clip: SOFT (the soft focus, px of blur at the clip's own size, 1.5),
# BLOOM (the halation, 0.26), and tint.cjs's own (GLOW_PCT, GLOW_GAIN, WEAR, CRF, and LOOP: the film's end
# dissolves into its beginning over that many frames, so it can play round and round).
#
# The three films, as they were made (the generated clips are not in the repository):
#   GLOW_PCT=0.4 LOOP=18 sh scripts/film/finish.sh booth-raw.mp4 booth 0.225 0.072 0.216 0.228 0.36 0.40
#   GLOW_PCT=0.4 LOOP=18 sh scripts/film/finish.sh board-raw.mp4 board 0.30 0.19 0.10 0.13 0.48 0.42
#   GLOW_PCT=0.4 LOOP=18 sh scripts/film/finish.sh seal-raw.mp4  seal  0.33 0.19 0.11 0.12 0.47 0.50
# After that: npx tsx scripts/film/light.ts (where each bulb hangs: src/film/reel.ts wants to know).
set -e
RAW="$1"; NAME="$2"; BX="$3"; BY="$4"; BW="$5"; BH="$6"; SX="$7"; SY="$8"; FALL="${9:-0.8}"
WORK="${10:-$(mktemp -d)}"
SOFT="${SOFT:-1.5}"; BLOOM="${BLOOM:-0.26}"
HERE="$(dirname "$0")"
mkdir -p "$WORK"

node "$HERE/bulb.cjs" "$RAW" "$WORK" "$BX" "$BY" "$BW" "$BH"

if [ "$FALL" = "0" ]; then VIG="null"; else VIG="vignette=angle=$FALL:x0=$SX*w:y0=$SY*h"; fi
ffmpeg -v error -y -i "$RAW" -filter_complex "
[0:v]format=gbrp,curves=all='0/0 0.10/0.045 0.30/0.25 0.55/0.54 0.85/0.89 1/1',format=gray,
$VIG,tmix=frames=7:weights='1 2 3 4 3 2 1',gblur=sigma=$SOFT,split[a][b];
[b]gblur=sigma=22[bl];
[a][bl]blend=all_mode=screen:all_opacity=$BLOOM,
noise=alls=9:allf=t,
eq=brightness='0.008*sin(2*PI*n/5.3)+0.005*sin(2*PI*n/2.1)':eval=frame,
format=gray[v]
" -map "[v]" -f rawvideo -pix_fmt gray "$WORK/stage1.gray"

node "$HERE/tint.cjs" "$WORK/stage1.gray" "$WORK/bulb.json" "$HERE/../../src/assets/film/$NAME.mp4" "$HERE/../../src/assets/film/$NAME.jpg"
rm "$WORK/stage1.gray"
