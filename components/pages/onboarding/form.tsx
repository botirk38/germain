"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ApprovalSignalsFields } from "@/components/pages/onboarding/approval-signals-fields";
import { ApplicantFields } from "@/components/pages/onboarding/applicant-fields";
import { TripFields } from "@/components/pages/onboarding/trip-fields";
import { Button } from "@/components/ui/button";
import { onboardingDefaults, onboardingSchema, type OnboardingData, type OnboardingInput } from "@/lib/db/onboarding";

export function Form() {
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
        <ApplicantFields control={form.control} />
        <TripFields control={form.control} />
        <ApprovalSignalsFields control={form.control} />
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
  );
}
