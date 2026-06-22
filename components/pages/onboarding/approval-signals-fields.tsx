"use client";

import { Controller, type Control } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OnboardingInput } from "@/lib/db/onboarding";

export function ApprovalSignalsFields({ control }: { readonly control: Control<OnboardingInput> }) {
  return (
    <FieldSet>
      <FieldLegend>3. Approval signals</FieldLegend>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="applicantEmployer"
          control={control}
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
          control={control}
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
          control={control}
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
            control={control}
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
            control={control}
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
            control={control}
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
  );
}
