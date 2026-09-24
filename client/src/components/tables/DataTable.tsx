import {
  Badge,
  statusToBadgeVariant,
} from "@/components/common/Badge";

import { Avatar } from "@/components/common/Avatar";

import {
  ActionButtonGroup,
} from "@/components/common/ActionButtonGroup";

export type ColumnType =
  | "text"
  | "avatar-text"
  | "badge"
  | "status"
  | "actions";

export interface Column {
  key: string;
  label: string;
  type?: ColumnType;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];

  onView?: (
    row: Record<string, unknown>,
  ) => void;

  onEdit?: (
    row: Record<string, unknown>,
  ) => void;

  onDelete?: (
    row: Record<string, unknown>,
  ) => void;

  onAssign?: (
    row: Record<string, unknown>,
  ) => void;

  onRestore?: (
    row: Record<string, unknown>,
  ) => void;

  onPermanentDelete?: (
    row: Record<string, unknown>,
  ) => void;

  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  onAssign,
  onRestore,
  onPermanentDelete,
  emptyMessage = "No records found.",
}: DataTableProps) {
  const hasActions = Boolean(
    onView ||
      onEdit ||
      onDelete ||
      onAssign ||
      onRestore ||
      onPermanentDelete,
  );

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto">
      <table
        className="w-full min-w-[640px]"
        data-testid="data-table"
      >
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                style={
                  column.width
                    ? {
                        width: column.width,
                      }
                    : undefined
                }
              >
                {column.label}
              </th>
            ))}

            {hasActions && (
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr
              key={String(row.id ?? rowIndex)}
              className="transition-colors hover:bg-muted/40"
              data-testid={`table-row-${rowIndex}`}
            >
              {columns.map((column) => {
                const value = String(
                  row[column.key] ?? "",
                );

                const initials = String(
                  row.initials ?? "",
                );

                const name = String(
                  row.name ?? value,
                );

                if (column.type === "avatar-text") {
                  return (
                    <td
                      key={column.key}
                      className="px-6 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={initials}
                          name={name}
                          size="sm"
                        />

                        <span className="text-sm font-medium text-foreground">
                          {value}
                        </span>
                      </div>
                    </td>
                  );
                }

                if (
                  column.type === "badge" ||
                  column.type === "status"
                ) {
                  return (
                    <td
                      key={column.key}
                      className="px-6 py-3"
                    >
                      <Badge
                        variant={
                          statusToBadgeVariant(value)
                        }
                      >
                        {value}
                      </Badge>
                    </td>
                  );
                }

                return (
                  <td
                    key={column.key}
                    className="px-6 py-3 text-sm text-muted-foreground"
                  >
                    {value}
                  </td>
                );
              })}

              {hasActions && (
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <ActionButtonGroup
                      onView={
                        onView
                          ? () => onView(row)
                          : undefined
                      }
                      onEdit={
                        onEdit
                          ? () => onEdit(row)
                          : undefined
                      }
                      onDelete={
                        onDelete
                          ? () => onDelete(row)
                          : undefined
                      }
                      onRestore={
                        onRestore
                          ? () => onRestore(row)
                          : undefined
                      }
                      onPermanentDelete={
                        onPermanentDelete
                          ? () =>
                              onPermanentDelete(row)
                          : undefined
                      }
                    />

                    {onAssign && (
                      <button
                        type="button"
                        onClick={() => onAssign(row)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}