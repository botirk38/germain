"use client";

import { Controller, type Control } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OnboardingInput } from "@/lib/db/onboarding";

export function ApplicantFields({ control }: { readonly control: Control<OnboardingInput> }) {
  return (
    <FieldSet>
      <FieldLegend>1. You</FieldLegend>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="applicantFullName"
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
  );
}
