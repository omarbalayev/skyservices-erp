import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { fmtAzn, fmtDate } from "@/lib/format";
import {
  ADDENDUM_KIND_LABELS,
  ADDENDUM_STATUS_LABELS,
  MSA_STATUS_LABELS,
  OFFER_STATUS_LABELS,
  RENTAL_PERIOD_TYPE_LABELS,
  TRANSPORT_RESPONSIBILITY_LABELS,
  VAT_TREATMENT_LABELS,
} from "@/lib/enum-labels";

export const dynamic = "force-dynamic";

type ResolvedDoc =
  | { kind: "offer"; data: Awaited<ReturnType<typeof loadOffer>> }
  | { kind: "msa"; data: Awaited<ReturnType<typeof loadMsa>> }
  | { kind: "addendum"; data: Awaited<ReturnType<typeof loadAddendum>> };

function loadOffer(token: string) {
  return prisma.offer.findUnique({
    where: { verifyToken: token },
    include: {
      request: {
        include: {
          lead: {
            select: {
              client: { select: { id: true, name: true, voen: true } },
              companyName: true,
              contactName: true,
              contactPhone: true,
              contactEmail: true,
            },
          },
        },
      },
    },
  });
}

function loadMsa(token: string) {
  return prisma.masterAgreement.findUnique({
    where: { verifyToken: token },
    include: { client: { select: { name: true, voen: true, billingAddress: true } } },
  });
}

function loadAddendum(token: string) {
  return prisma.addendum.findUnique({
    where: { verifyToken: token },
    include: {
      masterAgreement: {
        include: { client: { select: { name: true, voen: true, billingAddress: true } } },
      },
      equipmentLines: {
        include: { equipment: { select: { code: true, name: true, manufacturer: true, model: true, serial: true } } },
      },
    },
  });
}

async function resolve(token: string): Promise<ResolvedDoc | null> {
  const [offer, msa, addendum] = await Promise.all([
    loadOffer(token),
    loadMsa(token),
    loadAddendum(token),
  ]);
  if (offer) return { kind: "offer", data: offer };
  if (msa) return { kind: "msa", data: msa };
  if (addendum) return { kind: "addendum", data: addendum };
  return null;
}

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { print?: string };
}) {
  const doc = await resolve(params.token);
  if (!doc) notFound();

  const printMode = searchParams.print === "1";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {printMode && (
        <PrintHelper />
      )}
      <div className="mx-auto max-w-3xl px-6 py-8 print:py-2">
        <header className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400">SkyServices Group MMC</div>
            <div className="text-lg font-semibold text-brand-navy">İcraçı: SKY Services Group MMC</div>
            <div className="text-xs text-slate-500">VÖEN: 2006565131</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-slate-400">Sənəd növü</div>
            <div className="text-sm font-semibold">
              {doc.kind === "offer" && "Təklif (TƏKLİF)"}
              {doc.kind === "msa" && "Müqavilə (MSA)"}
              {doc.kind === "addendum" && "Əlavə"}
            </div>
          </div>
        </header>

        {doc.kind === "offer" && doc.data && <OfferView data={doc.data} />}
        {doc.kind === "msa" && doc.data && <MsaView data={doc.data} />}
        {doc.kind === "addendum" && doc.data && <AddendumView data={doc.data} />}

        <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <div>
              Sənəd yoxlanılma tokeni: <span className="font-mono">{params.token.slice(0, 12)}…</span>
            </div>
            <div>SkyServices ERP · erp.skyservices.az</div>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            Bu URL həqiqi sənədin avtomatik yaradılmış surətidir. Çap üçün brauzerdə Ctrl+P → "Save as PDF" istifadə edin.
          </p>
        </footer>
      </div>
    </main>
  );
}

function PrintHelper() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `setTimeout(() => window.print(), 400);`,
      }}
    />
  );
}

function OfferView({ data }: { data: NonNullable<Awaited<ReturnType<typeof loadOffer>>> }) {
  const customer =
    data.request.lead.client?.name ??
    data.request.lead.companyName ??
    data.request.lead.contactName ??
    "—";
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Təklif v{data.version}</h1>
      <div className="text-sm">
        <div>Status: <strong>{OFFER_STATUS_LABELS[data.status]}</strong></div>
        <div>Müştəri: <strong>{customer}</strong></div>
        {data.request.lead.client?.voen && <div>VÖEN: {data.request.lead.client.voen}</div>}
        {data.validUntil && <div>Etibarlı: <strong>{fmtDate(data.validUntil)}</strong></div>}
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="text-xs uppercase text-slate-500">Texnika</div>
        <div className="mt-1 text-base">{data.request.equipmentType}</div>
        {data.request.usageZone && (
          <div className="text-xs text-slate-500">İstifadə ərazisi: {data.request.usageZone}</div>
        )}
        {(data.request.rentalStart || data.request.rentalEnd) && (
          <div className="text-xs text-slate-500">
            Dövr: {fmtDate(data.request.rentalStart)} → {fmtDate(data.request.rentalEnd)}
          </div>
        )}
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="text-xs uppercase text-slate-500">Maliyyə şərtləri</div>
        <table className="mt-2 w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-1 text-slate-500">İcarə dövrü</td>
              <td className="py-1 text-right">{RENTAL_PERIOD_TYPE_LABELS[data.rentalPeriodType]}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">Tarif</td>
              <td className="py-1 text-right font-semibold">{fmtAzn(data.baseFee)}</td>
            </tr>
            {data.rentalPeriodType === "MONTHLY" && (
              <>
                {data.baseDaysPerMonth && (
                  <tr>
                    <td className="py-1 text-slate-500">Ayda iş günü</td>
                    <td className="py-1 text-right">{data.baseDaysPerMonth}</td>
                  </tr>
                )}
                {data.baseHoursPerDay && (
                  <tr>
                    <td className="py-1 text-slate-500">Gündə iş saatı</td>
                    <td className="py-1 text-right">{data.baseHoursPerDay}</td>
                  </tr>
                )}
              </>
            )}
            <tr>
              <td className="py-1 text-slate-500">Daşıma məsuliyyəti</td>
              <td className="py-1 text-right">{TRANSPORT_RESPONSIBILITY_LABELS[data.transportResponsibility]}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">ƏDV</td>
              <td className="py-1 text-right">{VAT_TREATMENT_LABELS[data.vatTreatment]}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">Operator</td>
              <td className="py-1 text-right">{data.operatorIncluded ? "Daxildir" : "Daxil deyil"}</td>
            </tr>
            <tr>
              <td className="py-1 text-slate-500">Gecə növbəsi</td>
              <td className="py-1 text-right font-medium">
                {data.nightShift ? "BƏLİ — gecə vaxtı istifadə üçün" : "Xeyr"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {data.notes && (
        <div>
          <div className="text-xs uppercase text-slate-500">Qeydlər</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{data.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-6">
        <SignBlock label="İcraçı" name="SKY Services Group MMC" />
        <SignBlock label="Sifarişçi" name={customer} />
      </div>
    </section>
  );
}

function MsaView({ data }: { data: NonNullable<Awaited<ReturnType<typeof loadMsa>>> }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Müqavilə №{data.agreementNumber}</h1>
      <div className="text-sm">
        <div>Status: <strong>{MSA_STATUS_LABELS[data.status]}</strong></div>
        <div>Müştəri: <strong>{data.client.name}</strong></div>
        {data.client.voen && <div>VÖEN: {data.client.voen}</div>}
        {data.client.billingAddress && <div>Ünvan: {data.client.billingAddress}</div>}
      </div>

      <div className="rounded border border-slate-200 p-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div>İmzalanma:</div>
          <div className="text-right">{fmtDate(data.signedAt)}</div>
          <div>Etibarlı başlanğıc:</div>
          <div className="text-right">{fmtDate(data.effectiveFrom)}</div>
          <div>Etibarlı son:</div>
          <div className="text-right">{fmtDate(data.effectiveTo)}</div>
          <div>Avto. yenilənmə:</div>
          <div className="text-right">{data.autoRenew ? "Bəli (illik)" : "Xeyr"}</div>
        </div>
      </div>

      {data.notes && (
        <div>
          <div className="text-xs uppercase text-slate-500">Qeydlər</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{data.notes}</p>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Bu MSA xidmət müqaviləsinin əsasıdır. Konkret icarə, qiymət və dövr şərtləri Əlavələrlə (Addendum) müəyyən
        edilir.
      </p>

      <div className="grid grid-cols-2 gap-6 pt-6">
        <SignBlock label="İcraçı" name="SKY Services Group MMC" />
        <SignBlock label="Sifarişçi" name={data.client.name} />
      </div>
    </section>
  );
}

function AddendumView({ data }: { data: NonNullable<Awaited<ReturnType<typeof loadAddendum>>> }) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">
        Əlavə №{data.addendumNumber} — {ADDENDUM_KIND_LABELS[data.kind]}
      </h1>
      <div className="text-sm">
        <div>
          Aid olduğu MSA: <strong>№{data.masterAgreement.agreementNumber}</strong>
        </div>
        <div>Müştəri: <strong>{data.masterAgreement.client.name}</strong></div>
        {data.masterAgreement.client.voen && <div>VÖEN: {data.masterAgreement.client.voen}</div>}
        <div>Status: <strong>{ADDENDUM_STATUS_LABELS[data.status]}</strong></div>
        {(data.effectiveFrom || data.effectiveTo) && (
          <div>
            Etibarlılıq: {fmtDate(data.effectiveFrom)} → {fmtDate(data.effectiveTo)}
          </div>
        )}
      </div>

      {data.equipmentLines.length > 0 && (
        <div className="rounded border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-2">Kod</th>
                <th className="px-2 py-2">Texnika</th>
                <th className="px-2 py-2">Dövr</th>
                <th className="px-2 py-2 text-right">Tarif</th>
                <th className="px-2 py-2">Operator</th>
                <th className="px-2 py-2">Gecə</th>
                <th className="px-2 py-2">ƏDV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.equipmentLines.map((l) => (
                <tr key={l.id}>
                  <td className="px-2 py-2 font-mono">{l.equipment.code}</td>
                  <td className="px-2 py-2">
                    {l.equipment.name}
                    {l.equipment.manufacturer || l.equipment.model ? (
                      <div className="text-xs text-slate-500">
                        {[l.equipment.manufacturer, l.equipment.model].filter(Boolean).join(" / ")}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 text-xs">
                    {RENTAL_PERIOD_TYPE_LABELS[l.rentalPeriodType]}
                    {l.rentalPeriodType === "MONTHLY" && l.baseDaysPerMonth && l.baseHoursPerDay && (
                      <div className="text-slate-500">
                        {l.baseDaysPerMonth}g × {l.baseHoursPerDay}saat
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold">{fmtAzn(l.baseFee)}</td>
                  <td className="px-2 py-2 text-xs">{l.operatorIncluded ? "Daxil" : "—"}</td>
                  <td className="px-2 py-2 text-xs font-medium">{l.nightShift ? "BƏLİ" : "—"}</td>
                  <td className="px-2 py-2 text-xs">{VAT_TREATMENT_LABELS[l.vatTreatment]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.notes && (
        <div>
          <div className="text-xs uppercase text-slate-500">Qeydlər</div>
          <p className="mt-1 whitespace-pre-wrap text-sm">{data.notes}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 pt-6">
        <SignBlock label="İcraçı" name="SKY Services Group MMC" />
        <SignBlock label="Sifarişçi" name={data.masterAgreement.client.name} />
      </div>
    </section>
  );
}

function SignBlock({ label, name }: { label: string; name: string }) {
  return (
    <div className="border-t border-slate-300 pt-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium">{name}</div>
      <div className="mt-8 text-xs text-slate-500">İmza: __________________________</div>
      <div className="mt-1 text-xs text-slate-500">M.Y.</div>
    </div>
  );
}
