import type { LucideIcon } from "lucide-react";
import { DataTable, type ColumnSpec, type TableRow } from "@/components/data-table";
import { PageHeader, StatStrip } from "@/components/ui";

export function RecordsPage({ eyebrow, title, description, data, columns, stats, searchPlaceholder, actions, filterOptions, filterKey, emptyMessage }: {
  eyebrow: string; title: string; description: string; data: TableRow[]; columns: ColumnSpec[];
  stats: { label: string; value: string }[]; searchPlaceholder: string;
  actions?: { label: string; href?: string; icon?: LucideIcon; primary?: boolean }[];
  filterOptions?: string[]; filterKey?: string; emptyMessage?: string;
}) {
  return <div className="page"><PageHeader eyebrow={eyebrow} title={title} description={description} actions={actions} /><StatStrip items={stats} /><DataTable data={data} columns={columns} searchPlaceholder={searchPlaceholder} filterOptions={filterOptions} filterKey={filterKey} emptyMessage={emptyMessage} /></div>;
}
