import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { DataTable, Column } from "@/components/tables/DataTable";
import {
  FormModal,
  FieldDef,
  FormValues,
} from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

import useClass from "@/hooks/useClass";
import { useAppSelector } from "../../redux/hooks";

type ClassItem = {
  id?: number;
  class_name: string;
  status: string;
  description: string;
  display_order?: number | null;
};

const columns: Column[] = [
  {
    key: "class_name",
    label: "Class Name",
    type: "avatar-text",
  },
  {
    key: "display_order",
    label: "Display Order",
  },
  {
    key: "status",
    label: "Status",
    type: "status",
  },
  {
    key: "description",
    label: "Description",
  },
];

const fields: FieldDef[] = [
  {
    key: "class_name",
    label: "Class Name",
    required: true,
    placeholder: "Class One",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    type: "select",
    options: [
      {
        label: "Active",
        value: "active",
      },
      {
        label: "Inactive",
        value: "inactive",
      },
    ],
  },
  {
    key: "display_order",
    label: "Display Order",
    required: false,
    type: "number",
    placeholder: "Enter display order",
  },
  {
    key: "description",
    label: "Description",
    required: false,
    placeholder: "Enter class description",
    type: "textarea",
  },
];

type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "trash";

const statusTabs: StatusTabOption<StatusFilter>[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "trash",
    label: "Trash",
  },
];

const Classes = () => {
  const {
    getClasses,
    addclass,
    updateclass,
    deleteclass,
    restoreclass,
    hardDeleteclass,
  } = useClass();

  const { classes } = useAppSelector(
    (state) => state.class,
  );

  const [data, setData] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editItem, setEditItem] =
    useState<ClassItem | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<ClassItem | null>(null);

  const [restoreItem, setRestoreItem] =
    useState<ClassItem | null>(null);

  const [
    permanentDeleteItem,
    setPermanentDeleteItem,
  ] = useState<ClassItem | null>(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [isLoading, setIsLoading] =
    useState(false);

  /**
   * Load classes
   */
  const loadClasses = async (
    status: StatusFilter,
  ) => {
    try {
      setIsLoading(true);

      await getClasses(status);
    } catch (error) {
      console.error(
        "Failed to fetch classes:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load when filter changes
   */
  useEffect(() => {
    void loadClasses(statusFilter);
  }, [statusFilter]);

  /**
   * Format Redux/API data
   *
   * IMPORTANT:
   * Keep NULL as null.
   * Never do Number(null), because it becomes 0.
   */
  useEffect(() => {
    if (!Array.isArray(classes)) {
      return;
    }

    const formattedClasses: ClassItem[] =
      classes.map(
        (
          item: Partial<ClassItem>,
          index: number,
        ) => {
          let displayOrder:
            | number
            | null = null;

          if (
            item.display_order !== null &&
            item.display_order !== undefined &&
            String(
              item.display_order,
            ).trim() !== ""
          ) {
            displayOrder = Number(
              item.display_order,
            );
          }

          return {
            id: Number(
              item.id ?? index + 1,
            ),

            class_name: String(
              item.class_name ?? "",
            ),

            status: String(
              item.status ?? "active",
            ),

            description: String(
              item.description ?? "",
            ),

            display_order:
              displayOrder,
          };
        },
      );

    setData(formattedClasses);
  }, [classes]);

  /**
   * Search
   */
  const filtered = data.filter(
    (classItem) => {
      const keyword =
        search.toLowerCase();

      return (
        classItem.class_name
          .toLowerCase()
          .includes(keyword) ||
        classItem.status
          .toLowerCase()
          .includes(keyword) ||
        classItem.description
          .toLowerCase()
          .includes(keyword)
      );
    },
  );

  /**
   * Pagination
   */
  const paginatedData = filtered.slice(
    (page - 1) * 10,
    page * 10,
  );

  /**
   * ADD CLASS
   */
  const handleAdd = async (
    values: FormValues,
  ) => {
    const rawDisplayOrder =
      values.display_order;

    /**
     * Empty string / undefined / null
     * should become NULL, not 0.
     */
    const displayOrder =
      rawDisplayOrder === undefined ||
      rawDisplayOrder === null ||
      String(rawDisplayOrder).trim() === ""
        ? null
        : Number(rawDisplayOrder);

    const payload = {
      class_name: String(
        values.class_name ?? "",
      ).trim(),

      status:
        String(
          values.status ?? "",
        ) || "active",

      description: String(
        values.description ?? "",
      ).trim(),

      display_order:
        displayOrder,
    };

    console.log(
      "ADD CLASS PAYLOAD:",
      payload,
    );

    await addclass(payload);

    setAddOpen(false);

    /**
     * Reload because backend sorts
     * using display_order.
     */
    await loadClasses(statusFilter);
  };

  /**
   * UPDATE CLASS
   */
  const handleEdit = async (
    values: FormValues,
  ) => {
    if (!editItem) {
      return;
    }

    const rawDisplayOrder =
      values.display_order;

    /**
     * Important:
     *
     * ""   -> null
     * null -> null
     * "3"  -> 3
     *
     * Do NOT use:
     *
     * Number(rawDisplayOrder || null)
     *
     * because Number(null) = 0.
     */
    const displayOrder =
      rawDisplayOrder === undefined ||
      rawDisplayOrder === null ||
      String(rawDisplayOrder).trim() === ""
        ? null
        : Number(rawDisplayOrder);

    const payload = {
      id: editItem.id,

      class_name: String(
        values.class_name ?? "",
      ).trim(),

      status:
        String(
          values.status ?? "",
        ) || "active",

      description: String(
        values.description ?? "",
      ).trim(),

      display_order:
        displayOrder,
    };

    console.log(
      "UPDATE CLASS PAYLOAD:",
      payload,
    );

    await updateclass(payload);

    setEditItem(null);

    /**
     * Reload so new display order
     * immediately changes list order.
     */
    await loadClasses(statusFilter);
  };

  /**
   * DELETE
   */
  const handleDelete = async () => {
    if (!deleteItem?.id) {
      return;
    }

    await deleteclass(
      deleteItem.id,
    );

    setDeleteItem(null);

    await loadClasses(statusFilter);
  };

  /**
   * RESTORE
   */
  const handleRestore = async () => {
    if (!restoreItem?.id) {
      return;
    }

    await restoreclass(
      restoreItem.id,
    );

    setRestoreItem(null);

    await loadClasses(statusFilter);
  };

  /**
   * PERMANENT DELETE
   */
  const handlePermanentDelete =
    async () => {
      if (
        !permanentDeleteItem?.id
      ) {
        return;
      }

      await hardDeleteclass(
        permanentDeleteItem.id,
      );

      setPermanentDeleteItem(null);

      await loadClasses(
        statusFilter,
      );
    };

  /**
   * EDIT CLICK
   */
  const handleEditClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedClass =
      data.find(
        (classItem) =>
          classItem.id === rowId,
      );

    if (
      selectedClass &&
      statusFilter !== "trash"
    ) {
      setEditItem(
        selectedClass,
      );
    }
  };

  /**
   * DELETE CLICK
   */
  const handleDeleteClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedClass =
      data.find(
        (classItem) =>
          classItem.id === rowId,
      );

    if (!selectedClass) {
      return;
    }

    if (
      statusFilter === "trash"
    ) {
      setPermanentDeleteItem(
        selectedClass,
      );
    } else {
      setDeleteItem(
        selectedClass,
      );
    }
  };

  /**
   * RESTORE CLICK
   */
  const handleRestoreClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedClass =
      data.find(
        (classItem) =>
          classItem.id === rowId,
      );

    if (selectedClass) {
      setRestoreItem(
        selectedClass,
      );
    }
  };

  /**
   * EDIT FORM INITIAL VALUES
   *
   * NULL -> ""
   *
   * Therefore display order input
   * stays EMPTY.
   */
  const editInitialValues:
    | FormValues
    | undefined = editItem
    ? {
        class_name:
          editItem.class_name,

        status:
          editItem.status,

        description:
          editItem.description,

        display_order:
          editItem.display_order ===
            null ||
          editItem.display_order ===
            undefined
            ? ""
            : String(
                editItem.display_order,
              ),
      }
    : undefined;

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Classes",
          },
        ]}
      />

      <PageHeader
        title="Classes"
        description={`${data.length} class records`}
        action={
          <button
            onClick={() =>
              setAddOpen(true)
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-class-btn"
          >
            <Plus className="w-4 h-4" />

            Add Class
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search classes..."
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value,
                  );

                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="classes-search"
              />
            </div>

            <StatusTabs
              options={
                statusTabs
              }
              value={
                statusFilter
              }
              onChange={(
                value: StatusFilter,
              ) => {
                setStatusFilter(
                  value,
                );

                setPage(1);
              }}
              disabled={
                isLoading
              }
              className="lg:ml-auto"
            />
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton
              columns={
                columns.length
              }
              rows={10}
            />
          ) : (
            <DataTable
              columns={
                columns
              }
              data={
                paginatedData as Record<
                  string,
                  unknown
                >[]
              }
              onEdit={
                statusFilter !==
                "trash"
                  ? handleEditClick
                  : undefined
              }
              onDelete={
                statusFilter !==
                "trash"
                  ? handleDeleteClick
                  : undefined
              }
              onRestore={
                statusFilter ===
                "trash"
                  ? handleRestoreClick
                  : undefined
              }
              onPermanentDelete={
                statusFilter ===
                "trash"
                  ? handleDeleteClick
                  : undefined
              }
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing{" "}
            {paginatedData.length}{" "}
            of {filtered.length}{" "}
            classes
          </span>

          <Pagination
            currentPage={page}
            totalPages={Math.max(
              1,
              Math.ceil(
                filtered.length /
                  10,
              ),
            )}
            onPageChange={
              setPage
            }
          />
        </div>
      </div>

      {/* ADD */}

      <FormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={
          handleAdd
        }
        title="Add New Class"
        fields={fields}
        submitLabel="Add Class"
      />

      {/* EDIT */}

      <FormModal
        isOpen={
          !!editItem
        }
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={
          handleEdit
        }
        title="Edit Class"
        fields={fields}
        initialValues={
          editInitialValues
        }
        submitLabel="Save Changes"
      />

      {/* DELETE */}

      <ConfirmModal
        isOpen={
          !!deleteItem
        }
        onClose={() =>
          setDeleteItem(null)
        }
        onConfirm={
          handleDelete
        }
        title="Delete Class"
        description={`Are you sure you want to move "${
          deleteItem?.class_name ??
          ""
        }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      {/* RESTORE */}

      <ConfirmModal
        isOpen={
          !!restoreItem
        }
        onClose={() =>
          setRestoreItem(null)
        }
        onConfirm={
          handleRestore
        }
        title="Restore Class"
        description={`Are you sure you want to restore "${
          restoreItem?.class_name ??
          ""
        }"? It will be moved back to the active list.`}
        confirmLabel="Restore Class"
      />

      {/* PERMANENT DELETE */}

      <ConfirmModal
        isOpen={
          !!permanentDeleteItem
        }
        onClose={() =>
          setPermanentDeleteItem(
            null,
          )
        }
        onConfirm={
          handlePermanentDelete
        }
        title="Permanently Delete Class"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem?.class_name ??
          ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default Classes;