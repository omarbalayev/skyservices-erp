"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/form-field";
import { addContact, softDeleteContact } from "@/modules/clients/actions";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  position: string | null;
  isPrimary: boolean;
};

export default function ContactsPanel({
  clientId,
  contacts,
}: {
  clientId: string;
  contacts: Contact[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAdding(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("clientId", clientId);
    const result = await addContact(fd);
    setAdding(false);
    if (result?.ok === false) {
      setError(result.error);
    } else {
      e.currentTarget.reset();
      setShowForm(false);
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Bu əlaqəni silmək istədiyinizə əminsinizmi?")) return;
    await softDeleteContact(id);
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-slate-500">Bu müştəri üçün heç bir əlaqə yoxdur.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{c.name}</span>
                  {c.isPrimary && (
                    <Badge variant="info" className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3" /> Əsas
                    </Badge>
                  )}
                </div>
                {c.position && <div className="text-xs text-slate-500">{c.position}</div>}
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                  {c.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!showForm && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          + Əlaqə əlavə et
        </Button>
      )}

      {showForm && (
        <form onSubmit={onAdd} className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField label="Ad" htmlFor="contact-name" required>
              <Input id="contact-name" name="name" required />
            </FormField>
            <FormField label="Vəzifə" htmlFor="contact-position">
              <Input id="contact-position" name="position" />
            </FormField>
            <FormField label="Telefon" htmlFor="contact-phone">
              <Input id="contact-phone" name="phone" />
            </FormField>
            <FormField label="Email" htmlFor="contact-email">
              <Input id="contact-email" name="email" type="email" />
            </FormField>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <Checkbox name="isPrimary" value="true" />
            Əsas əlaqə olaraq qeyd et
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Ləğv et
            </Button>
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? "Əlavə olunur..." : "Əlavə et"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
