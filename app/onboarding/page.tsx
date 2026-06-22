"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { onboardingDefaults, onboardingSchema, type OnboardingData, type OnboardingInput } from "@/lib/db/onboarding";

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
  const form = useForm<OnboardingInput, unknown, OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: onboardingDefaults,
    mode: "onChange",
  });

  const submitError = form.formState.errors.root?.message;

  const handleSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body: unknown = await response.json();
    if (!response.ok || typeof body !== "object" || body === null || !("visaCaseId" in body) || typeof body.visaCaseId !== "string") {
      form.setError("root", {
        message: "Could not create your visa case. Please check the form and try again.",
      });
      return;
    }

    router.push(`/case/${body.visaCaseId}`);
  });

  return (
    <main className="min-h-dvh bg-paper px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-line bg-panel-dk p-5 shadow-sm lg:sticky lg:top-5 lg:h-fit">
          <div className="flex items-center gap-3">
            <MonogramLogo size={34} title="Attaché" />
            <div>
              <div className="wordmark">
                <span className="rim" />
                ATTACHÉ
              </div>
              <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-ink2">visa intake</div>
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

        <form onSubmit={handleSubmit} className="border border-line bg-panel p-4 shadow-sm sm:p-6" noValidate>
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
            <FieldSet>
              <FieldLegend>1. You</FieldLegend>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="applicantFullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantFullName">Full legal name</FieldLabel>
                      <Input {...field} id="applicantFullName" aria-invalid={fieldState.invalid} placeholder="As shown on passport" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantNationality"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantNationality">Passport country</FieldLabel>
                      <Input {...field} id="applicantNationality" aria-invalid={fieldState.invalid} placeholder="Uzbekistan" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantResidenceCountry"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantResidenceCountry">Country of residence</FieldLabel>
                      <Input {...field} id="applicantResidenceCountry" aria-invalid={fieldState.invalid} placeholder="United States" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantResidenceCity"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantResidenceCity">Residence city</FieldLabel>
                      <Input {...field} id="applicantResidenceCity" aria-invalid={fieldState.invalid} placeholder="New York" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>2. Trip</FieldLegend>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="destinationCountry"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="destinationCountry">Destination country</FieldLabel>
                      <Input {...field} id="destinationCountry" aria-invalid={fieldState.invalid} placeholder="France" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="destinationCity"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="destinationCity">Destination city optional</FieldLabel>
                      <Input {...field} id="destinationCity" value={field.value ?? ""} aria-invalid={fieldState.invalid} placeholder="Paris" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="travelPurpose"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="travelPurpose">Purpose</FieldLabel>
                      <Select {...field} id="travelPurpose" value={field.value ?? ""} aria-invalid={fieldState.invalid}>
                        <option value="">Choose purpose</option>
                        {purposeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantEmploymentStatus"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantEmploymentStatus">Employment</FieldLabel>
                      <Select {...field} id="applicantEmploymentStatus" value={field.value ?? ""} aria-invalid={fieldState.invalid}>
                        <option value="">Choose status</option>
                        {employmentOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="arrivalDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="arrivalDate">Arrival date</FieldLabel>
                      <Input {...field} id="arrivalDate" type="date" aria-invalid={fieldState.invalid} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="departureDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="departureDate">Departure date</FieldLabel>
                      <Input {...field} id="departureDate" type="date" aria-invalid={fieldState.invalid} />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>3. Approval signals</FieldLegend>
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="applicantEmployer"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantEmployer">Employer optional</FieldLabel>
                      <Input {...field} id="applicantEmployer" value={field.value ?? ""} aria-invalid={fieldState.invalid} placeholder="Company name" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantJobTitle"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantJobTitle">Job title optional</FieldLabel>
                      <Input {...field} id="applicantJobTitle" value={field.value ?? ""} aria-invalid={fieldState.invalid} placeholder="Product manager" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="applicantMonthlyIncome"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="applicantMonthlyIncome">Monthly income optional</FieldLabel>
                      <Input
                        name={field.name}
                        ref={field.ref}
                        id="applicantMonthlyIncome"
                        type="number"
                        min="0"
                        inputMode="decimal"
                        value={field.value === undefined || field.value === "" ? "" : String(field.value)}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                        placeholder="Approximate"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <FieldGroup data-slot="checkbox-group" className="border border-line bg-paper/60 p-3">
                  <Controller
                    name="familyInHomeCountry"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                        <Checkbox
                          id="familyInHomeCountry"
                          name={field.name}
                          checked={Boolean(field.value)}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.checked)}
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel htmlFor="familyInHomeCountry" className="font-normal normal-case tracking-normal text-ink">
                          Family ties in home country
                        </FieldLabel>
                      </Field>
                    )}
                  />
                  <Controller
                    name="propertyOwned"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                        <Checkbox
                          id="propertyOwned"
                          name={field.name}
                          checked={Boolean(field.value)}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.checked)}
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel htmlFor="propertyOwned" className="font-normal normal-case tracking-normal text-ink">
                          Property or major assets at home
                        </FieldLabel>
                      </Field>
                    )}
                  />
                  <Controller
                    name="previousRefusals"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                        <Checkbox
                          id="previousRefusals"
                          name={field.name}
                          checked={Boolean(field.value)}
                          onBlur={field.onBlur}
                          onChange={(event) => field.onChange(event.target.checked)}
                          ref={field.ref}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel htmlFor="previousRefusals" className="font-normal normal-case tracking-normal text-ink">
                          Previous visa refusal
                        </FieldLabel>
                      </Field>
                    )}
                  />
                </FieldGroup>
              </FieldGroup>
            </FieldSet>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs leading-5 text-ink2">You can edit details with Attaché later. Departure must be after arrival.</p>
              {submitError ? <p role="alert" className="text-xs leading-5 text-clay">{submitError}</p> : null}
            </div>
            <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} size="lg" className="bg-brass text-white hover:bg-brass/90">
              {form.formState.isSubmitting ? "Starting..." : "Start my visa plan"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
