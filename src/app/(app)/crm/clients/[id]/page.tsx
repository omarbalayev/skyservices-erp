import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { fmtDate } from "@/lib/format";
import { softDeleteClient } from "@/modules/clients/actions";
import ContactsPanel from "./contacts-panel";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      masterAgreement: true,
      _count: { select: { leads: { where: { deletedAt: null } } } },
    },
  });
  if (!client || client.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);

  return (
    <div className="space-y-4">
      <PageHeader
        title={client.name}
        description={client.voen ? `VÖEN: ${client.voen}` : "VÖEN qeyd edilməyib"}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/clients"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Siyahı
            </Link>
            {editable && (
              <Link href={`/crm/clients/${client.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteClient.bind(null, client.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Sil
                </Button>
              </form>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Müştəri məlumatları</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-400">Ad</dt>
                <dd className="text-slate-900">{client.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">VÖEN</dt>
                <dd>{client.voen ?? <span className="text-slate-400">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Faktura prefiksi</dt>
                <dd>
                  {client.numberingPrefix ? (
                    <Badge variant="outline">{client.numberingPrefix}</Badge>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Yaradılma</dt>
                <dd>{fmtDate(client.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-slate-400">Hesab-faktura ünvanı</dt>
                <dd className="whitespace-pre-wrap">
                  {client.billingAddress ?? <span className="text-slate-400">—</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">
                  {client.notes ?? <span className="text-slate-400">—</span>}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bir baxışda</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Müraciətlər</dt>
                <dd>{client._count.leads}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">MSA (Müqavilə)</dt>
                <dd>
                  {client.masterAgreement ? (
                    <Badge variant="success">{client.masterAgreement.agreementNumber}</Badge>
                  ) : (
                    <Badge variant="outline">Yoxdur</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Əlaqələr</CardTitle>
        </CardHeader>
        <CardContent>
          {editable ? (
            <ContactsPanel clientId={client.id} contacts={client.contacts} />
          ) : client.contacts.length === 0 ? (
            <p className="text-sm text-slate-500">Bu müştəri üçün heç bir əlaqə yoxdur.</p>
          ) : (
            <ul className="text-sm">
              {client.contacts.map((c) => (
                <li key={c.id} className="py-1">
                  <span className="font-medium">{c.name}</span>
                  {c.position && <span className="text-slate-500"> — {c.position}</span>}
                  {c.phone && <span className="text-slate-500"> · {c.phone}</span>}
                  {c.email && <span className="text-slate-500"> · {c.email}</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
