"use client";

import { useState, useTransition } from "react";
import { ExternalLink, FileText, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ensureVerifyToken, type DocKind } from "@/modules/documents/actions";

export default function DocActions({
  kind,
  id,
  token,
}: {
  kind: DocKind;
  id: string;
  token: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [currentToken, setCurrentToken] = useState<string | null>(token);

  function open() {
    if (currentToken) {
      window.open(`/verify/${currentToken}?print=1`, "_blank");
      return;
    }
    startTransition(async () => {
      const result = await ensureVerifyToken(kind, id);
      if (result.ok) {
        setCurrentToken(result.token);
        window.open(`/verify/${result.token}?print=1`, "_blank");
      } else {
        alert(result.error);
      }
    });
  }

  function copyVerify() {
    if (!currentToken) return;
    const url = `${window.location.origin}/verify/${currentToken}`;
    navigator.clipboard.writeText(url).then(
      () => alert("Yoxlama linki kopyalandı:\n" + url),
      () => alert(url),
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={open} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
        Sənədi göstər / çap et
      </Button>
      {currentToken && (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={copyVerify}>
            <ExternalLink className="h-4 w-4" /> Yoxlama linkini kopyala
          </Button>
          <a
            href={`/verify/${currentToken}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            <FileText className="h-4 w-4" /> Açıq link
          </a>
        </>
      )}
    </div>
  );
}
