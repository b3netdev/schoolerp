import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { Eye, Pencil, Trash2 } from "lucide-react";

export interface Column {
  key: string;
  label: string;
  type?: "text" | "badge" | "avatar-text" | "actions" | "status";
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onView?: (row: Record<string, unknown>) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
}

export function DataTable({ columns, data, onView, onEdit, onDelete, emptyMessage = "No records found." }: DataTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[640px]" data-testid="data-table">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                style={col.width ? { width: col.width } : {}}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, ri) => (
            <tr
              key={ri}
              className="hover:bg-muted/40 transition-colors"
              data-testid={`table-row-${ri}`}
            >
              {columns.map(col => {
                const val = row[col.key] as string;
                const initials = row["initials"] as string | undefined;
                const name = row["name"] as string | undefined;

                if (col.type === "avatar-text") {
                  return (
                    <td key={col.key} className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials} name={name || val} size="sm" />
                        <span className="text-sm font-medium text-foreground">{val}</span>
                      </div>
                    </td>
                  );
                }

                if (col.type === "badge" || col.type === "status") {
                  return (
                    <td key={col.key} className="px-6 py-3">
                      <Badge variant={statusToBadgeVariant(val)}>{val}</Badge>
                    </td>
                  );
                }

                if (col.type === "actions") {
                  return (
                    <td key={col.key} className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        {onView && (
                          <button
                            onClick={() => onView(row)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="View"
                            data-testid={`action-view-${ri}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                            data-testid={`action-edit-${ri}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                            data-testid={`action-delete-${ri}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                }

                return (
                  <td key={col.key} className="px-6 py-3 text-sm text-muted-foreground">
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
