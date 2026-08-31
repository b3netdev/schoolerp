import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import {
  Plus,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { DataTable, Column } from "@/components/tables/DataTable";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";
import api from "@/lib/api";

import useClass from "@/hooks/useClass";
import { useAppSelector } from "../../redux/hooks";

type ClassItem = {
  id?: number;
  class_name: string;
  status: string;
  description: string;
  display_order?: number | null;
  sections?: Array<{
    id: number;
    name: string;
    display_order?: number | null;
    description?: string | null;
  }>;
};

type SectionDraft = {
  key: string;
  id?: number;
  name: string;
  display_order: string;
  description: string;
};

type CreateClassPayload = {
  class_name: string;
  status: string;
  description: string;
  display_order: number | null;
  sections: Array<{
    id?: number;
    name?: string;
    display_order?: number | null;
    description?: string | null;
  }>;
};

const createSectionDraft = (): SectionDraft => ({
  key: crypto.randomUUID(),
  name: "",
  display_order: "",
  description: "",
});

type ClassFormModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: "create" | "edit";
  initialValues?: ClassItem | null;
  onRemoveExistingSection?: (
    classId: number,
    sectionId: number,
  ) => Promise<void>;
  onUpdateExistingSection?: (
    classId: number,
    sectionId: number,
    data: {
      name: string;
      description: string | null;
      display_order: number | null;
    },
  ) => Promise<void>;
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
};

const ClassFormModal = ({
  isOpen,
  isSubmitting,
  mode,
  initialValues,
  onRemoveExistingSection,
  onUpdateExistingSection,
  onClose,
  onSubmit,
}: ClassFormModalProps) => {
  const classNameId = useId();
  const classOrderId = useId();
  const classDescriptionId = useId();
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("active");
  const [displayOrder, setDisplayOrder] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>([]);
  const [error, setError] = useState("");
  const [editingSectionKey, setEditingSectionKey] = useState<string | null>(null);
  const [savingSectionKey, setSavingSectionKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setClassName(initialValues?.class_name ?? "");
    setStatus(initialValues?.status ?? "active");
    setDisplayOrder(
      initialValues?.display_order === null ||
        initialValues?.display_order === undefined
        ? ""
        : String(initialValues.display_order),
    );
    setDescription(initialValues?.description ?? "");
    setSections(
      (initialValues?.sections ?? []).map((section) => ({
        key: crypto.randomUUID(),
        id: section.id,
        name: section.name,
        display_order:
          section.display_order === null ||
            section.display_order === undefined
            ? ""
            : String(section.display_order),
        description: section.description ?? "",
      })),
    );
    setError("");
    setEditingSectionKey(null);
    setSavingSectionKey(null);
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const updateSection = (
    key: string,
    field: keyof Omit<SectionDraft, "key">,
    value: string,
  ) => {
    setSections((currentSections) =>
      currentSections.map((section) =>
        section.key === key
          ? { ...section, [field]: value }
          : section,
      ),
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Class name is required.");
      return;
    }

    const hasEmptyNewSectionName = sections.some(
      (section) => section.id === undefined && !section.name.trim(),
    );

    if (hasEmptyNewSectionName) {
      setError("Enter a name for every section, or remove the empty row.");
      return;
    }

    try {
      await onSubmit({
        class_name: className.trim(),
        status,
        description: description.trim(),
        display_order: displayOrder.trim()
          ? Number(displayOrder)
          : null,
        sections: sections.map((section) => {
          if (section.id !== undefined) {
            return {
              id: section.id,
              name: section.name.trim(),
              display_order: section.display_order.trim()
                ? Number(section.display_order)
                : null,
              description: section.description.trim() || null,
            };
          }

          return {
            name: section.name.trim(),
            display_order: section.display_order.trim()
              ? Number(section.display_order)
              : null,
            description: section.description.trim() || null,
          };
        }),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Unable to ${mode === "create" ? "create" : "update"} the class. Please try again.`,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-form-title"
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-primary">Academic setup</p>
            <h2 id="class-form-title" className="mt-1 text-xl font-bold text-card-foreground">
              {mode === "create" ? "Add New Class" : "Edit Class"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "create"
                ? "Add sections now, or create the class first and add them later."
                : "Update class details and add further sections when needed."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close class form modal"
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          {error && (
            <div role="alert" className="mb-5 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor={classNameId} className="text-sm font-semibold text-card-foreground">
                Class Name <span className="text-destructive">*</span>
              </label>
              <input
                id={classNameId}
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Example: Class One"
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor={classOrderId} className="text-sm font-semibold text-card-foreground">
                Display Order
              </label>
              <input
                id={classOrderId}
                type="number"
                min="0"
                value={displayOrder}
                onChange={(event) => setDisplayOrder(event.target.value)}
                placeholder="Optional"
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={classDescriptionId} className="text-sm font-semibold text-card-foreground">
                Description
              </label>
              <input
                id={classDescriptionId}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional class description"
                disabled={isSubmitting}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-muted/35">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">Sections</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Optional. Add A, B, C, or any section required for this class.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSections((currentSections) => [...currentSections, createSectionDraft()])}
                disabled={isSubmitting}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="size-4" />
                Add Section
              </button>
            </div>

            {sections.length === 0 ? (
              <div className="px-4 py-7 text-center">
                <p className="text-sm font-medium text-card-foreground">No sections added yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Use Add Section to include one or more sections.</p>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {sections.map((section, index) => {
                  const isExistingSection = section.id !== undefined;
                  const isEditingExistingSection = editingSectionKey === section.key;
                  const isDisabled = isSubmitting || savingSectionKey === section.key || (isExistingSection && !isEditingExistingSection);

                  return (
                  <div key={section.key} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-card-foreground">Section {index + 1}</p>
                      {section.id === undefined ? (
                        <button
                          type="button"
                          onClick={() => setSections((currentSections) => currentSections.filter((item) => item.key !== section.key))}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="size-3.5" />
                          Remove
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          {isEditingExistingSection ? (
                            <button
                              type="button"
                              onClick={async () => {
                                if (!initialValues?.id || !section.id || !onUpdateExistingSection) return;
                                if (!section.name.trim()) {
                                  setError("Section name is required.");
                                  return;
                                }
                                try {
                                  setSavingSectionKey(section.key);
                                  setError("");
                                  await onUpdateExistingSection(initialValues.id, section.id, {
                                    name: section.name.trim(),
                                    description: section.description.trim() || null,
                                    display_order: section.display_order.trim() ? Number(section.display_order) : null,
                                  });
                                  setEditingSectionKey(null);
                                } catch (updateError) {
                                  setError(updateError instanceof Error ? updateError.message : "Unable to update the section.");
                                } finally {
                                  setSavingSectionKey(null);
                                }
                              }}
                              disabled={isSubmitting || savingSectionKey === section.key}
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed"
                            >
                              Save section
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingSectionKey(section.key)}
                              disabled={isSubmitting}
                              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!initialValues?.id || !section.id || !onRemoveExistingSection) return;
                              try {
                                setSavingSectionKey(section.key);
                                setError("");
                                await onRemoveExistingSection(initialValues.id, section.id);
                                setSections((currentSections) => currentSections.filter((item) => item.key !== section.key));
                                if (editingSectionKey === section.key) setEditingSectionKey(null);
                              } catch (removeError) {
                                setError(removeError instanceof Error ? removeError.message : "Unable to remove the section.");
                              } finally {
                                setSavingSectionKey(null);
                              }
                            }}
                            disabled={isSubmitting || savingSectionKey === section.key}
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
                      <input
                        value={section.name}
                        onChange={(event) => updateSection(section.key, "name", event.target.value)}
                        placeholder="Section name, e.g. A"
                        disabled={isDisabled}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <input
                        type="number"
                        min="0"
                        value={section.display_order}
                        onChange={(event) => updateSection(section.key, "display_order", event.target.value)}
                        placeholder="Order"
                        disabled={isDisabled}
                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                    <input
                      value={section.description}
                      onChange={(event) => updateSection(section.key, "description", event.target.value)}
                      placeholder="Optional section description"
                      disabled={isDisabled}
                      className="mt-3 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
            <Plus className="size-4" />
            {isSubmitting
              ? mode === "create"
                ? "Adding Class..."
                : "Saving Changes..."
              : mode === "create"
                ? "Add Class"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
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

  const [isCreating, setIsCreating] =
    useState(false);

  const [isEditing, setIsEditing] =
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
    payload: CreateClassPayload,
  ) => {
    try {
      setIsCreating(true);

      const isAdded = await addclass(payload);

      if (!isAdded) {
        throw new Error("Unable to create the class. Please try again.");
      }

      setAddOpen(false);

      /** Reload because backend sorts using display_order. */
      await loadClasses(statusFilter);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * UPDATE CLASS
   */
  const handleEdit = async (
    values: CreateClassPayload,
  ) => {
    if (!editItem?.id) {
      return;
    }

    try {
      setIsEditing(true);

      const isUpdated = await updateclass({
        id: editItem.id,
        ...values,
      });

      if (!isUpdated) {
        throw new Error("Unable to update the class. Please try again.");
      }

      setEditItem(null);
      await loadClasses(statusFilter);
    } finally {
      setIsEditing(false);
    }
  };

  const handleRemoveExistingSection = async (
    classId: number,
    sectionId: number,
  ) => {
    const result = await api.delete(
      `/class/remove-section/${classId}/${sectionId}`,
    );

    if (!result?.data?.success) {
      throw new Error(
        result?.data?.message || "Unable to remove the section.",
      );
    }

    setEditItem((currentItem) => {
      if (!currentItem) return null;

      return {
        ...currentItem,
        sections: (currentItem.sections ?? []).filter(
          (section) => section.id !== sectionId,
        ),
      };
    });
  };

  const handleUpdateExistingSection = async (
    classId: number,
    sectionId: number,
    sectionData: {
      name: string;
      description: string | null;
      display_order: number | null;
    },
  ) => {
    const result = await api.patch(
      `/class/update-section/${classId}/${sectionId}`,
      sectionData,
    );

    if (!result?.data?.success) {
      throw new Error(result?.data?.message || "Unable to update the section.");
    }

    setEditItem((currentItem) => {
      if (!currentItem) return null;

      return {
        ...currentItem,
        sections: (currentItem.sections ?? []).map((section) =>
          section.id === sectionId ? { ...section, ...result.data.data } : section,
        ),
      };
    });
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

    if (!selectedClass || statusFilter === "trash") return;

    // Open immediately. The class details request below only enriches this
    // modal with its existing sections.
    setEditItem({
      ...selectedClass,
      sections: [],
    });

    void (async () => {
      try {
        const result = await api.get(
          `/class/get-class/${rowId}`,
        );

        if (!result?.data?.success) {
          throw new Error("Unable to load class details.");
        }

        setEditItem((currentItem) => {
          if (currentItem?.id !== rowId) {
            return currentItem;
          }

          return {
            ...currentItem,
            ...result.data.data,
            sections: Array.isArray(result.data.data.sections)
              ? result.data.data.sections
              : [],
          };
        });
      } catch (error) {
        // The modal stays usable for updating class fields or adding sections
        // even if existing section details could not be loaded.
        console.error("Unable to load class sections:", error);
      }
    })();
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

      <ClassFormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={
          handleAdd
        }
        isSubmitting={isCreating}
        mode="create"
      />

      {/* EDIT */}

      <ClassFormModal
        isOpen={
          !!editItem
        }
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={
          handleEdit
        }
        initialValues={editItem}
        onRemoveExistingSection={handleRemoveExistingSection}
        onUpdateExistingSection={handleUpdateExistingSection}
        mode="edit"
        isSubmitting={isEditing}
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
        description={`Are you sure you want to move "${deleteItem?.class_name ??
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
        description={`Are you sure you want to restore "${restoreItem?.class_name ??
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
        description={`Are you sure you want to permanently delete "${permanentDeleteItem?.class_name ??
          ""
          }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default Classes;