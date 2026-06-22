"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { onboardingDefaults, onboardingSchema, type OnboardingData, type OnboardingInput } from "@/lib/db/onboarding";

export function Form() {
  const router = useRouter();
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const form = useForm<OnboardingInput, unknown, OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: onboardingDefaults,
    mode: "onChange",
  });
  const submitError = form.formState.errors.root?.message;

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!passportFile) {
      form.setError("passportOriginalFilename", { message: "Choose your passport file." });
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.set("file", passportFile);
    uploadFormData.set("documentType", "passport");
    const uploadResponse = await fetch("/api/uploads", {
      method: "POST",
      body: uploadFormData,
    });
    const uploadBody = (await uploadResponse.json()) as { url?: unknown; originalFilename?: unknown; error?: unknown };
    if (!uploadResponse.ok || typeof uploadBody.url !== "string") {
      form.setError("root", {
        message: typeof uploadBody.error === "string" ? uploadBody.error : "Could not upload your passport. Please try again.",
      });
      return;
    }

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        passportOriginalFilename:
          typeof uploadBody.originalFilename === "string" ? uploadBody.originalFilename : values.passportOriginalFilename,
        passportStorageKey: uploadBody.url,
      }),
    });

    const body: unknown = await response.json();
    if (!response.ok || typeof body !== "object" || body === null || !("nextUrl" in body) || typeof body.nextUrl !== "string") {
      form.setError("root", {
        message: "Could not save your passport record. Please check the filename and try again.",
      });
      return;
    }

    router.push(body.nextUrl);
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card className="border-line bg-panel shadow-sm">
        <CardHeader className="border-b border-line">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Passport setup</div>
          <CardTitle className="text-xl tracking-[-0.03em] text-ink">Record your passport</CardTitle>
          <CardDescription className="text-ink2">
            Upload your passport once. Attaché stores it privately and reuses it when you create a visa case.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">Application agnostic</div>
          <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-ink">One reusable document</h2>
        </div>
        <div className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-sage sm:block">
          no visa case yet
        </div>
      </div>

      <FieldGroup>
        <Controller
          name="passportOriginalFilename"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="passportOriginalFilename">Passport file name</FieldLabel>
              <Input
                {...field}
                id="passportOriginalFilename"
                aria-invalid={fieldState.invalid}
                type="file"
                accept="image/*,application/pdf"
                autoComplete="off"
                value={undefined}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  setPassportFile(file);
                  field.onChange(file?.name ?? "");
                }}
              />
              <FieldDescription>
                Upload a PDF or image. Attaché stores it privately in Vercel Blob and reuses it across cases.
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs leading-5 text-ink2">Next you will choose the country and visa type.</p>
          {submitError ? <p role="alert" className="text-xs leading-5 text-clay">{submitError}</p> : null}
        </div>
        <Button type="submit" disabled={!passportFile || form.formState.isSubmitting} size="lg" className="bg-brass text-white hover:bg-brass/90">
          {form.formState.isSubmitting ? "Uploading..." : "Continue to visas"}
        </Button>
      </div>
        </CardContent>
      </Card>
    </form>
  );
}
