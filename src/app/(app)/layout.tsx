import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wrench,
  Warehouse,
  Banknote,
  Settings,
} from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/dashboard", label: "İdarə paneli", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/fleet", label: "Texnika", icon: Wrench },
  { href: "/garage", label: "Qaraj", icon: FileText },
  { href: "/warehouse", label: "Anbar", icon: Warehouse },
  { href: "/finance", label: "Maliyyə", icon: Banknote },
  { href: "/settings", label: "Tənzimləmələr", icon: Settings },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="grid min-h-screen grid-cols-[16rem_1fr]">
      <aside className="border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-4">
          <Link href="/dashboard" className="text-base font-semibold text-brand-navy">
            SkyServices ERP
          </Link>
        </div>
        <nav className="flex flex-col gap-1 px-2 py-3 text-sm">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="text-sm text-slate-500">
            {session.user.name} · <span className="text-xs uppercase">{session.user.role}</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Çıxış
            </Button>
          </form>
        </header>
        <main className="flex-1 bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
