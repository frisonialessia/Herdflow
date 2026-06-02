#!/usr/bin/env node
// HerdFlow — Proof-of-Concept evaluation of the detection engine.
//
// Self-contained (no dependencies). It:
//   1. generates labelled telemetry: animals with an injected illness onset at a
//      known time, plus healthy controls;
//   2. runs the per-animal z-score detector in *streaming* fashion (each reading
//      scored against the animal's own trailing baseline — the same idea as
//      lib/anomaly.ts), with light smoothing;
//   3. reports detection rate, lead time vs the "visible to the eye" point, and
//      the false-alarm rate, across a few alert thresholds.
//
// Run:  node scripts/poc-eval.mjs
// Deterministic (seeded) so the numbers are reproducible.

// ---------- deterministic RNG ----------
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(99);
const gauss = (m, sd) => {
  const u = 1 - rnd(), v = rnd();
  return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---------- parameters ----------
const STEP_H = 2;                       // hours between readings
const HIST_DAYS = 14;                   // trailing baseline window
const EVAL_DAYS = 7;                    // evaluation horizon
const WIN = (HIST_DAYS * 24) / STEP_H;  // baseline window length (readings)
const EVAL = (EVAL_DAYS * 24) / STEP_H; // eval steps
const TOTAL = WIN + EVAL;
const N_SICK = 120;
const N_HEALTHY = 280;
const RAMP_H = 60;                       // illness ramps in over ~60h
const SMOOTH = 3;                        // readings averaged before scoring
const PERSIST = 2;                       // consecutive flags required to alert

const NORM = { temp: 38.5, act: 60, rum: 480, intake: 11 };
const NOISE = { temp: 0.18, act: 5, rum: 22, intake: 0.8 };

// "Visible to the eye" thresholds (deviation a human would notice)
const FEVER_VISIBLE = 1.0;  // +1.0 °C
const ACT_VISIBLE = 0.40;   // -40% activity

const circ = (t) => (Math.sin((((t * STEP_H) % 24 - 6) / 24) * 2 * Math.PI) + 1) / 2;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a, m) => Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length) || 1;

const METRICS = ["temp", "act", "rum", "intake"];

// ---------- generate one labelled animal ----------
function makeAnimal(type) {
  const base = {
    temp: gauss(NORM.temp, 0.15),
    act: gauss(NORM.act, 7),
    rum: gauss(NORM.rum, 25),
    intake: gauss(NORM.intake, NORM.intake * 0.08),
  };
  const onset = type === "healthy" ? -1 : WIN + Math.floor(rnd() * (EVAL - RAMP_H / STEP_H - 4));
  const series = { temp: [], act: [], rum: [], intake: [] };
  let visible = -1;
  for (let t = 0; t < TOTAL; t++) {
    const c = circ(t);
    let temp = base.temp + gauss(0, NOISE.temp);
    let act = base.act * (0.65 + 0.35 * c) + gauss(0, NOISE.act);
    const rum = base.rum + gauss(0, NOISE.rum);
    const intake = base.intake + gauss(0, NOISE.intake);
    if (type !== "healthy" && t >= onset) {
      const frac = Math.min(1, ((t - onset) * STEP_H) / RAMP_H);
      if (type === "fever") {
        temp += frac * 1.6;
        if (visible < 0 && frac * 1.6 >= FEVER_VISIBLE) visible = t;
      } else {
        act -= frac * 0.5 * base.act;
        if (visible < 0 && frac * 0.5 >= ACT_VISIBLE) visible = t;
      }
    }
    series.temp.push(temp);
    series.act.push(Math.max(0, act));
    series.rum.push(Math.max(0, rum));
    series.intake.push(Math.max(0, intake));
  }
  return { type, onset, visible, series };
}

// ---------- streaming detection ----------
// First eval step where the worst-metric (smoothed) |z| exceeds `zT` for
// `PERSIST` consecutive readings; -1 if never.
function detectFirst(a, zT) {
  let consec = 0;
  for (let t = WIN; t < TOTAL; t++) {
    let worst = 0;
    for (const k of METRICS) {
      const arr = a.series[k];
      const win = arr.slice(t - WIN, t);
      const m = mean(win);
      const sd = std(win, m);
      let recent = 0;
      for (let j = Math.max(0, t - SMOOTH + 1); j <= t; j++) recent += arr[j];
      recent /= Math.min(SMOOTH, t + 1);
      const z = Math.abs((recent - m) / sd);
      if (z > worst) worst = z;
    }
    if (worst > zT) {
      consec++;
      if (consec >= PERSIST) return t;
    } else consec = 0;
  }
  return -1;
}

// ---------- run ----------
const animals = [];
for (let i = 0; i < N_SICK; i++) animals.push(makeAnimal(rnd() < 0.6 ? "fever" : "lameness"));
for (let i = 0; i < N_HEALTHY; i++) animals.push(makeAnimal("healthy"));

function evaluate(zT) {
  let detected = 0, fp = 0;
  const leads = [];
  for (const a of animals) {
    const d = detectFirst(a, zT);
    if (a.type === "healthy") {
      if (d >= 0) fp++;
    } else if (d >= 0) {
      detected++;
      const vis = a.visible >= 0 ? a.visible : a.onset + RAMP_H / STEP_H;
      leads.push((vis - d) * STEP_H);
    }
  }
  leads.sort((x, y) => x - y);
  const median = leads.length ? leads[Math.floor(leads.length / 2)] : 0;
  const beforeVisible = leads.length ? leads.filter((h) => h > 0).length / leads.length : 0;
  return {
    zT,
    recall: detected / N_SICK,
    fpRate: fp / N_HEALTHY,
    precision: detected / (detected + fp || 1),
    medianLeadDays: median / 24,
    beforeVisible,
  };
}

const pct = (x) => (x * 100).toFixed(1) + "%";
const d1 = (x) => x.toFixed(1);

console.log("HerdFlow — detection-engine PoC");
console.log("================================================");
console.log(`Cohort: ${N_SICK} animals with an injected illness + ${N_HEALTHY} healthy controls`);
console.log(`Sampling every ${STEP_H}h · ${HIST_DAYS}d rolling baseline · ${EVAL_DAYS}d evaluation`);
console.log(`Detector: per-animal z-score, ${SMOOTH}-reading smoothing, ${PERSIST} consecutive flags to alert`);
console.log("");
console.log("threshold | detection | before visible | median lead | false alarms | precision");
console.log("----------|-----------|----------------|-------------|--------------|----------");
for (const zT of [2.0, 2.5, 3.0]) {
  const r = evaluate(zT);
  console.log(
    `  |z|>${zT.toFixed(1)}  |   ${pct(r.recall).padStart(6)}  |     ${pct(r.beforeVisible).padStart(6)}    |   ${(d1(r.medianLeadDays) + "d").padStart(6)}    |    ${pct(r.fpRate).padStart(6)}    |   ${pct(r.precision)}`
  );
}
console.log("");
console.log("Lead time = time between the first alert and the point the sign would be visible to the eye.");
console.log("Data is simulated-but-labelled; the next step is the same eval on real farm telemetry.");
