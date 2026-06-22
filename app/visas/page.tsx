import { VisaSelector } from "@/components/pages/visas/selector";
import { enabledVisaOptions } from "@/lib/db/visa-selection";

export default function VisasPage() {
  return <VisaSelector options={enabledVisaOptions} />;
}
