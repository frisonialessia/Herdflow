"use client";

// Shared animal form, used by both "Add animal" and "Edit animal". Collects the
// full husbandry record: identity (name, code, species, sex, breed), origin &
// age, feeding (diet, schedule, water), and health (vaccination card + medical
// history). Species is fixed once created (edit mode shows it read-only).

import { useState } from "react";
import { Species, Sex, AnimalProfile, VaccineRecord, SPECIES_LABEL, SPECIES_EMOJI } from "@/lib/types";
import { BREEDS, SEX_LABEL, animalAge } from "@/lib/profile";
import { Plus, Trash2 } from "lucide-react";

const SPECIES_LIST: Species[] = ["dairy", "beef", "sheep", "horse", "poultry"];

export interface AnimalFormResult {
  name: string;
  tag_id: string;
  species: Species;
  profile: AnimalProfile;
}
export interface AnimalFormInitial {
  name?: string;
  tag_id?: string;
  species?: Species;
  profile?: Partial<AnimalProfile>;
}

export function AnimalForm({
  mode,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "add" | "edit";
  initial?: AnimalFormInitial;
  submitLabel: string;
  onSubmit: (r: AnimalFormResult) => void;
  onCancel: () => void;
}) {
  const p = initial?.profile;
  const [name, setName] = useState(initial?.name ?? "");
  const [tag, setTag] = useState(initial?.tag_id ?? "");
  const [species, setSpecies] = useState<Species>(initial?.species ?? "dairy");
  const [sex, setSex] = useState<Sex>(p?.sex ?? "female");
  const [breed, setBreed] = useState(p?.breed ?? "");
  const [birthDate, setBirthDate] = useState(p?.birthDate ?? "");
  const [origin, setOrigin] = useState(p?.origin ?? "");
  const [location, setLocation] = useState(p?.location ?? "");
  const [diet, setDiet] = useState(p?.diet ?? "");
  const [feedingTimes, setFeeding] = useState(p?.feedingTimes ?? "");
  const [water, setWater] = useState(p?.waterIntakeL != null ? String(p.waterIntakeL) : "");
  const [vaccines, setVaccines] = useState<VaccineRecord[]>(p?.vaccines ?? []);
  const [medical, setMedical] = useState(p?.medicalHistory ?? "");

  function submit() {
    onSubmit({
      name: name.trim() || "Sin nombre",
      tag_id: tag.trim(),
      species,
      profile: {
        sex,
        breed: breed.trim(),
        birthDate,
        origin: origin.trim(),
        location: location.trim(),
        diet: diet.trim(),
        feedingTimes: feedingTimes.trim(),
        waterIntakeL: parseFloat(water) || 0,
        vaccines: vaccines.filter((v) => v.name.trim()),
        medicalHistory: medical.trim() || "Sin antecedentes",
      },
    });
  }

  const setVax = (i: number, patch: Partial<VaccineRecord>) =>
    setVaccines((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="flex flex-col gap-5">
      <Section title="Identidad">
        <Row>
          <Field label="Nombre">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="p. ej. Rosa" className={inputCls} autoFocus />
          </Field>
          <Field label="Código / arete">
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder={mode === "add" ? "auto si se deja vacío" : "ES100123"} className={inputCls} />
          </Field>
        </Row>

        <Field label="Especie">
          {mode === "add" ? (
            <div className="grid grid-cols-3 gap-2">
              {SPECIES_LIST.map((sp) => {
                const active = species === sp;
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpecies(sp)}
                    className="rounded-xl px-2 py-2 text-[12px] cursor-pointer border flex flex-col items-center gap-1 text-center leading-tight"
                    style={active ? activeStyle : idleStyle}
                  >
                    <span className="text-[17px]">{SPECIES_EMOJI[sp]}</span>
                    {SPECIES_LABEL[sp]}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 border" style={{ background: "var(--card-soft)", borderColor: "var(--border)" }}>
              <span className="text-[17px]">{SPECIES_EMOJI[species]}</span> {SPECIES_LABEL[species]}
              <span className="text-[11px] ml-auto" style={{ color: "var(--faint)" }}>no editable</span>
            </div>
          )}
        </Field>

        <Row>
          <Field label="Sexo">
            <div className="flex gap-2">
              {(["female", "male"] as Sex[]).map((s) => (
                <button key={s} type="button" onClick={() => setSex(s)} className="flex-1 rounded-xl px-3 py-2.5 text-[13px] cursor-pointer border" style={sex === s ? activeStyle : idleStyle}>
                  {SEX_LABEL[s]}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Raza / tipo">
            <input value={breed} onChange={(e) => setBreed(e.target.value)} list="breed-list" placeholder="p. ej. Holstein" className={inputCls} />
            <datalist id="breed-list">{BREEDS[species].map((b) => <option key={b} value={b} />)}</datalist>
          </Field>
        </Row>
      </Section>

      <Section title="Origen y edad">
        <Row>
          <Field label={`Fecha de nacimiento${birthDate ? ` · ${animalAge(birthDate)}` : ""}`}>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Ubicación / rancho">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rancho La Esperanza" className={inputCls} />
          </Field>
        </Row>
        <Field label="Procedencia">
          <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Nacido en el rancho / Comprado a…" className={inputCls} />
        </Field>
      </Section>

      <Section title="Alimentación">
        <Row>
          <Field label="Dieta / ración">
            <input value={diet} onChange={(e) => setDiet(e.target.value)} placeholder="TMR, pastoreo…" className={inputCls} />
          </Field>
          <Field label="Agua aprox. (L/día)">
            <input value={water} onChange={(e) => setWater(e.target.value)} inputMode="decimal" placeholder="90" className={inputCls} />
          </Field>
        </Row>
        <Field label="Horarios de comida">
          <input value={feedingTimes} onChange={(e) => setFeeding(e.target.value)} placeholder="05:30, 13:00, 19:30" className={inputCls} />
        </Field>
      </Section>

      <Section title="Salud">
        <Field label="Cartilla de vacunación">
          <div className="flex flex-col gap-2">
            {vaccines.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={v.name} onChange={(e) => setVax(i, { name: e.target.value })} placeholder="Vacuna" className={`${inputCls} flex-1`} />
                <input type="date" value={v.date} onChange={(e) => setVax(i, { date: e.target.value })} className={`${inputCls} w-[150px]`} />
                <button type="button" onClick={() => setVaccines((vs) => vs.filter((_, j) => j !== i))} title="Quitar" className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 cursor-pointer" style={{ borderColor: "var(--border)", background: "var(--card-soft)" }}>
                  <Trash2 size={15} strokeWidth={2} color="var(--brown)" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setVaccines((vs) => [...vs, { name: "", date: "" }])} className="self-start flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer rounded-xl px-3 py-2 border" style={{ borderColor: "var(--border)", background: "var(--card-soft)", color: "var(--sage-deep)" }}>
              <Plus size={14} strokeWidth={2.2} /> Agregar vacuna
            </button>
          </div>
        </Field>
        <Field label="Historial médico / enfermedades">
          <textarea value={medical} onChange={(e) => setMedical(e.target.value)} placeholder="Mastitis tratada (2024)…" rows={2} className={`${inputCls} resize-none`} />
        </Field>
      </Section>

      <div className="flex gap-2.5 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer border" style={{ borderColor: "var(--border)", background: "var(--card-soft)", color: "var(--ink)" }}>
          Cancelar
        </button>
        <button type="button" onClick={submit} className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-medium cursor-pointer text-white border-0" style={{ background: "var(--sage-deep)" }}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

const inputCls = "w-full border rounded-xl px-3 py-2.5 text-sm outline-none bg-[var(--card-soft)] border-[var(--border)] text-[var(--ink)]";
const activeStyle = { background: "var(--sage-deep)", color: "#fff", borderColor: "var(--sage-deep)" };
const idleStyle = { background: "var(--card-soft)", borderColor: "var(--border)" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide font-semibold mb-2.5" style={{ color: "var(--faint)" }}>{title}</div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium block mb-1" style={{ color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}
