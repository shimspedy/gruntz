#!/bin/zsh
# Builds the app's exercise media from the MoveKit library (videos + posters).
# Usage: scripts/build_exercise_media.sh <videos_dir> <posters_dir>
#   dark/<name>.mp4   1440px inverted "x-ray" loop (session, guide, exercise detail)
#   poster/<name>.jpg 1440px dark still from the poster (instant first frame, no video decode)
#   thumb/<name>.jpg  256px light square crop of the poster (circular list rows)
#   hero/<name>.jpg   900x1200 dark portrait crop (plan hero cards)
set -e
cd "$(dirname "$0")/.."
VID=${1:?videos dir}
POS=${2:?posters dir}
OUT=assets/exercise-media
mkdir -p $OUT/dark $OUT/poster $OUT/thumb $OUT/hero
GRADE="negate,eq=contrast=1.35:brightness=-0.06:saturation=1.3,curves=all='0/0 0.1/0.0 1/1'"
for f in $VID/*.mp4; do
  n=$(basename $f .mp4)
  p=$POS/$n.png
  [ -f $OUT/dark/$n.mp4 ] && [ -f $OUT/hero/$n.jpg ] && continue
  ffmpeg -v error -y -i $f -vf "$GRADE,scale=1440:-2,format=yuv420p" -an -c:v libx264 -profile:v high -crf 24 -preset slow -movflags +faststart $OUT/dark/$n.mp4
  if [ -f $p ]; then
    ffmpeg -v error -y -i $p -vf "$GRADE,scale=1440:-2" -q:v 3 $OUT/poster/$n.jpg
    ffmpeg -v error -y -i $p -vf "crop=ih:ih,scale=256:256" -q:v 3 $OUT/thumb/$n.jpg
    ffmpeg -v error -y -i $p -vf "$GRADE,crop=ih*0.63:ih*0.84:(iw-ih*0.63)/2:ih*0.05,scale=900:1200" -q:v 3 $OUT/hero/$n.jpg
  fi
  echo "done $n"
done
