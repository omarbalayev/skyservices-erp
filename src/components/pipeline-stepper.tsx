import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type PipelineStep = "LEAD" | "OFFER" | "CONTRACT" | "ACTIVE";

const ORDER: PipelineStep[] = ["LEAD", "OFFER", "CONTRACT", "ACTIVE"];

const LABEL: Record<PipelineStep, string> = {
  LEAD: "Müraciət",
  OFFER: "Təklif",
  CONTRACT: "Müqavilə",
  ACTIVE: "Aktiv icarə",
};

type State = "done" | "current" | "upcoming";

function stateOf(step: PipelineStep, current: PipelineStep): State {
  const i = ORDER.indexOf(step);
  const c = ORDER.indexOf(current);
  if (i < c) return "done";
  if (i === c) return "current";
  return "upcoming";
}

const STYLE: Record<State, string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-800",
  current: "border-brand-navy bg-brand-navy text-white shadow-sm",
  upcoming: "border-slate-200 bg-slate-50 text-slate-400",
};

/**
 * Pure-presentation horizontal pipeline stepper. Renders the 4 CRM stages and
 * highlights the current one. Each step is a <Link> when the caller supplies a
 * matching href in `links`; otherwise it's a plain span.
 */
export function PipelineStepper({
  currentStep,
  links,
  className,
}: {
  currentStep: PipelineStep;
  links?: Partial<Record<PipelineStep, string>>;
  className?: string;
}) {
  return (
    <nav
      className={cn("mb-4 flex w-full items-center gap-2 overflow-x-auto", className)}
      aria-label="CRM flow"
    >
      {ORDER.map((step, idx) => {
        const state = stateOf(step, currentStep);
        const href = links?.[step];
        const inner = (
          <span
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium",
              STYLE[state],
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                state === "done" && "border-emerald-300 bg-white text-emerald-700",
                state === "current" && "border-white/40 bg-white/10 text-white",
                state === "upcoming" && "border-slate-300 bg-white text-slate-400",
              )}
            >
              {state === "done" ? <Check className="h-3 w-3" /> : idx + 1}
            </span>
            {LABEL[step]}
          </span>
        );
        return (
          <div key={step} className="flex items-center gap-2">
            {href ? (
              <Link href={href} className="transition-opacity hover:opacity-90">
                {inner}
              </Link>
            ) : (
              inner
            )}
            {idx < ORDER.length - 1 && (
              <span className="h-px w-4 bg-slate-200" aria-hidden />
            )}
          </div>
        );
      })}
    </nav>
  );
}
