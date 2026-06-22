"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { enabledVisaOptions } from "@/lib/db/visa-selection";

type VisaOption = (typeof enabledVisaOptions)[number];

export function VisaSelector({ options }: { readonly options: readonly VisaOption[] }) {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<VisaOption | null>(options[0] ?? null);
  const [submittingVisaType, setSubmittingVisaType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createCase(option: VisaOption) {
    setError(null);
    setSubmittingVisaType(option.visaType);
    try {
      const response = await fetch("/api/visa-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinationCountry: option.countryName, visaType: option.visaType }),
      });

      const body = (await response.json()) as { visaCaseId?: unknown; error?: unknown };
      if (!response.ok || typeof body.visaCaseId !== "string") {
        throw new Error(typeof body.error === "string" ? body.error : "Could not create visa case.");
      }
      router.push(`/case/${body.visaCaseId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create visa case.");
    } finally {
      setSubmittingVisaType(null);
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--bone)] text-ink">
      <div className="mx-auto grid min-h-dvh max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-12">
        <section className="flex flex-col justify-between rounded-2xl border border-line bg-panel p-6">
          <div>
            <Badge variant="secondary" className="mb-5 font-mono uppercase tracking-[0.18em]">
              Visa route
            </Badge>
            <h1 className="max-w-[11ch] text-4xl font-semibold leading-[0.98] tracking-[-0.03em] md:text-6xl">
              Choose the case Attaché should run.
            </h1>
            <p className="mt-5 max-w-[54ch] text-sm leading-6 text-ink2">
              Your passport is ready as a reusable core document. Now choose the Schengen route and Attaché will open a dedicated case file.
            </p>
          </div>
          <div className="mt-8 grid gap-3 text-xs text-ink2">
            <div className="rounded-xl border border-line bg-panel-dk p-4">
              <div className="font-mono uppercase tracking-[0.18em] text-ink">Step 1</div>
              <p className="mt-2">Pick an EU Schengen destination.</p>
            </div>
            <div className="rounded-xl border border-line bg-panel-dk p-4">
              <div className="font-mono uppercase tracking-[0.18em] text-ink">Step 2</div>
              <p className="mt-2">Choose the visa type. V1 supports one short-stay visitor route.</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-ink2">Destination</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {options.map((option) => (
                <Card
                  key={option.countryCode}
                  className={option.countryCode === selectedCountry?.countryCode ? "border-ink bg-panel" : "border-line bg-panel-dk"}
                >
                  <CardHeader>
                    <div className="text-4xl" aria-hidden="true">{option.flag}</div>
                    <CardTitle>{option.countryName}</CardTitle>
                    <CardDescription>EU Schengen destination</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button type="button" variant="outline" className="w-full" onClick={() => setSelectedCountry(option)}>
                      Select {option.countryName}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-ink2">Visa type</h2>
            <div className="mt-3 grid gap-3">
              {selectedCountry ? (
                <Card className="border-line bg-panel">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Schengen</Badge>
                      <Badge variant="outline">Short stay</Badge>
                    </div>
                    <CardTitle>{selectedCountry.title}</CardTitle>
                    <CardDescription>{selectedCountry.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={submittingVisaType === selectedCountry.visaType}
                      onClick={() => void createCase(selectedCountry)}
                    >
                      {submittingVisaType === selectedCountry.visaType ? "Creating case..." : "Create visa case"}
                    </Button>
                    {error ? <p className="mt-3 text-sm text-destructive" role="alert">{error}</p> : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
