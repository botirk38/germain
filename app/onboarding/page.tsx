"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MonogramLogo } from "@/components/attache/MonogramLogo";

const PROFILE_STORAGE_KEY = "attache:onboarding-profile";
const EVE_SESSION_STORAGE_KEY = "attache:eve-session";

const purposeOptions = [
  { label: "Tourism", value: "tourism" },
  { label: "Business", value: "business" },
  { label: "Study", value: "study" },
  { label: "Work", value: "work" },
  { label: "Family visit", value: "family_visit" },
  { label: "Transit", value: "transit" },
] as const;

const employmentOptions = [
  { label: "Employed", value: "employed" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Student", value: "student" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
] as const;

type FormState = {
  readonly fullName: string;
  readonly nationality: string;
  readonly residenceCountry: string;
  readonly residenceCity: string;
  readonly employmentStatus: string;
  readonly employer: string;
  readonly jobTitle: string;
  readonly monthlyIncome: string;
  readonly destinationCountry: string;
  readonly destinationCity: string;
  readonly purpose: string;
  readonly arrivalDate: string;
  readonly departureDate: string;
  readonly familyInHomeCountry: boolean;
  readonly propertyOwned: boolean;
  readonly previousRefusals: boolean;
};

const initialForm: FormState = {
  fullName: "",
  nationality: "",
  residenceCountry: "",
  residenceCity: "",
  employmentStatus: "",
  employer: "",
  jobTitle: "",
  monthlyIncome: "",
  destinationCountry: "",
  destinationCity: "",
  purpose: "",
  arrivalDate: "",
  departureDate: "",
  familyInHomeCountry: false,
  propertyOwned: false,
  previousRefusals: false,
};

function toProfile(form: FormState): Record<string, string | number | boolean> {
  const monthlyIncome = Number(form.monthlyIncome);
  return {
    fullName: form.fullName.trim(),
    nationality: form.nationality.trim(),
    residenceCountry: form.residenceCountry.trim(),
    residenceCity: form.residenceCity.trim(),
    employmentStatus: form.employmentStatus,
    ...(form.employer.trim() ? { employer: form.employer.trim() } : {}),
    ...(form.jobTitle.trim() ? { jobTitle: form.jobTitle.trim() } : {}),
    ...(Number.isFinite(monthlyIncome) && monthlyIncome > 0 ? { monthlyIncome } : {}),
    destinationCountry: form.destinationCountry.trim(),
    ...(form.destinationCity.trim() ? { destinationCity: form.destinationCity.trim() } : {}),
    purpose: form.purpose,
    arrivalDate: form.arrivalDate,
    departureDate: form.departureDate,
    familyInHomeCountry: form.familyInHomeCountry,
    propertyOwned: form.propertyOwned,
    previousRefusals: form.previousRefusals,
  };
}

function requiredComplete(form: FormState): boolean {
  return [
    form.fullName,
    form.nationality,
    form.residenceCountry,
    form.residenceCity,
    form.employmentStatus,
    form.destinationCountry,
    form.purpose,
    form.arrivalDate,
    form.departureDate,
  ].every((value) => value.trim().length > 0);
}

function Field({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">{label}</Label>
      {children}
    </div>
  );
}

function MiniCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="border border-line bg-panel px-3 py-3 shadow-sm">
      <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink2">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const canSubmit = useMemo(() => requiredComplete(form), [form]);

  const updateText = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateBoolean = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.checked }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    window.localStorage.removeItem(EVE_SESSION_STORAGE_KEY);
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(toProfile(form)));
    router.push("/chat");
  };

  return (
    <main className="min-h-screen bg-paper px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-line bg-panel-dk p-5 shadow-sm lg:sticky lg:top-5 lg:h-fit">
          <div className="flex items-center gap-3">
            <MonogramLogo size={34} title="Attaché" />
            <div>
              <div className="wordmark">
                <span className="rim" />
                ATTACHÉ
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink2">
                visa intake
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Takes about 90 seconds</p>
            <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-[-0.04em] text-ink">
              Start with only the details Attaché needs.
            </h1>
            <p className="max-w-sm text-sm leading-6 text-ink2">
              A short intake is faster than a chat interview. You can add documents and edge cases after the visa plan starts.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2">
            <MiniCard label="Step 1" value="Profile" />
            <MiniCard label="Step 2" value="Trip" />
            <MiniCard label="Step 3" value="Risk" />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="border border-line bg-panel p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Quick onboarding</div>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink">Tell us the basics</h2>
            </div>
            <div className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-sage sm:block">
              no account setup detour
            </div>
          </div>

          <div className="space-y-7">
            <section className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">1. You</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full legal name">
                  <Input value={form.fullName} onChange={updateText("fullName")} placeholder="As shown on passport" required />
                </Field>
                <Field label="Passport country">
                  <Input value={form.nationality} onChange={updateText("nationality")} placeholder="Uzbekistan" required />
                </Field>
                <Field label="Country of residence">
                  <Input value={form.residenceCountry} onChange={updateText("residenceCountry")} placeholder="United States" required />
                </Field>
                <Field label="Residence city">
                  <Input value={form.residenceCity} onChange={updateText("residenceCity")} placeholder="New York" required />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">2. Trip</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Destination country">
                  <Input value={form.destinationCountry} onChange={updateText("destinationCountry")} placeholder="France" required />
                </Field>
                <Field label="Destination city optional">
                  <Input value={form.destinationCity} onChange={updateText("destinationCity")} placeholder="Paris" />
                </Field>
                <Field label="Purpose">
                  <Select value={form.purpose} onChange={updateText("purpose")} required>
                    <option value="">Choose purpose</option>
                    {purposeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Employment">
                  <Select value={form.employmentStatus} onChange={updateText("employmentStatus")} required>
                    <option value="">Choose status</option>
                    {employmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Arrival date">
                  <Input type="date" value={form.arrivalDate} onChange={updateText("arrivalDate")} required />
                </Field>
                <Field label="Departure date">
                  <Input type="date" value={form.departureDate} onChange={updateText("departureDate")} required />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">3. Approval signals</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employer optional">
                  <Input value={form.employer} onChange={updateText("employer")} placeholder="Company name" />
                </Field>
                <Field label="Job title optional">
                  <Input value={form.jobTitle} onChange={updateText("jobTitle")} placeholder="Product manager" />
                </Field>
                <Field label="Monthly income optional">
                  <Input type="number" min="0" inputMode="decimal" value={form.monthlyIncome} onChange={updateText("monthlyIncome")} placeholder="Approximate" />
                </Field>
                <div className="grid gap-3 border border-line bg-paper/60 p-3">
                  <label className="flex items-center gap-3 text-sm text-ink">
                    <Checkbox checked={form.familyInHomeCountry} onChange={updateBoolean("familyInHomeCountry")} />
                    Family ties in home country
                  </label>
                  <label className="flex items-center gap-3 text-sm text-ink">
                    <Checkbox checked={form.propertyOwned} onChange={updateBoolean("propertyOwned")} />
                    Property or major assets at home
                  </label>
                  <label className="flex items-center gap-3 text-sm text-ink">
                    <Checkbox checked={form.previousRefusals} onChange={updateBoolean("previousRefusals")} />
                    Previous visa refusal
                  </label>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-ink2">
              You can edit details with Attaché later. Required fields keep the first plan accurate.
            </p>
            <Button type="submit" disabled={!canSubmit} size="lg" className="bg-brass text-white hover:bg-brass/90">
              Start my visa plan
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
