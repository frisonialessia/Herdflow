# HerdFlow — Roadmap & one-page pitch

> **Predictive livestock health: catch illness *before* it shows** — with explainable,
> per-animal anomaly detection that works on any sensor.

This is a living strategy doc. The product today is an interactive demo on synthetic
data ([the app](./README.md)); this is where we're taking it.

---

## The problem
On most farms, illness is caught **late** — by eye, after production loss, treatment
cost or death. A clinical mastitis case runs ~€200–400; every extra "open" day on a
dairy cow costs ~€3–5; a missed heat pushes calving back weeks. Farmers don't have the
labor to watch every animal, and the tools that exist are **siloed by hardware brand**
and often **black-box**.

## The product
HerdFlow scores **each animal against its own rolling baseline** (temperature,
activity, rumination, feed intake) with a **z-score**: `|z|>2` = watch, `|z|>3` =
critical. Alerts are **explainable** and mapped to a likely condition — fever/mastitis,
estrus (heat), lameness, off-feed/ketosis — with a recommended action. Whole-herd map,
per-animal trends, and an ROI view round it out.

The wedge isn't "another tag." It's the **explainable intelligence layer** on top of
telemetry farmers may already have.

## Why now
- Sensor cost ↓ and adoption ↑ (boluses, collars, in-parlor meters are mainstream).
- Acute **farm-labor shortage** — automation is no longer optional.
- Disease + climate pressure on margins.
- **EU regulatory tailwind**: welfare and methane/ESG reporting per animal.
- AI is finally good (and cheap) enough to run per-animal models at scale.

## Wedge & ICP
- **Start narrow:** dairy cattle (high value/animal, dense sensor adoption, unambiguous
  ROI on **mastitis** + **fertility/heat detection**).
- **ICP:** 100–500-cow dairies in cooperatives — and their vets.
- **Expand:** beef feedlots (BRD), then sheep and others.

## Why we win (the moat)
1. **Hardware-agnostic ingestion.** Interoperate across smaXtec / Nedap / Afimilk /
   Allflex. Incumbents lock you to their hardware; we're the open insight layer.
2. **Explainability.** z-score + condition + trend builds trust vs black-box AI —
   crucial with vets.
3. **Proprietary labeled outcomes.** Every vet-confirmed case improves the models →
   data network effect (the real long-term moat).
4. **Vet-in-the-loop + workflow.** Treatment logging, milk/meat withdrawal periods,
   integration with farm software and traceability (SITRAN / EU eID).
5. **Emerging wedge:** methane / welfare / ESG reporting per animal — incumbents are slow here.

## Competition
Connecterra (Ida), Halter, smaXtec, Allflex/SCR (MSD), Nedap, CowManager, Moocall,
Cainthus/Ever.Ag. Most are **hardware-tied** and/or **black-box**. The gap we attack:
an **open, explainable insight layer with proven ROI**.

## Business model
SaaS **per animal / month**, priced as a fraction of value delivered; tiers by herd
size; modules as add-ons (fertility, ESG). Optional hardware via partners. Land with one
high-ROI module, expand.

## Go-to-market
**Channel-led, not farm-by-farm:** cooperatives, veterinarians, feed/genetics companies,
milk buyers, insurers. Land-and-expand from lighthouse farms → published case studies.

## Roadmap (0 → 1)
- **Phase 0 — Demo** ✅ *(today)* — interactive, explainable showcase on synthetic data.
- **Phase 1 — Real data pilot** — 1–2 design-partner farms + 1 hardware partner; ingest
  real telemetry; **validate one detection (mastitis or estrus) against vet diagnosis**;
  measure lead-time and sensitivity/specificity.
- **Phase 2 — Productionize** — ingestion API, multi-tenant + auth/RBAC, time-series
  store, alerting (WhatsApp/SMS/push), mobile + offline.
- **Phase 3 — Distribution** — first co-op/vet channel, pricing, paid pilots, case study.
- **Phase 4 — Moat & scale** — accumulate labeled data, expand conditions/species,
  deepen integrations, ship the ESG module.

## North-star & KPIs
**North-star:** vet-verified early catches per 1,000 animals per month.
**KPIs:** detection lead-time (days before clinical signs) · sensitivity / specificity ·
false-alert rate · % alerts actioned · € value delivered / farm · animals under
management · net revenue retention.

## Risks & mitigations
- **Alert fatigue / false positives** → per-animal baselines, vet validation, tunable thresholds.
- **Hardware & data access** → partnerships + agnostic ingestion.
- **Farm connectivity** → edge buffering / LoRa.
- **Trust & adoption** → vets as channel, explainability, hard ROI proof.
- **Data ownership** → explicit "the farmer owns their data" policy.

## Status today
Live, interactive demo: landing + dashboard, explainable z-score engine, condition
inference, and an ROI model — all on synthetic data, no backend (by design for the demo).

## The ask
- **Design-partner dairy farms** and a **sensor/hardware partner** for the Phase-1 pilot.
- **Warm intros** via cooperatives and veterinarians.
- *(Building in Public)* feedback, and a follow.

---

*Figures are industry-ballpark and illustrative until validated with pilot data.*
