#!/bin/zsh
# Builds the app's exercise media from the MoveKit library (videos + posters).
# Usage: scripts/build_exercise_media.sh <videos_dir> <posters_dir> [jobs]
#   dark/<name>.mp4   1080px inverted "x-ray" loop, HEVC (session, guide, exercise detail)
#   poster/<name>.jpg 1080px dark still from the poster (instant first frame; also cropped for hero cards)
#   thumb/<name>.jpg  256px light square crop of the poster (circular list rows)
# HEVC keeps the bundle small (~half of H.264 at the same quality); hvc1 tag is required for AVFoundation.
set -e
SELF=${0:A}
cd "$(dirname "$0")/.."
OUT=assets/exercise-media
GRADE="negate,eq=contrast=1.35:brightness=-0.06:saturation=1.3,curves=all='0/0 0.1/0.0 1/1'"

# Worker mode: encode one clip. Invoked by the parallel driver below.
if [ "$1" = "--one" ]; then
  f=$2
  POS=$3
  n=$(basename $f .mp4)
  p=$POS/$n.png
  [ -f $OUT/dark/$n.mp4 ] && [ -f $OUT/poster/$n.jpg ] && exit 0
  ffmpeg -v error -y -i $f -vf "$GRADE,scale=1080:-2,format=yuv420p" -an -c:v libx265 -crf 28 -preset slow -tag:v hvc1 \
    -x265-params log-level=error -movflags +faststart $OUT/dark/$n.mp4
  if [ -f $p ]; then
    ffmpeg -v error -y -i $p -vf "$GRADE,scale=1080:-2" -q:v 4 $OUT/poster/$n.jpg
    ffmpeg -v error -y -i $p -vf "crop=ih:ih,scale=256:256" -q:v 3 $OUT/thumb/$n.jpg
  fi
  echo "done $n"
  exit 0
fi

VID=${1:?videos dir}
POS=${2:?posters dir}
JOBS=${3:-6}
mkdir -p $OUT/dark $OUT/poster $OUT/thumb
ls $VID/*.mp4 | xargs -P $JOBS -I{} zsh "$SELF" --one {} "$POS"
