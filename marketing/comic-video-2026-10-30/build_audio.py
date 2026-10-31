#!/usr/bin/env python3
"""Build the original, sample-free score and SFX for the Since Monday comic.

All sound is synthesized algorithmically here from oscillators and seeded noise.
No third-party music, recordings, samples, speech, or external services are used.
Run with the bundled Python (NumPy required). Output: assets/since-monday-original.wav.
"""

from pathlib import Path
import json
import wave

import numpy as np


RATE = 48_000
DURATION = 21.0
TEMPO = 100.0
BEAT = 60.0 / TEMPO
OUT = Path(__file__).resolve().parent / "assets" / "since-monday-original.wav"
RNG = np.random.default_rng(30102026)
music = np.zeros((int(RATE * DURATION), 2), dtype=np.float64)
effects = np.zeros_like(music)


def env(length, attack=0.005, release=0.02):
    """Small click-free ramps around a sound's existing decay envelope."""
    e = np.ones(length)
    a = min(int(attack * RATE), length // 2)
    r = min(int(release * RATE), length // 2)
    if a:
        e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        e[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def add(target, start, sound, gain=1.0, pan=0.0):
    index = int(round(start * RATE))
    if index < 0 or index >= len(target):
        return
    count = min(len(sound), len(target) - index)
    # Equal-power, gently spread stereo; centered low end remains phase coherent.
    angle = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    target[index:index + count, 0] += sound[:count] * gain * np.cos(angle)
    target[index:index + count, 1] += sound[:count] * gain * np.sin(angle)


def lowpass_noise(seconds, width=21):
    noise = RNG.standard_normal(int(seconds * RATE))
    noise = np.convolve(noise, np.ones(width) / width, mode="same")
    return noise / (np.max(np.abs(noise)) + 1e-12)


def kick():
    t = np.arange(int(0.28 * RATE)) / RATE
    phase = 2 * np.pi * (49 * t + 23 * 0.022 * (1 - np.exp(-t / 0.022)))
    return np.sin(phase) * np.exp(-t * 17) * env(len(t), 0.001, 0.03)


def rim():
    t = np.arange(int(0.10 * RATE)) / RATE
    tone = (np.sin(2 * np.pi * 360 * t) + 0.35 * np.sin(2 * np.pi * 610 * t))
    noise = lowpass_noise(0.10, 11)
    return (0.6 * tone + 0.2 * noise) * np.exp(-t * 55) * env(len(t), 0.001, 0.02)


def hat():
    t = np.arange(int(0.055 * RATE)) / RATE
    # A short, soft brushed tick, deliberately limited in treble.
    noise = lowpass_noise(0.055, 7)
    return noise * np.exp(-t * 75) * env(len(t), 0.002, 0.014)


def bass(midi, seconds=0.24):
    t = np.arange(int(seconds * RATE)) / RATE
    frequency = 440.0 * 2 ** ((midi - 69) / 12)
    phase = 2 * np.pi * frequency * t
    tone = np.sin(phase) + 0.18 * np.sin(2 * phase) + 0.055 * np.sin(3 * phase)
    return tone * np.exp(-t * 6.8) * env(len(t), 0.004, 0.035)


def pluck(midi, seconds=0.28):
    t = np.arange(int(seconds * RATE)) / RATE
    frequency = 440.0 * 2 ** ((midi - 69) / 12)
    tone = np.sin(2 * np.pi * frequency * t) + 0.16 * np.sin(2 * np.pi * frequency * 2 * t)
    return tone * np.exp(-t * 14) * env(len(t), 0.006, 0.04)


def bubble(start, pitch=390, gain=0.19, pan=0):
    t = np.arange(int(0.105 * RATE)) / RATE
    phase = 2 * np.pi * (pitch * t + (pitch * 0.62) * 0.02 * (1 - np.exp(-t / 0.02)))
    sound = np.sin(phase) * np.exp(-t * 45) * env(len(t), 0.0015, 0.025)
    add(effects, start, sound, gain, pan)


def beep(start, pitch=610, seconds=0.10, gain=0.18):
    t = np.arange(int(seconds * RATE)) / RATE
    sound = np.sin(2 * np.pi * pitch * t) * env(len(t), 0.012, 0.025)
    add(effects, start, sound, gain)


def tap(start, pitch=500, gain=0.15):
    t = np.arange(int(0.07 * RATE)) / RATE
    sound = np.sin(2 * np.pi * pitch * t) * np.exp(-t * 65) * env(len(t), 0.001, 0.02)
    add(effects, start, sound, gain)


# Original 100 BPM E-minor groove: sparse kick, warm muted bass, and soft rim.
# Only the first 7.8 s of the comic and the product reveal carry the groove.
for beat_index in range(int(DURATION / BEAT) + 1):
    start = beat_index * BEAT
    if beat_index % 4 in (0, 2):
        add(music, start, kick(), 0.24)
    if beat_index % 4 in (1, 3):
        add(music, start, rim(), 0.075, 0.14)
    add(music, start + BEAT / 2, hat(), 0.037, -0.25 if beat_index % 2 else 0.25)

roots = [40, 40, 43, 38]  # E2, E2, G2, D2, repeating original phrase.
for bar in range(int(DURATION / (4 * BEAT)) + 1):
    root = roots[bar % len(roots)]
    for offset, interval, length, strength in [
        (0.0, 0, 0.31, 0.17),
        (1.5, 7, 0.17, 0.13),
        (2.0, 0, 0.26, 0.17),
        (3.5, 3 if bar % 2 == 0 else 2, 0.18, 0.12),
    ]:
        add(music, (bar * 4 + offset) * BEAT, bass(root + interval, length), strength)

# Small musical replies after the app appears, kept out of the dialogue section.
for start, midi, pan in [
    (11.0, 64, -0.2), (11.3, 67, 0.2), (11.6, 71, -0.1),
    (13.1, 67, 0.2), (13.4, 64, -0.2),
    (15.8, 62, -0.2), (16.1, 64, 0.2), (16.4, 67, -0.1),
    (18.2, 64, -0.2), (18.5, 67, 0.2), (18.8, 71, -0.1),
]:
    add(music, start, pluck(midi), 0.048, pan)

# A deliberate beat drop gives the punchline room; the groove resumes at 11 s.
timeline = np.arange(len(music)) / RATE
music_gain = np.full(len(music), 0.88)
music_gain[(timeline >= 7.8) & (timeline < 11.0)] = 0.0
fade_drop = (timeline >= 7.74) & (timeline < 7.8)
music_gain[fade_drop] *= (7.8 - timeline[fade_drop]) / 0.06
fade_return = (timeline >= 11.0) & (timeline < 11.06)
music_gain[fade_return] *= (timeline[fade_return] - 11.0) / 0.06
music *= music_gain[:, None]

beep(0.10, pitch=635, seconds=0.09, gain=0.17)
bubble(1.2, pitch=370, gain=0.19, pan=-0.12)
bubble(3.4, pitch=330, gain=0.18, pan=0.12)
bubble(5.8, pitch=370, gain=0.19, pan=-0.12)
bubble(8.3, pitch=290, gain=0.17, pan=0.12)
beep(10.2, pitch=520, seconds=0.12, gain=0.16)
tap(14.5, pitch=500)
tap(16.0, pitch=560)

# Friendly two-note finish rather than a stock cinematic impact.
for start, midi in [(17.50, 64), (17.63, 71)]:
    add(effects, start, pluck(midi, 0.36), 0.15)

mix = music + effects
mix[:int(0.025 * RATE)] *= np.linspace(0, 1, int(0.025 * RATE))[:, None]
mix[-int(0.6 * RATE):] *= np.linspace(1, 0, int(0.6 * RATE))[:, None]

# Fixed conservative gain preserves dynamics; safety attenuation only if needed.
mix *= 1.85
ceiling = 10 ** (-1.5 / 20)
peak = np.max(np.abs(mix))
if peak > ceiling:
    mix *= ceiling / peak
pcm = np.round(np.clip(mix, -1, 1) * 32767).astype("<i2")
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), "wb") as handle:
    handle.setnchannels(2)
    handle.setsampwidth(2)
    handle.setframerate(RATE)
    handle.writeframes(pcm.tobytes())

with wave.open(str(OUT), "rb") as handle:
    verified = np.frombuffer(handle.readframes(handle.getnframes()), dtype="<i2").astype(float) / 32768
    report = {
        "file": str(OUT),
        "duration_seconds": handle.getnframes() / handle.getframerate(),
        "sample_rate": handle.getframerate(),
        "channels": handle.getnchannels(),
        "sample_width_bytes": handle.getsampwidth(),
        "peak_dbfs": round(20 * np.log10(np.max(np.abs(verified)) + 1e-12), 3),
        "rms_dbfs": round(20 * np.log10(np.sqrt(np.mean(verified ** 2)) + 1e-12), 3),
        "originality": "Algorithmic original score and SFX; no speech or third-party samples.",
    }
    assert report["duration_seconds"] == DURATION
    assert report["channels"] == 2 and report["sample_rate"] == RATE
    assert report["peak_dbfs"] <= -1.0
print(json.dumps(report, indent=2))
