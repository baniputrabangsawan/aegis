"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { flexRender } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, legacyCreateColumnHelper as createColumnHelper, type LegacyColumnDef, useLegacyTable as useReactTable } from "@tanstack/react-table/legacy";
import { StatusBadge, SiteIdentity } from "@/components/ui";

type DataValue = string | number;
export type TableRow = Record<string, DataValue>;
export type ColumnSpec = { key: string; label: string; kind?: "primary" | "site" | "status" | "risk" | "mono" | "number" | "link"; hrefKey?: string };
type SortingState = { id: string; desc: boolean }[];

function CellValue({ value, row, column }: { value: DataValue; row: TableRow; column: ColumnSpec }) {
  if (column.kind === "site") {
    const domain = typeof row.domain === "string" ? row.domain : undefined;
    return <SiteIdentity name={String(value)} domain={domain} />;
  }
  if (column.kind === "status" || column.kind === "risk") return <StatusBadge>{String(value)}</StatusBadge>;
  if (column.kind === "link" && column.hrefKey && typeof row[column.hrefKey] === "string") return <Link className="table-link" href={String(row[column.hrefKey])}>{value}</Link>;
  if (column.kind === "primary") return <span className="cell-primary">{value}</span>;
  if (column.kind === "mono") return <span className="mono">{value}</span>;
  if (column.kind === "number") return <span className="mono" style={{ color: "var(--ink)" }}>{value}</span>;
  return <>{value}</>;
}

export function DataTable({ data, columns, searchPlaceholder = "Search records…", filterLabel = "All sites", filterOptions = [], filterKey, emptyMessage = "No records found." }: {
  data: TableRow[]; columns: ColumnSpec[]; searchPlaceholder?: string; filterLabel?: string; filterOptions?: string[]; filterKey?: string; emptyMessage?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 25;
  const helper = useMemo(() => createColumnHelper<TableRow>(), []);
  const filteredData = useMemo(() => selectedFilter === "all" || !filterKey ? data : data.filter((row) => String(row[filterKey]) === selectedFilter), [data, filterKey, selectedFilter]);
  const tableColumns = useMemo(() => columns.filter((column) => column.key !== "domain").map((column) => helper.accessor((row) => row[column.key], {
    id: column.key,
    header: () => column.label,
    cell: (info) => <CellValue value={info.getValue()} row={info.row.original} column={column} />,
  })), [columns, helper]);
  const table = useReactTable({ data: filteredData, columns: tableColumns as unknown as readonly LegacyColumnDef<TableRow, unknown>[], state: { sorting, globalFilter }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const rows = table.getRowModel().rows;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  return <section className="panel table-panel">
    <div className="toolbar">
      <label className="search-field"><Search size={14} /><input value={globalFilter} onChange={(event) => { setGlobalFilter(event.target.value); setPageIndex(0); }} type="search" placeholder={searchPlaceholder} /></label>
      {filterOptions.length > 0 && <select className="select" aria-label="Filter by site" value={selectedFilter} onChange={(event) => { setSelectedFilter(event.target.value); setPageIndex(0); }}><option value="all">{filterLabel}</option>{filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>}
      <span style={{ marginLeft: "auto", color: "var(--ink-tertiary)", fontSize: 11 }}>{rows.length} results</span>
    </div>
    <div className="table-scroll">
      <table className="data-table">
        <thead>{table.getHeaderGroups().map((group) => <tr key={group.id}>{group.headers.map((header) => <th key={header.id}><button onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}<ChevronsUpDown size={11} /></button></th>)}</tr>)}</thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={tableColumns.length} className="table-empty">{emptyMessage}</td></tr> : visibleRows.map((row) => <tr key={row.id}>{row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}</tbody>
      </table>
    </div>
    <div className="mobile-list">{rows.length === 0 && <div className="mobile-card table-empty">{emptyMessage}</div>}{visibleRows.map((row) => {
      const primary = columns.find((column) => column.kind === "primary" || column.kind === "site" || column.kind === "link") ?? columns[0];
      const status = columns.find((column) => column.kind === "status" || column.kind === "risk");
      const details = columns.filter((column) => column.key !== primary.key && column.key !== status?.key && column.key !== "domain").slice(0, 4);
      const mobileTitle = primary.kind === "link" && primary.hrefKey && typeof row.original[primary.hrefKey] === "string" ? <Link className="table-link" href={String(row.original[primary.hrefKey])}>{row.original[primary.key]}</Link> : row.original[primary.key];
      return <article className="mobile-card" key={row.id}><div className="mobile-card-top"><div><div className="mobile-card-title">{mobileTitle}</div>{typeof row.original.domain === "string" && <div className="mobile-card-subtitle">{row.original.domain}</div>}</div>{status && <StatusBadge>{String(row.original[status.key])}</StatusBadge>}</div><div className="mobile-card-grid">{details.map((detail) => <div key={detail.key}><div className="mobile-card-label">{detail.label}</div><div className="mobile-card-value">{row.original[detail.key]}</div></div>)}</div></article>;
    })}</div>
    <div className="pagination"><span>Showing {rows.length === 0 ? 0 : pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, rows.length)} of {rows.length}</span><div className="pagination-controls"><button className="pagination-button" onClick={() => setPageIndex((page) => Math.max(0, page - 1))} disabled={pageIndex === 0} aria-label="Previous page"><ChevronLeft size={14} /></button><button className="pagination-button" onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))} disabled={pageIndex >= pageCount - 1} aria-label="Next page"><ChevronRight size={14} /></button></div></div>
  </section>;
}
