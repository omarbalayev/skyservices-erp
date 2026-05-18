import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/modules/clients/actions";
import ClientForm from "../client-form";

export default async function NewClientPage() {
  await requireRole(CRM_EDITORS);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni müştəri"
        actions={
          <Link
            href="/crm/clients"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <ClientForm action={createClient} submitLabel="Yarat" />
        </CardContent>
      </Card>
    </div>
  );
}
