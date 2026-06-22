"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { MonogramLogo } from "@/components/attache/MonogramLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

        <Form {...form}>
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
                  <FormField
                    control={form.control}
                    name="applicantFullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full legal name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="As shown on passport" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantNationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passport country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Uzbekistan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantResidenceCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of residence</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="United States" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantResidenceCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residence city</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="New York" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">2. Trip</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="destinationCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="France" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="destinationCity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination city optional</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Paris" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="travelPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose</FormLabel>
                        <FormControl>
                          <Select {...field} value={field.value ?? ""}>
                            <option value="">Choose purpose</option>
                            {purposeOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantEmploymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment</FormLabel>
                        <FormControl>
                          <Select {...field} value={field.value ?? ""}>
                            <option value="">Choose status</option>
                            {employmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="arrivalDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrival date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departureDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">3. Approval signals</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="applicantEmployer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer optional</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantJobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job title optional</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Product manager" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicantMonthlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly income optional</FormLabel>
                        <FormControl>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            type="number"
                            min="0"
                            inputMode="decimal"
                            value={field.value === undefined ? "" : String(field.value)}
                            onBlur={field.onBlur}
                            onChange={field.onChange}
                            placeholder="Approximate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-3 border border-line bg-paper/60 p-3">
                    <FormField
                      control={form.control}
                      name="familyInHomeCountry"
                      render={({ field }) => (
                        <label className="flex items-center gap-3 text-sm text-ink">
                          <Checkbox checked={Boolean(field.value)} onBlur={field.onBlur} onChange={field.onChange} name={field.name} ref={field.ref} />
                          Family ties in home country
                        </label>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyOwned"
                      render={({ field }) => (
                        <label className="flex items-center gap-3 text-sm text-ink">
                          <Checkbox checked={Boolean(field.value)} onBlur={field.onBlur} onChange={field.onChange} name={field.name} ref={field.ref} />
                          Property or major assets at home
                        </label>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="previousRefusals"
                      render={({ field }) => (
                        <label className="flex items-center gap-3 text-sm text-ink">
                          <Checkbox checked={Boolean(field.value)} onBlur={field.onBlur} onChange={field.onChange} name={field.name} ref={field.ref} />
                          Previous visa refusal
                        </label>
                      )}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs leading-5 text-ink2">
                  You can edit details with Attaché later. Departure must be after arrival.
                </p>
                {submitError ? <p role="alert" className="text-xs leading-5 text-clay">{submitError}</p> : null}
              </div>
              <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting} size="lg" className="bg-brass text-white hover:bg-brass/90">
                {form.formState.isSubmitting ? "Starting..." : "Start my visa plan"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
