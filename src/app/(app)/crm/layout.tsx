import Link from "next/link";
import type { ReactNode } from "react";

const TABS = [
  { href: "/crm/clients", label: "Müştərilər" },
  { href: "/crm/leads", label: "Müraciətlər" },
  { href: "/crm/offers", label: "Təkliflər" },
  { href: "/crm/agreements", label: "Müqavilələr" },
];

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
