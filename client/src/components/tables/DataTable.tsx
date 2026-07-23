import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { ActionButtonGroup } from "@/components/common/ActionButtonGroup";

export type ColumnType = "text" | "avatar-text" | "badge" | "status" | "actions";

export interface Column {
  key: string;
  label: string;
  type?: ColumnType;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onView?: (row: Record<string, unknown>) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onRestore?: (row: Record<string, unknown>) => void;
  onPermanentDelete?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  emptyMessage = "No records found.",
}: DataTableProps) {
  const hasActions = Boolean(onView || onEdit || onDelete || onRestore || onPermanentDelete);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[640px]" data-testid="data-table">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}

            {hasActions && (
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr
              key={String(row.id ?? rowIndex)}
              className="hover:bg-muted/40 transition-colors"
              data-testid={`table-row-${rowIndex}`}
            >
              {columns.map((col) => {
                const val = String(row[col.key] ?? "");
                const initials = String(row.initials ?? "");
                const name = String(row.name ?? val);

                if (col.type === "avatar-text") {
                  return (
                    <td key={col.key} className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initials} name={name} size="sm" />
                        <span className="text-sm font-medium text-foreground">
                          {val}
                        </span>
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

                return (
                  <td
                    key={col.key}
                    className="px-6 py-3 text-sm text-muted-foreground"
                  >
                    {val}
                  </td>
                );
              })}

              {hasActions && (
                <td className="px-6 py-3">
                  <ActionButtonGroup
                    onView={onView ? () => onView(row) : undefined}
                    onEdit={onEdit ? () => onEdit(row) : undefined}
                    onDelete={onDelete ? () => onDelete(row) : undefined}
                    onRestore={onRestore ? () => onRestore(row) : undefined}
                    onPermanentDelete={onPermanentDelete ? () => onPermanentDelete(row) : undefined}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}