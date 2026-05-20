import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Info, AlertTriangle, MinusCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type NextActionVariant = "info" | "success" | "warning" | "muted";

const STYLE: Record<NextActionVariant, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  muted: "border-slate-200 bg-slate-50 text-slate-700",
};

const ICON: Record<NextActionVariant, ReactNode> = {
  info: <Info className="h-4 w-4 text-sky-600" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  muted: <MinusCircle className="h-4 w-4 text-slate-500" />,
};

const CTA_STYLE: Record<NextActionVariant, string> = {
  info: "bg-sky-600 text-white hover:bg-sky-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  warning: "bg-amber-600 text-white hover:bg-amber-700",
  muted: "bg-slate-600 text-white hover:bg-slate-700",
};

/**
 * Small attention banner shown below the page header, telling the operator what
 * the next step in the flow should be. Optional CTA renders on the right.
 */
export function NextActionBanner({
  variant = "info",
  title,
  description,
  cta,
  className,
}: {
  variant?: NextActionVariant;
  title: string;
  description?: ReactNode;
  cta?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start justify-between gap-3 rounded-md border p-3 text-sm",
        STYLE[variant],
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{ICON[variant]}</span>
        <div>
          <div className="font-medium">{title}</div>
          {description && <div className="mt-0.5 text-xs opacity-90">{description}</div>}
        </div>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium",
            CTA_STYLE[variant],
          )}
        >
          {cta.label}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
