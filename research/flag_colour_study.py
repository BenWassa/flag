#!/usr/bin/env python3
"""Quantitative national-flag colour study for Flag Atlas.

Research-only script. It reads the canonical curriculum from src/data/countries.ts,
downloads the same FlagCDN SVGs used by the app, rasterises them at a fixed width
while preserving native proportions, gives each country equal aggregate weight,
separates neutrals, clusters chromatic pixels in OKLab, compares geographic groups,
and writes machine-readable outputs plus restrained plots.
"""
from __future__ import annotations

import argparse
import io
import json
import math
import random
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

import cairosvg
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from PIL import Image
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics import silhouette_score

ROOT = Path(__file__).resolve().parents[1]
COUNTRIES_TS = ROOT / "src/data/countries.ts"
CONTINENTS_TS = ROOT / "src/data/continents.ts"
DEFAULT_OUT = ROOT / "research/output/flag-colour-study"

RASTER_WIDTH = 480
SAMPLES_PER_COUNTRY = 6000
RANDOM_SEED = 20260820

# Neutral thresholds in OKLCH. Chroma values here are intentionally conservative:
# only genuinely low-chroma pixels are removed from the chromatic analysis.
WHITE_L = 0.92
BLACK_L = 0.18
NEUTRAL_C = 0.045
GREY_C = 0.035

FAMILY_ORDER = ["red", "orange", "yellow/gold", "green", "cyan", "blue", "purple", "other"]


def fetch(url: str, timeout: int = 45) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "FlagAtlasColourStudy/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_catalogue() -> pd.DataFrame:
    text = COUNTRIES_TS.read_text(encoding="utf-8")
    rows = re.findall(r"^([A-Z]{3})\|([A-Z]{2})\|([^|\n]+)\|([a-z0-9-]+)$", text, re.M)
    if len(rows) != 195:
        raise RuntimeError(f"Expected 195 curriculum countries, found {len(rows)}")

    ctext = CONTINENTS_TS.read_text(encoding="utf-8")
    regions = dict(re.findall(
        r"\{ id: '([a-z0-9-]+)', continentId: '([a-z0-9-]+)', name: '[^']+' \}", ctext
    ))
    records = []
    for iso3, iso2, name, region in rows:
        if region not in regions:
            raise RuntimeError(f"Region {region} missing from continent mapping")
        records.append({"iso3": iso3, "iso2": iso2, "country": name,
                        "region": region, "continent": regions[region]})
    return pd.DataFrame(records)


def srgb_to_oklab(rgb: np.ndarray) -> np.ndarray:
    x = np.asarray(rgb, dtype=np.float64) / 255.0
    x = np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)
    r, g, b = x[:, 0], x[:, 1], x[:, 2]
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l_, m_, s_ = np.cbrt(l), np.cbrt(m), np.cbrt(s)
    L = 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_
    a = 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_
    bb = 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    return np.column_stack([L, a, bb])


def oklab_to_srgb(lab: np.ndarray) -> np.ndarray:
    L, a, b = np.asarray(lab, dtype=np.float64).T
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    r = +4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bb = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    x = np.column_stack([r, g, bb])
    x = np.where(x <= 0.0031308, 12.92*x, 1.055*np.maximum(x, 0)**(1/2.4) - 0.055)
    return np.clip(np.rint(x*255), 0, 255).astype(np.uint8)


def lab_to_lch(lab: np.ndarray) -> np.ndarray:
    L, a, b = lab[:, 0], lab[:, 1], lab[:, 2]
    C = np.hypot(a, b)
    h = (np.degrees(np.arctan2(b, a)) + 360) % 360
    return np.column_stack([L, C, h])


def hex_from_lab(lab: np.ndarray) -> str:
    rgb = oklab_to_srgb(np.asarray(lab).reshape(1, 3))[0]
    return "#" + "".join(f"{int(v):02X}" for v in rgb)


def load_flag_rgb(iso2: str, cache: Path) -> np.ndarray:
    cache.mkdir(parents=True, exist_ok=True)
    svg_path = cache / f"{iso2.lower()}.svg"
    if not svg_path.exists():
        svg_path.write_bytes(fetch(f"https://flagcdn.com/{iso2.lower()}.svg"))
    png = cairosvg.svg2png(bytestring=svg_path.read_bytes(), output_width=RASTER_WIDTH)
    im = Image.open(io.BytesIO(png)).convert("RGBA")
    arr = np.asarray(im)
    valid = arr[..., 3] > 8
    return arr[..., :3][valid]


def sample_country_pixels(rgb: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    if len(rgb) == 0:
        raise RuntimeError("Flag raster contained no visible pixels")
    replace = len(rgb) < SAMPLES_PER_COUNTRY
    idx = rng.choice(len(rgb), size=SAMPLES_PER_COUNTRY, replace=replace)
    return rgb[idx]


def neutral_masks(lch: np.ndarray):
    L, C = lch[:, 0], lch[:, 1]
    white = (L >= WHITE_L) & (C < NEUTRAL_C)
    black = (L <= BLACK_L) & (C < NEUTRAL_C)
    grey = (~white) & (~black) & (C < GREY_C)
    chrom = ~(white | black | grey)
    return white, black, grey, chrom


def hue_family(lch: np.ndarray) -> np.ndarray:
    h = lch[:, 2]
    out = np.full(len(h), "other", dtype=object)
    out[(h >= 345) | (h < 25)] = "red"
    out[(h >= 25) & (h < 55)] = "orange"
    out[(h >= 55) & (h < 105)] = "yellow/gold"
    out[(h >= 105) & (h < 170)] = "green"
    out[(h >= 170) & (h < 220)] = "cyan"
    out[(h >= 220) & (h < 285)] = "blue"
    out[(h >= 285) & (h < 345)] = "purple"
    return out


def wcag_luminance(hexv: str) -> float:
    vals = np.array([int(hexv[i:i+2], 16) / 255 for i in (1, 3, 5)])
    vals = np.where(vals <= 0.04045, vals / 12.92, ((vals + 0.055) / 1.055) ** 2.4)
    return float(vals @ np.array([0.2126, 0.7152, 0.0722]))


def contrast(a: str, b: str) -> float:
    l1, l2 = wcag_luminance(a), wcag_luminance(b)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def restcountries_coordinates() -> dict[str, tuple[float, float]]:
    # REST Countries' latlng field is a reproducible representative point, not a polygon centroid.
    data = json.loads(fetch("https://restcountries.com/v3.1/all?fields=cca3,latlng"))
    out = {}
    for row in data:
        ll = row.get("latlng") or []
        if row.get("cca3") and len(ll) >= 2:
            out[row["cca3"]] = (float(ll[0]), float(ll[1]))
    return out


def aggregate(df: pd.DataFrame, group: str | None) -> pd.DataFrame:
    cols = ["white", "black", "grey"] + FAMILY_ORDER
    if group is None:
        vals = df[cols].mean().to_frame().T
        vals.insert(0, "group", "Global")
        return vals
    out = df.groupby(group, sort=False)[cols].mean().reset_index().rename(columns={group: "group"})
    return out


def make_plots(outdir: Path, global_area: pd.DataFrame, clusters: pd.DataFrame,
               continents: pd.DataFrame, hemis: pd.DataFrame):
    plt.rcParams.update({"font.size": 10})
    labels = [c for c in ["red", "blue", "green", "yellow/gold", "white", "black", "grey", "orange", "cyan", "purple"] if c in global_area.columns]
    vals = [float(global_area.iloc[0][x]) * 100 for x in labels]
    fig, ax = plt.subplots(figsize=(9, 4.8))
    ax.bar(labels, vals)
    ax.set_ylabel("Equal-country weighted flag area (%)")
    ax.set_title("Flag Atlas curriculum: global colour families")
    ax.tick_params(axis="x", rotation=35)
    fig.tight_layout(); fig.savefig(outdir / "global-area.png", dpi=180); plt.close(fig)

    fig, ax = plt.subplots(figsize=(9, 4.8))
    ax.bar(range(len(clusters)), clusters["chromatic_share_pct"])
    ax.set_xticks(range(len(clusters)), clusters["hex"], rotation=35)
    ax.set_ylabel("Chromatic flag area (%)")
    ax.set_title("Data-driven OKLab chromatic clusters")
    fig.tight_layout(); fig.savefig(outdir / "chromatic-clusters.png", dpi=180); plt.close(fig)

    family_cols = ["red", "blue", "green", "yellow/gold", "white", "black"]
    plot = continents.set_index("group")[family_cols] * 100
    ax = plot.plot(kind="bar", figsize=(10, 5.2))
    ax.set_ylabel("Equal-country weighted area (%)")
    ax.set_title("Continent comparison")
    ax.legend(ncol=3, frameon=False)
    plt.tight_layout(); plt.savefig(outdir / "continents.png", dpi=180); plt.close()

    if len(hemis):
        plot = hemis.set_index("group")[family_cols] * 100
        ax = plot.plot(kind="bar", figsize=(9, 4.8))
        ax.set_ylabel("Equal-country weighted area (%)")
        ax.set_title("Hemisphere experiment")
        ax.legend(ncol=3, frameon=False)
        plt.tight_layout(); plt.savefig(outdir / "hemispheres.png", dpi=180); plt.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--cache", type=Path, default=ROOT / ".cache/flag-colour-study")
    args = ap.parse_args()
    outdir = args.out
    outdir.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(RANDOM_SEED)

    cat = parse_catalogue()
    per_country = []
    country_chrom_lab: dict[str, np.ndarray] = {}
    all_chrom = []

    for row in cat.to_dict("records"):
        rgb = sample_country_pixels(load_flag_rgb(row["iso2"], args.cache), rng)
        lab = srgb_to_oklab(rgb)
        lch = lab_to_lch(lab)
        white, black, grey, chrom = neutral_masks(lch)
        fam = hue_family(lch[chrom])
        rec = dict(row)
        rec.update({"white": white.mean(), "black": black.mean(), "grey": grey.mean()})
        for f in FAMILY_ORDER:
            rec[f] = float(np.sum(fam == f) / len(rgb))
        per_country.append(rec)
        country_chrom_lab[row["iso3"]] = lab[chrom]
        all_chrom.append(lab[chrom])

    per = pd.DataFrame(per_country)
    # Equal country weight is preserved because every country contributes exactly the same
    # number of sampled pixels before neutral separation.
    chrom_lab = np.vstack(all_chrom)

    # Choose k via silhouette score on a fixed-size, fixed-seed subsample.
    sub_n = min(60000, len(chrom_lab))
    sub = chrom_lab[rng.choice(len(chrom_lab), size=sub_n, replace=False)]
    metrics = []
    models = {}
    for k in range(6, 13):
        km = MiniBatchKMeans(n_clusters=k, random_state=RANDOM_SEED, batch_size=4096, n_init=5)
        labels = km.fit_predict(sub)
        score = silhouette_score(sub, labels, sample_size=min(20000, len(sub)), random_state=RANDOM_SEED)
        metrics.append({"k": k, "silhouette": score})
        models[k] = km
    metric_df = pd.DataFrame(metrics)
    best_k = int(metric_df.sort_values(["silhouette", "k"], ascending=[False, True]).iloc[0]["k"])
    km = MiniBatchKMeans(n_clusters=best_k, random_state=RANDOM_SEED, batch_size=4096, n_init=10).fit(chrom_lab)
    labels = km.labels_
    centers = km.cluster_centers_
    counts = np.bincount(labels, minlength=best_k)

    # Total chromatic share across the equal-country pixel pool.
    total_samples = len(per) * SAMPLES_PER_COUNTRY
    cluster_rows = []
    for i, centre in enumerate(centers):
        lch = lab_to_lch(centre.reshape(1, 3))[0]
        prominence = []
        for iso3, labs in country_chrom_lab.items():
            if len(labs) == 0:
                continue
            d = np.linalg.norm(labs - centre, axis=1)
            prominence.append((iso3, float(np.mean(d < np.percentile(d, 25)))))
        # More interpretable country examples: nearest-centre assignment share per country.
        country_shares = []
        for iso3, labs in country_chrom_lab.items():
            if len(labs) == 0:
                continue
            dists = np.linalg.norm(labs[:, None, :] - centers[None, :, :], axis=2)
            share = float(np.mean(np.argmin(dists, axis=1) == i))
            country_shares.append((iso3, share))
        country_shares.sort(key=lambda x: x[1], reverse=True)
        examples = [x[0] for x in country_shares[:8]]
        cluster_rows.append({
            "cluster": i, "hex": hex_from_lab(centre), "L": lch[0], "C": lch[1], "h": lch[2],
            "chromatic_share_pct": counts[i] / len(chrom_lab) * 100,
            "total_area_pct": counts[i] / total_samples * 100,
            "prominent_iso3": ", ".join(examples),
        })
    clusters = pd.DataFrame(cluster_rows).sort_values("chromatic_share_pct", ascending=False).reset_index(drop=True)

    global_area = aggregate(per, None)
    continents = aggregate(per, "continent")
    regions = aggregate(per, "region")

    coords = restcountries_coordinates()
    hemi_frames = []
    for axis, name in [(0, "Latitude"), (1, "Longitude")]:
        temp = per.copy()
        temp["coord"] = temp["iso3"].map(lambda x: coords.get(x, (np.nan, np.nan))[axis])
        temp = temp[np.isfinite(temp["coord"])].copy()
        if axis == 0:
            temp["hemi"] = np.where(temp["coord"] >= 0, "Northern", "Southern")
        else:
            temp["hemi"] = np.where(temp["coord"] >= 0, "Eastern", "Western")
        a = aggregate(temp, "hemi")
        a["group"] = name + ": " + a["group"]
        hemi_frames.append(a)
    hemis = pd.concat(hemi_frames, ignore_index=True)

    per.to_csv(outdir / "per-country.csv", index=False)
    global_area.to_csv(outdir / "global-area.csv", index=False)
    continents.to_csv(outdir / "continents.csv", index=False)
    regions.to_csv(outdir / "regions.csv", index=False)
    hemis.to_csv(outdir / "hemispheres.csv", index=False)
    clusters.to_csv(outdir / "clusters.csv", index=False)
    metric_df.to_csv(outdir / "cluster-selection.csv", index=False)

    summary = {
        "country_count": len(per), "samples_per_country": SAMPLES_PER_COUNTRY,
        "raster_width": RASTER_WIDTH, "chosen_k": best_k,
        "neutral_thresholds": {"white_L": WHITE_L, "black_L": BLACK_L, "neutral_C": NEUTRAL_C, "grey_C": GREY_C},
        "global_area_pct": {c: float(global_area.iloc[0][c] * 100) for c in ["white", "black", "grey"] + FAMILY_ORDER},
        "clusters": clusters.to_dict("records"),
    }
    (outdir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    make_plots(outdir, global_area, clusters, continents, hemis)

    # Small accessibility helper table for downstream palette evaluation.
    swatches = ["#1F4FD6", "#2563EB", "#1769E0", "#0F6CBD", "#0B6E75", "#FFFFFF", "#101318"]
    rows = []
    for bg in swatches[:5]:
        rows.append({"background": bg, "white_text": contrast(bg, "#FFFFFF"), "dark_text": contrast(bg, "#101318")})
    pd.DataFrame(rows).to_csv(outdir / "contrast-baselines.csv", index=False)

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
