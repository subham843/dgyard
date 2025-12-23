"use client";

import { useState } from "react";
import { CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { BulkActions } from "./forms/bulk-actions";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface EnhancedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  bulkActions?: {
    onBulkAction: (action: string, ids: string[]) => Promise<void>;
    actions?: Array<{
      label: string;
      value: string;
      icon: any;
      className?: string;
    }>;
  };
  getId: (item: T) => string;
  loading?: boolean;
}

export function EnhancedTable<T>({
  data,
  columns,
  onRowClick,
  bulkActions,
  getId,
  loading = false,
}: EnhancedTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map(getId)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSort = (key: string) => {
    if (sortColumn === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = (a as any)[sortColumn];
    const bValue = (b as any)[sortColumn];

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {bulkActions && (
                <th className="px-6 py-4 w-12">
                  <button
                    onClick={() => handleSelectAll(!allSelected)}
                    className="flex items-center justify-center"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : someSelected ? (
                      <Square className="w-5 h-5 text-blue-600 border-2 border-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 hover:text-gray-900"
                    >
                      {column.label}
                      {sortColumn === column.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )
                      ) : (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item) => {
              const id = getId(item);
              const isSelected = selectedIds.has(id);

              return (
                <tr
                  key={id}
                  className={`hover:bg-gray-50 ${isSelected ? "bg-blue-50" : ""} ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {bulkActions && (
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRow(id, !isSelected);
                        }}
                        className="flex items-center justify-center"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      {column.render
                        ? column.render(item)
                        : String((item as any)[column.key] || "-")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {bulkActions && selectedIds.size > 0 && (
        <BulkActions
          selectedIds={Array.from(selectedIds)}
          onBulkAction={async (action, ids) => {
            await bulkActions.onBulkAction(action, ids);
            setSelectedIds(new Set());
          }}
          actions={bulkActions.actions}
        />
      )}
    </>
  );
}

