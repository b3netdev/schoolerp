import { useEffect, useMemo, useState } from "react";
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
import {
  StatusTabs,
  StatusTabOption,
} from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

import useSection from "@/hooks/useSection";
import useStream from "@/hooks/useStream";
import { useAppSelector } from "../../redux/hooks";

type Section = {
  id?: number;
  name: string;
  stream_id: string;
  stream_name?: string;
  status: string;
  description: string;
  display_order?: number | null;
};

type StatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "trash";

const columns: Column[] = [
  {
    key: "name",
    label: "Section Name",
    type: "avatar-text",
  },
  {
    key: "stream_name",
    label: "Stream Name",
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "status",
    label: "Status",
    type: "status",
  },
];

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

const Sections = () => {
  const {
    getSection,
    addsection,
    updatesection,
    deletesection,
    restoresection,
    hardDeletesection,
  } = useSection();

  const { getStreams } = useStream();

  const { sections } = useAppSelector(
    (state) => state.section,
  );

  const { streams } = useAppSelector(
    (state) => state.stream,
  );

  const [data, setData] = useState<Section[]>([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editItem, setEditItem] =
    useState<Section | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<Section | null>(null);

  const [restoreItem, setRestoreItem] =
    useState<Section | null>(null);

  const [
    permanentDeleteItem,
    setPermanentDeleteItem,
  ] = useState<Section | null>(null);

  const [addOpen, setAddOpen] =
    useState(false);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [isLoading, setIsLoading] =
    useState(false);

  /**
   * Load sections
   */
  const loadSections = async (
    status: StatusFilter,
  ) => {
    try {
      setIsLoading(true);

      await getSection(status);
    } catch (error) {
      console.error(
        "Failed to fetch sections:",
        error,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial loading / status change
   */
  useEffect(() => {
    loadSections(statusFilter);

    getStreams("all");
  }, [statusFilter]);

  /**
   * Format API section data
   *
   * IMPORTANT:
   * null must remain null.
   *
   * Never do:
   * Number(null)
   *
   * because Number(null) === 0
   */
  useEffect(() => {
    if (!Array.isArray(sections)) {
      return;
    }

    const formattedSections: Section[] =
      sections.map(
        (
          item: Partial<Section>,
          index: number,
        ) => {
          const stream = streams.find(
            (streamItem) =>
              String(streamItem.id) ===
              String(item.stream_id),
          );

          let displayOrder:
            | number
            | null = null;

          if (
            item.display_order !== null &&
            item.display_order !== undefined &&
            String(item.display_order).trim() !== ""
          ) {
            displayOrder = Number(
              item.display_order,
            );
          }

          return {
            id: Number(
              item.id ?? index + 1,
            ),

            name: String(
              item.name ?? "",
            ),

            stream_id: String(
              item.stream_id ?? "",
            ),

            stream_name:
              stream?.name ?? "Unknown",

            status: String(
              item.status ?? "active",
            ),

            description: String(
              item.description ?? "",
            ),

            display_order: displayOrder,
          };
        },
      );

    setData(formattedSections);
  }, [sections, streams]);

  /**
   * Search
   */
  const filtered = data.filter(
    (section) => {
      const searchText =
        search.toLowerCase();

      return (
        section.name
          .toLowerCase()
          .includes(searchText) ||
        section.stream_name
          ?.toLowerCase()
          .includes(searchText)
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
   * Stream dropdown
   */
  const streamOptions = useMemo(() => {
    return streams
      .filter(
        (stream) =>
          stream.status === "active",
      )
      .map((stream) => ({
        label: stream.name,
        value: String(stream.id),
      }));
  }, [streams]);

  /**
   * Form fields
   */
  const fields: FieldDef[] = [
    {
      key: "name",
      label: "Section Name",
      required: true,
      placeholder: "A",
    },
    {
      key: "stream_id",
      label: "Stream Name",
      required: true,
      type: "select",
      options: streamOptions,
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
      key: "description",
      label: "Description",
      required: false,
      placeholder: "Description",
      type: "textarea",
    },
    {
      key: "display_order",
      label: "Display Order",
      required: false,
      placeholder: "Display order",
      type: "number",
    },
  ];

  /**
   * Soft delete
   */
  const handleDelete = async () => {
    if (!deleteItem?.id) return;

    await deletesection(
      deleteItem.id,
    );

    setDeleteItem(null);

    await loadSections(statusFilter);
  };

  /**
   * Restore
   */
  const handleRestore = async () => {
    if (!restoreItem?.id) return;

    await restoresection(
      restoreItem.id,
    );

    setRestoreItem(null);

    await loadSections(statusFilter);
  };

  /**
   * Permanent delete
   */
  const handlePermanentDelete =
    async () => {
      if (!permanentDeleteItem?.id) {
        return;
      }

      await hardDeletesection(
        permanentDeleteItem.id,
      );

      setPermanentDeleteItem(null);

      await loadSections(
        statusFilter,
      );
    };

  /**
   * UPDATE SECTION
   */
  const handleEdit = async (
    values: FormValues,
  ) => {
    if (!editItem) return;

    /**
     * FormModal gives number input
     * values as strings.
     *
     * Example:
     *
     * entered 5 => "5"
     * empty     => ""
     */
    const rawDisplayOrder =
      values.display_order;

    const hasDisplayOrder =
      rawDisplayOrder !== undefined &&
      rawDisplayOrder !== null &&
      String(rawDisplayOrder).trim() !== "";

    /**
     * Base payload.
     *
     * display_order is deliberately
     * NOT included here.
     */
    const payload: {
      id?: number;
      name: string;
      stream_id: string;
      status: string;
      description: string;
      display_order?: number;
    } = {
      id: editItem.id,

      name: String(
        values.name ?? "",
      ).trim(),

      stream_id: String(
        values.stream_id ?? "",
      ),

      status:
        String(
          values.status ?? "",
        ) || "active",

      description: String(
        values.description ?? "",
      ).trim(),
    };

    /**
     * Only add display_order if
     * user actually entered a value.
     */
    if (hasDisplayOrder) {
      payload.display_order = Number(
        rawDisplayOrder,
      );
    }

    console.log(
      "UPDATE SECTION PAYLOAD:",
      payload,
    );

    await updatesection(payload);

    setEditItem(null);

    await loadSections(statusFilter);
  };

  /**
   * ADD SECTION
   */
  const handleAdd = async (
    values: FormValues,
  ) => {
    const rawDisplayOrder =
      values.display_order;

    const hasDisplayOrder =
      rawDisplayOrder !== undefined &&
      rawDisplayOrder !== null &&
      String(rawDisplayOrder).trim() !== "";

    const payload: {
      name: string;
      stream_id: string;
      status: string;
      description: string;
      display_order?: number;
    } = {
      name: String(
        values.name ?? "",
      ).trim(),

      stream_id: String(
        values.stream_id ?? "",
      ),

      status:
        String(
          values.status ?? "",
        ) || "active",

      description: String(
        values.description ?? "",
      ).trim(),
    };

    /**
     * Only include display_order when
     * the field has a real value.
     */
    if (hasDisplayOrder) {
      payload.display_order = Number(
        rawDisplayOrder,
      );
    }

    console.log(
      "ADD SECTION PAYLOAD:",
      payload,
    );

    await addsection(payload);

    setAddOpen(false);

    await loadSections(statusFilter);
  };

  /**
   * Edit click
   */
  const handleEditClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedSection =
      data.find(
        (section) =>
          section.id === rowId,
      );

    if (
      selectedSection &&
      statusFilter !== "trash"
    ) {
      setEditItem(
        selectedSection,
      );
    }
  };

  /**
   * Delete click
   */
  const handleDeleteClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedSection =
      data.find(
        (section) =>
          section.id === rowId,
      );

    if (!selectedSection) {
      return;
    }

    if (statusFilter === "trash") {
      setPermanentDeleteItem(
        selectedSection,
      );
    } else {
      setDeleteItem(
        selectedSection,
      );
    }
  };

  /**
   * Restore click
   */
  const handleRestoreClick = (
    row: Record<string, unknown>,
  ) => {
    const rowId = Number(row.id);

    const selectedSection =
      data.find(
        (section) =>
          section.id === rowId,
      );

    if (selectedSection) {
      setRestoreItem(
        selectedSection,
      );
    }
  };

  /**
   * Edit modal initial values
   *
   * null => ""
   *
   * Therefore input is empty.
   */
  const editInitialValues:
    | FormValues
    | undefined = editItem
    ? {
        name: editItem.name,

        stream_id:
          editItem.stream_id,

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
            label: "Sections",
          },
        ]}
      />

      <PageHeader
        title="Sections"
        description={`${data.length} section records`}
        action={
          <button
            onClick={() =>
              setAddOpen(true)
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-section-btn"
          >
            <Plus className="w-4 h-4" />

            Add Section
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
                placeholder="Search sections..."
                value={search}
                onChange={(e) => {
                  setSearch(
                    e.target.value,
                  );

                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="sections-search"
              />
            </div>

            <StatusTabs
              options={statusTabs}
              value={statusFilter}
              onChange={(
                value: StatusFilter,
              ) => {
                setStatusFilter(
                  value,
                );

                setPage(1);
              }}
              disabled={isLoading}
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
              columns={columns}
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
            sections
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
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Add Modal */}

      <FormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={handleAdd}
        title="Add New Section"
        fields={fields}
        submitLabel="Add Section"
      />

      {/* Edit Modal */}

      <FormModal
        isOpen={!!editItem}
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={handleEdit}
        title="Edit Section"
        fields={fields}
        initialValues={
          editInitialValues
        }
        submitLabel="Save Changes"
      />

      {/* Soft Delete */}

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() =>
          setDeleteItem(null)
        }
        onConfirm={handleDelete}
        title="Delete Section"
        description={`Are you sure you want to move "${
          deleteItem?.name ?? ""
        }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      {/* Restore */}

      <ConfirmModal
        isOpen={!!restoreItem}
        onClose={() =>
          setRestoreItem(null)
        }
        onConfirm={handleRestore}
        title="Restore Section"
        description={`Are you sure you want to restore "${
          restoreItem?.name ?? ""
        }"? It will be moved back to the active list.`}
        confirmLabel="Restore Section"
      />

      {/* Permanent Delete */}

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
        title="Permanently Delete Section"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem?.name ??
          ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default Sections;