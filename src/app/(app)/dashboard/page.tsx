import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">İdarə paneli</h1>
        <p className="text-sm text-slate-500">
          Xoş gəldiniz, {session?.user?.name}. Bu MVP-nin ilkin nəşridir — modullar mərhələ-mərhələ
          əlavə olunacaq.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: "Müştərilər", value: "—", note: "Phase 1" },
          { title: "Aktiv icarələr", value: "—", note: "Phase 2" },
          { title: "Aylıq dövriyyə", value: "—", note: "Phase 3" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-slate-500">{card.title}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</div>
            <div className="mt-1 text-xs text-slate-400">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-slate-700">Yol xəritəsi</div>
        <ul className="mt-2 space-y-1 text-sm text-slate-500">
          <li>Phase 0 — Əsaslar (auth, user/role, audit) ✓</li>
          <li>Phase 1 — CRM (Client, MSA, Addendum, Lead, Request, Offer)</li>
          <li>Phase 2 — Texnika + Qaraj əməliyyatları</li>
          <li>Phase 3 — Maliyyə (Hesab-faktura, ödənişlər, e-Qaimə)</li>
          <li>Phase 4 — Anbar / İnventar</li>
          <li>Phase 5 — CMS inteqrasiyası</li>
          <li>Phase 6 — Hesabatlar və paneller</li>
        </ul>
      </div>
    </div>
  );
}
