import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
} from "lucide-react";

import { toast } from "sonner";

import api from "@/lib/api";

import {
  DataTable,
  type Column,
} from "@/components/tables/DataTable";

import {
  FormModal,
  type FieldDef,
  type FormValues,
} from "@/components/common/FormModal";

import {
  ConfirmModal,
} from "@/components/common/ConfirmModal";

import {
  Breadcrumb,
} from "@/components/common/Breadcrumb";

import {
  Pagination,
} from "@/components/common/Pagination";

import {
  PageHeader,
} from "@/components/common/PageHeader";

import {
  StatusTabs,
  type StatusTabOption,
} from "@/components/common/StatusTabs";

import {
  ListingSkeleton,
} from "@/components/tables/ListingSkeleton";

interface SubjectType {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

type SubjectTypeStatus =
  | "active"
  | "trash";

const SUBJECT_TYPE_API =
  "/subject-type";

const statusTabs: StatusTabOption<SubjectTypeStatus>[] =
  [
    {
      value: "active",
      label: "Active",
    },
    {
      value: "trash",
      label: "Trash",
    },
  ];

const columns: Column[] = [
  {
    key: "title",
    label: "Subject Type",
  },
  {
    key: "created_at",
    label: "Created On",
  },
];

const subjectTypeFields: FieldDef[] = [
  {
    key: "title",
    label: "Subject Type Title",
    type: "text",
    required: true,
    placeholder:
      "Example: Compulsory Subject",
  },
];

export default function SubjectType() {
  const [subjectTypes, setSubjectTypes] =
    useState<SubjectType[]>([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [itemsPerPage, setItemsPerPage] =
    useState(10);

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<SubjectTypeStatus>(
    "active",
  );

  const [addOpen, setAddOpen] =
    useState(false);

  const [editItem, setEditItem] =
    useState<SubjectType | null>(
      null,
    );

  const [deleteItem, setDeleteItem] =
    useState<SubjectType | null>(
      null,
    );

  const [restoreItem, setRestoreItem] =
    useState<SubjectType | null>(
      null,
    );

  const [
    permanentDeleteItem,
    setPermanentDeleteItem,
  ] = useState<SubjectType | null>(
    null,
  );

  const loadSubjectTypes = async () => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `${SUBJECT_TYPE_API}/get-subject-types`,
        {
          params: {
            status: statusFilter,
          },
        },
      );

      const records = response.data?.data;

      setSubjectTypes(
        Array.isArray(records)
          ? records
          : [],
      );
    } catch (error: any) {
      console.error(
        "Failed to fetch subject types:",
        error,
      );

      setSubjectTypes([]);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load subject types.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjectTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredSubjectTypes =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      if (!keyword) {
        return subjectTypes;
      }

      return subjectTypes.filter(
        (item) =>
          item.title
            .toLowerCase()
            .includes(keyword),
      );
    }, [search, subjectTypes]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSubjectTypes.length /
        itemsPerPage,
    ),
  );

  const paginatedSubjectTypes =
    useMemo(() => {
      const startIndex =
        (page - 1) * itemsPerPage;

      return filteredSubjectTypes.slice(
        startIndex,
        startIndex + itemsPerPage,
      );
    }, [
      filteredSubjectTypes,
      itemsPerPage,
      page,
    ]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const tableData = useMemo(
    () =>
      paginatedSubjectTypes.map(
        (item) => ({
          ...item,
          created_at: item.created_at
            ? new Date(
                item.created_at,
              ).toLocaleDateString()
            : "-",
        }),
      ),
    [paginatedSubjectTypes],
  );

  const handleAdd = async (
    values: FormValues,
  ) => {
    const title = String(
      values.title ?? "",
    )
      .trim()
      .replace(/\s+/g, " ");

    if (!title) {
      toast.error(
        "Subject type title is required.",
      );
      return;
    }

    try {
      const response = await api.post(
        `${SUBJECT_TYPE_API}/add-subject-type`,
        { title },
      );

      toast.success(
        response.data?.message ||
          "Subject type added successfully.",
      );

      setAddOpen(false);
      setPage(1);

      await loadSubjectTypes();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to add subject type.",
      );
    }
  };

  const handleEdit = async (
    values: FormValues,
  ) => {
    if (!editItem) {
      return;
    }

    const title = String(
      values.title ?? "",
    )
      .trim()
      .replace(/\s+/g, " ");

    if (!title) {
      toast.error(
        "Subject type title is required.",
      );
      return;
    }

    try {
      const response = await api.patch(
        `${SUBJECT_TYPE_API}/update-subject-type/${editItem.id}`,
        { title },
      );

      toast.success(
        response.data?.message ||
          "Subject type updated successfully.",
      );

      setEditItem(null);

      await loadSubjectTypes();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update subject type.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) {
      return;
    }

    try {
      const response = await api.delete(
        `${SUBJECT_TYPE_API}/delete-subject-type/${deleteItem.id}`,
      );

      toast.success(
        response.data?.message ||
          "Subject type moved to trash.",
      );

      setDeleteItem(null);

      await loadSubjectTypes();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to move subject type to trash.",
      );
    }
  };

  const handleRestore = async () => {
    if (!restoreItem) {
      return;
    }

    try {
      const response = await api.patch(
        `${SUBJECT_TYPE_API}/restore-subject-type/${restoreItem.id}`,
      );

      toast.success(
        response.data?.message ||
          "Subject type restored successfully.",
      );

      setRestoreItem(null);

      await loadSubjectTypes();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to restore subject type.",
      );
    }
  };

  const handlePermanentDelete =
    async () => {
      if (!permanentDeleteItem) {
        return;
      }

      try {
        const response = await api.delete(
          `${SUBJECT_TYPE_API}/hard-delete-subject-type/${permanentDeleteItem.id}`,
        );

        toast.success(
          response.data?.message ||
            "Subject type permanently deleted.",
        );

        setPermanentDeleteItem(null);

        await loadSubjectTypes();
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Unable to permanently delete subject type.",
        );
      }
    };

  const getSubjectTypeFromRow = (
    row: Record<string, unknown>,
  ): SubjectType | undefined => {
    return subjectTypes.find(
      (item) =>
        item.id === Number(row.id),
    );
  };

  const editInitialValues =
    useMemo<
      FormValues | undefined
    >(() => {
      if (!editItem) {
        return undefined;
      }

      return {
        title: editItem.title,
      };
    }, [editItem]);

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Subject Types",
          },
        ]}
      />

      <PageHeader
        title="Subject Types"
        description={`${subjectTypes.length} subject type records`}
        action={
          <button
            type="button"
            onClick={() =>
              setAddOpen(true)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Subject Type
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search subject types..."
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value,
                  );
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows</span>

                <select
                  value={itemsPerPage}
                  onChange={(event) => {
                    setItemsPerPage(
                      Number(
                        event.target.value,
                      ),
                    );
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[5, 10, 20, 50].map(
                    (limit) => (
                      <option
                        key={limit}
                        value={limit}
                      >
                        {limit}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <StatusTabs
                options={statusTabs}
                value={statusFilter}
                disabled={isLoading}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                  setSearch("");
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton
              columns={columns.length}
              rows={itemsPerPage}
            />
          ) : (
            <DataTable
              columns={columns}
              data={
                tableData as unknown as Record<
                  string,
                  unknown
                >[]
              }
              onEdit={
                statusFilter === "active"
                  ? (row) => {
                      const item =
                        getSubjectTypeFromRow(
                          row,
                        );

                      if (item) {
                        setEditItem(item);
                      }
                    }
                  : undefined
              }
              onDelete={
                statusFilter === "active"
                  ? (row) => {
                      const item =
                        getSubjectTypeFromRow(
                          row,
                        );

                      if (item) {
                        setDeleteItem(item);
                      }
                    }
                  : undefined
              }
              onRestore={
                statusFilter === "trash"
                  ? (row) => {
                      const item =
                        getSubjectTypeFromRow(
                          row,
                        );

                      if (item) {
                        setRestoreItem(item);
                      }
                    }
                  : undefined
              }
              onPermanentDelete={
                statusFilter === "trash"
                  ? (row) => {
                      const item =
                        getSubjectTypeFromRow(
                          row,
                        );

                      if (item) {
                        setPermanentDeleteItem(
                          item,
                        );
                      }
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing{" "}
            {paginatedSubjectTypes.length} of{" "}
            {filteredSubjectTypes.length}{" "}
            subject types
          </span>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <FormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={handleAdd}
        title="Add Subject Type"
        fields={subjectTypeFields}
        submitLabel="Add Subject Type"
      />

      <FormModal
        isOpen={Boolean(editItem)}
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={handleEdit}
        title="Edit Subject Type"
        fields={subjectTypeFields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() =>
          setDeleteItem(null)
        }
        onConfirm={handleDelete}
        title="Delete Subject Type"
        description={`Are you sure you want to move "${
          deleteItem?.title ?? ""
        }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={Boolean(restoreItem)}
        onClose={() =>
          setRestoreItem(null)
        }
        onConfirm={handleRestore}
        title="Restore Subject Type"
        description={`Are you sure you want to restore "${
          restoreItem?.title ?? ""
        }"?`}
        confirmLabel="Restore Subject Type"
      />

      <ConfirmModal
        isOpen={Boolean(
          permanentDeleteItem,
        )}
        onClose={() =>
          setPermanentDeleteItem(null)
        }
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Subject Type"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem?.title ?? ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}