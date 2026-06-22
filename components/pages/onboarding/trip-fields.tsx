"use client";

import { Controller, type Control } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { OnboardingInput } from "@/lib/db/onboarding";
import { employmentOptions, purposeOptions } from "@/components/pages/onboarding/options";

export function TripFields({ control }: { readonly control: Control<OnboardingInput> }) {
  return (
    <FieldSet>
      <FieldLegend>2. Trip</FieldLegend>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="destinationCountry"
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
          control={control}
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
  );
}
