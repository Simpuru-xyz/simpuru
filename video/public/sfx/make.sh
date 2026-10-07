#!/bin/sh
# Sound effects for the demo, synthesised with ffmpeg (no samples, nothing licensed).
set -e
cd "$(dirname "$0")"
ffmpeg -v error -y -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.5" -af "bandpass=f=1200:w=900,afade=t=in:d=0.1,afade=t=out:st=0.2:d=0.25,volume=0.6" swish.wav
ffmpeg -v error -y -f lavfi -i "sine=f=190:d=0.06" -f lavfi -i "anoisesrc=d=0.025:c=white:a=0.5" -filter_complex "[0]aeval=val(0)*exp(-t*50)[a];[1]highpass=f=3000,afade=t=out:st=0.004:d=0.02[b];[a][b]amix=inputs=2:normalize=0,volume=1.5" tap.wav
ffmpeg -v error -y -f lavfi -i "sine=f=1500:d=0.04" -af "afade=t=out:st=0:d=0.04,volume=0.15" blip.wav
ffmpeg -v error -y -f lavfi -i "sine=f=48:d=1.0" -af "aeval=val(0)*exp(-t*3.5),lowpass=f=150,volume=0.9" thud.wav
ffmpeg -v error -y -f lavfi -i "sine=f=880:d=0.18" -f lavfi -i "sine=f=1320:d=0.18" -filter_complex "[0][1]amix=inputs=2:normalize=0,afade=t=out:st=0.02:d=0.16,volume=0.25" chime.wav
ffmpeg -v error -y -f lavfi -i "sine=f=65.4:d=60" -f lavfi -i "sine=f=98:d=60" -f lavfi -i "sine=f=130.8:d=60" -filter_complex "[0][1][2]amix=inputs=3:normalize=0,tremolo=f=0.12:d=0.35,lowpass=f=320,volume=0.3" pad.wav
