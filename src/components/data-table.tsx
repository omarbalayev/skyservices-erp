import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export function DataTable<T>({
  data,
  columns,
  rowKey,
  empty,
  rowHref,
  className,
}: {
  data: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  /** If provided, makes the whole row a link via per-cell <a> anchors (semantic). */
  rowHref?: (row: T) => string;
  className?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        {empty ?? "Hələ heç nə yoxdur."}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-slate-200 bg-white", className)}>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn("px-4 py-3", c.headerClassName)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {data.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr key={rowKey(row)} className="hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3", c.className)}>
                    {href ? (
                      <a className="block" href={href}>
                        {c.cell(row)}
                      </a>
                    ) : (
                      c.cell(row)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
