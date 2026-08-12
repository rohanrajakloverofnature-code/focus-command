#!/usr/bin/env bash
set -euo pipefail

# The source video is the user-approved footage. This only keys its baked black
# matte into alpha and packages the same moving frames in Android-safe animated WebP.
SOURCE="assets/videos/cinematic-launch-fire.mp4"
OUTPUT="assets/images/launch-fire-alpha.webp"

ffmpeg -y -i "$SOURCE" \
  -vf "fps=24,scale=288:512:flags=lanczos,colorkey=0x000000:0.20:0.02,format=rgba" \
  -loop 0 \
  -c:v libwebp_anim \
  -lossless 0 \
  -compression_level 6 \
  -q:v 40 \
  -preset picture \
  -an \
  "$OUTPUT"

ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,nb_frames,avg_frame_rate -of default=noprint_wrappers=1 "$OUTPUT"
