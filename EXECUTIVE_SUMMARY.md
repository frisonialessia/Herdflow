# HerdFlow — Executive Summary

> **Predictive livestock health: catch illness *before* it shows.**
> Per-animal, explainable anomaly detection that works on any sensor.

## The problem
On most farms illness is caught **late** — by eye, after production loss,
treatment cost or death. A clinical mastitis case runs ~€200–400; every extra
"open" day on a dairy cow costs ~€3–5; a missed heat pushes calving back weeks.
Farmers lack the labor to watch every animal, and existing tools are **siloed by
hardware brand** and often **black-box**.

## The solution
HerdFlow scores **each animal against its own rolling baseline** (temperature,
activity, rumination, intake, heart rate, respiration) with a **z-score**:
`|z|>2` = watch, `|z|>3` = critical. Alerts are **explainable** and mapped to a
likely condition — fever/mastitis, estrus, lameness, off-feed — with a
recommended action. The differentiator is the **explainable intelligence layer**,
not another tag.

## Proof (engine validation, labelled data)
At the recommended operating point (`|z|>2.5`):

| Detection | False alarms | Caught before visible | Median lead |
|---|---|---|---|
| **100%** | **0%** | **88%** | **~12h** |

Reproducible: `node scripts/poc-eval.mjs`. *(Simulated-but-labelled; next step is
the same evaluation on real farm telemetry with vet-confirmed outcomes.)*

## Market & wedge
Start narrow: **dairy cattle** (high value/animal, dense sensor adoption,
unambiguous ROI on mastitis + fertility). Buyers reached through **cooperatives
and veterinarians**. Expand to beef feedlots, then sheep and others.

## Why we win (moat)
1. **Hardware-agnostic** — the open insight layer across smaXtec / Nedap /
   Afimilk / Allflex, instead of locking farmers to one tag.
2. **Explainability** — z-score + condition + trend builds trust with vets vs
   black-box AI.
3. **Proprietary labelled outcomes** — every vet-confirmed case improves the
   models (data network effect).
4. Emerging wedge: **methane / welfare / ESG reporting** per animal (EU tailwind).

## Status
- ✅ **Live interactive demo** (landing + dashboard), synthetic data, no backend.
- ✅ **Detection engine validated** on labelled data (see `POC.md`).
- ▶️ Next: **Phase 1** — real farm data + one vet-validated detection.

## The ask
Design-partner **dairy farms** and a **sensor/hardware partner** for the Phase-1
pilot; warm intros via cooperatives and vets.

---

**Links:** Live demo · GitHub repo · [`ROADMAP.md`](./ROADMAP.md) ·
[`POC.md`](./POC.md) · [`DOCUMENTATION.md`](./DOCUMENTATION.md)
*Figures are industry-ballpark and illustrative until validated with pilot data.*
