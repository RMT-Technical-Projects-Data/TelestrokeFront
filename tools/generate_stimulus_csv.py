"""Build the reference curves for the exam graph from the stimulus videos the device actually plays.

Why: the graph used one CSV per stimulus type and speed, timed on a 30 fps assumption, while the device
plays 18 different videos (3 types x 3 shapes x 2 screens) at 30.30 fps with different lead-in holds and
lengths. Graph and video therefore drifted apart. This script writes one CSV per video, on that video's own
timeline, so the graph can run for exactly as long as the video does.

Method
  * Track the red shape in every frame of each video (OpenCV).
  * H-shape and Vertical: keep the validated curve values of the existing CSV and only re-time them: find
    the start offset that lines the old curve up with the tracked motion (the frame-rate ratio 30/fps is
    fixed, not searched), then clip/extend to the video's duration.
  * Horizontal: derive the curve from the tracked position, calibrated on the right-screen square video,
    because the old CSV does not describe the circle video and is ambiguous on left/right (symmetric path).
  * Left-screen videos are the right-screen path turned 180 degrees, so their pixel offsets are mirrored to
    stay in the same (patient) convention as the right screen.

Time(s) is the 1x video timeline. The web app divides it by the speed factor (slow 0.5, medium 1, fast 2).

Usage (needs opencv-python and numpy):
  python tools/generate_stimulus_csv.py --videos <device repo>/rsc --legacy public/ShapesGraph \\
         --out public/ShapesGraph/Stimulus
"""
import argparse
import csv
import os
import sys

import cv2
import numpy as np

TYPES = [  # (video number offset, prefix, legacy folder/file stem)
    ("H", "H-Shape", "H_shape"),
    ("Vertical", "Vertical-Shape", "Vertical"),
    ("Horizontal", "Horizontal-Shape", "Horizontal"),
]
SHAPES = ["circle", "square", "star"]
MAX_ROWS = 1000          # the web app keeps at most this many points
MIN_CORR = 0.999         # a re-timed curve must follow the tracked motion this closely


def video_number(type_index, shape_index, eye):
    return type_index * 3 + shape_index + 1 + (9 if eye == "left" else 0)


def track(path):
    """Red-shape centroid per frame -> (fps, x_px, y_px). Frames without the shape hold the last position."""
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    xs, ys = [], []
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        b, g, r = (frame[..., i].astype(int) for i in range(3))
        mask = (r > 120) & (g < 80) & (b < 80)
        if mask.sum() > 20:
            yy, xx = np.nonzero(mask)
            xs.append(xx.mean())
            ys.append(yy.mean())
        else:
            xs.append(np.nan)
            ys.append(np.nan)
    cap.release()
    xs, ys = np.array(xs), np.array(ys)
    idx = np.arange(len(xs))
    for a in (xs, ys):
        good = ~np.isnan(a)
        a[:] = np.interp(idx, idx[good], a[good])
    return fps, xs, ys


def read_legacy(folder, prefix, stem):
    rows = list(csv.DictReader(open(os.path.join(folder, prefix, f"{stem}_medium.csv"))))
    return (np.array([float(r["Time(s)"]) for r in rows]),
            np.array([float(r["X"]) for r in rows]),
            np.array([float(r["Y"]) for r in rows]))


def sign_for(eye):
    """Pixel-offset signs (x, y-up) in patient convention: left screen is turned 180 degrees."""
    return (-1.0, -1.0) if eye == "left" else (1.0, 1.0)


def fit_offset(tc, cx, cy, fps, xs, ys, eye):
    """Start offset b (video seconds) so that old-CSV time t maps to video time (30/fps)*t + b."""
    sx, sy = sign_for(eye)
    t_video = np.arange(len(xs)) / fps
    px = sx * (xs - 640.0)
    py = sy * (360.0 - ys)
    scale = 30.0 / fps
    best = (-9.0, 0.0)
    for b in np.arange(-3.0, 4.0001, 0.005):
        tq = scale * tc + b
        ok = (tq >= t_video[0]) & (tq <= t_video[-1])
        if ok.sum() < 0.7 * len(tc):
            continue
        score, used = 0.0, 0
        for c, p in ((cx, px), (cy, py)):
            if np.std(c) > 1.0:
                score += np.corrcoef(c[ok], np.interp(tq[ok], t_video, p))[0, 1]
                used += 1
        score /= max(used, 1)
        if score > best[0]:
            best = (score, b)
    return best[1], best[0]


def retime(tc, cx, cy, fps, duration, b):
    """Old curve on the video's timeline: hold at t=0, rows inside the video, hold until the video ends."""
    tau = (30.0 / fps) * tc + b
    keep = (tau >= 0.0) & (tau < duration - 0.005)  # the closing hold row is added below
    t, x, y = list(tau[keep]), list(cx[keep]), list(cy[keep])
    first = int(np.argmax(keep)) if keep.any() else 0
    if not t or t[0] > 1e-9:
        before = max(first - 1, 0) if tau[0] < 0 else 0
        t.insert(0, 0.0)
        x.insert(0, float(cx[before]))
        y.insert(0, float(cy[before]))
    t.append(duration)
    x.append(x[-1])
    y.append(y[-1])
    return np.array(t), np.array(x), np.array(y)


def derive(fps, xs, ys, eye, k, m):
    """Tracked position -> degrees using the calibration (k deg/px, m deg offset) from the right-screen square."""
    sx, sy = sign_for(eye)
    t = np.arange(len(xs)) / fps
    x = k * sx * (xs - 640.0) + m
    y = k * sy * (360.0 - ys)
    return np.append(t, len(xs) / fps), np.append(x, x[-1]), np.append(y, y[-1])


def thin(t, x, y):
    if len(t) <= MAX_ROWS:
        return t, x, y
    step = int(np.ceil(len(t) / MAX_ROWS))
    keep = np.arange(0, len(t), step)
    if keep[-1] != len(t) - 1:
        keep = np.append(keep, len(t) - 1)
    return t[keep], x[keep], y[keep]


def write(path, t, x, y):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["Frame", "Time(s)", "X", "Y"])
        for i, (a, b, c) in enumerate(zip(t, x, y), start=1):
            w.writerow([i, f"{a:.3f}", f"{b:.2f}", f"{c:.2f}"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--videos", required=True)
    ap.add_argument("--legacy", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)

    tracks = {}
    for ti in range(3):
        for si in range(3):
            for eye in ("right", "left"):
                n = video_number(ti, si, eye)
                tracks[n] = track(os.path.join(args.videos, f"Video{n}.mp4"))

    # Horizontal calibration: right-screen square video against the old horizontal curve.
    tc, cx, cy = read_legacy(args.legacy, TYPES[2][1], TYPES[2][2])
    fps, xs, ys = tracks[video_number(2, 1, "right")]
    b, corr = fit_offset(tc, cx, cy, fps, xs, ys, "right")
    tq = (30.0 / fps) * tc + b
    p = np.interp(tq, np.arange(len(xs)) / fps, xs - 640.0)
    (k, m), *_ = np.linalg.lstsq(np.vstack([p, np.ones_like(p)]).T, cx, rcond=None)
    print(f"horizontal calibration: {k:.5f} deg/px, offset {m:+.3f} deg (fit corr {corr:.5f})")

    failures = 0
    for ti, (prefix_name, folder, stem) in enumerate(TYPES):
        tc, cx, cy = read_legacy(args.legacy, folder, stem)
        for si, shape in enumerate(SHAPES):
            for eye in ("right", "left"):
                n = video_number(ti, si, eye)
                fps, xs, ys = tracks[n]
                duration = len(xs) / fps
                if prefix_name == "Horizontal":
                    t, x, y = derive(fps, xs, ys, eye, k, m)
                    how = "derived"
                else:
                    b, corr = fit_offset(tc, cx, cy, fps, xs, ys, eye)
                    t, x, y = retime(tc, cx, cy, fps, duration, b)
                    how = f"re-timed b={b:+.2f}s corr={corr:.5f}"
                    if corr < MIN_CORR:
                        print(f"  !! Video{n}: curve does not follow the video (corr {corr:.4f})")
                        failures += 1
                t, x, y = thin(t, x, y)
                name = f"{prefix_name}_{shape}_{eye}.csv"
                write(os.path.join(args.out, name), t, x, y)
                print(f"Video{n:<2} {name:26} {how:34} rows={len(t):4} duration={duration:6.2f}s")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
