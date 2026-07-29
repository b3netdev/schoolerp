import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef, FormValues } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import useStream from "@/hooks/useStream";
import { useAppSelector } from "../../redux/hooks";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

type Stream = {
  id?: number;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

const columns: Column[] = [
  { key: "name", label: "Stream Name", type: "avatar-text" },
  { key: "status", label: "Status", type: "status" },
];

const fields: FieldDef[] = [
  {
    key: "name",
    label: "Stream Name",
    required: true,
    placeholder: "e.g. Science",
  },
  {
    key: "status",
    label: "Status",
    required: false,
    type: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
];

type StatusFilter = "all" | "active" | "inactive" | "trash";

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

const Streams = () => {
  const { getStreams, addstream, updatestream, deletestream, restorestream, hardDeletestream } = useStream();

  const [data, setData] = useState<Stream[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { streams } = useAppSelector((state) => state.stream);

  const [editItem, setEditItem] = useState<Stream | null>(null);
  const [deleteItem, setDeleteItem] = useState<Stream | null>(null);
  const [restoreItem, setRestoreItem] = useState<Stream | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Stream | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadStreams = async (status: StatusFilter) => {
    try {
      setIsLoading(true);
      await getStreams(status);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStreams(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    if (Array.isArray(streams)) {
      const formattedStreams: Stream[] = streams.map(
        (item: Partial<Stream>, index: number) => ({
          id: Number(item.id ?? index + 1),
          name: String(item.name ?? ""),
          status: String(item.status ?? "active"),
          created_at: item.created_at,
          updated_at: item.updated_at,
        })
      );

      setData(formattedStreams);
    }
  }, [streams]);

  const filtered = data.filter((stream) =>
    stream.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filtered.slice((page - 1) * 10, page * 10);

  const handleDelete = async () => {
    if (!deleteItem) return;

    await deletestream(deleteItem.id!);
    setDeleteItem(null);
    await loadStreams(statusFilter);
  };

  const handleRestore = async () => {
    if (!restoreItem) return;

    await restorestream(restoreItem.id!);
    setRestoreItem(null);
    await loadStreams(statusFilter);
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;

    await hardDeletestream(permanentDeleteItem.id!);
    setPermanentDeleteItem(null);
    await loadStreams(statusFilter);
  };

  const handleEdit = async (values: FormValues) => {
    if (!editItem) return;
    const payload = {
      id: editItem.id,
      name: String(values.name),
      status: String(values.status) || "active",
    } as const;
    await updatestream(payload as any);

    setEditItem(null);
    await loadStreams(statusFilter);
  };

  const handleAdd = async (values: FormValues) => {
    const payload = {
      name: String(values.name),
      status: String(values.status) || "active",
    } as const;

    await addstream(payload as any);
    setAddOpen(false);
    await loadStreams(statusFilter);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedStream = data.find((stream) => stream.id === rowId);

    if (selectedStream) {
      // Only allow editing for non-trashed items
      if (statusFilter !== "trash") {
        setEditItem(selectedStream);
      }
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedStream = data.find((stream) => stream.id === rowId);

    if (selectedStream) {
      if (statusFilter === "trash") {
        // In trash, show permanent delete option
        setPermanentDeleteItem(selectedStream);
      } else {
        // Normal view, soft delete
        setDeleteItem(selectedStream);
      }
    }
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedStream = data.find((stream) => stream.id === rowId);

    if (selectedStream) {
      setRestoreItem(selectedStream);
    }
  };

  const editInitialValues: FormValues | undefined = editItem
    ? {
        name: editItem.name,
        status: editItem.status,
      }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Streams" }]} />

      <PageHeader
        title="Streams"
        description={`${data.length} stream records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-stream-btn"
          >
            <Plus className="w-4 h-4" />
            Add Stream
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
                placeholder="Search streams..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="streams-search"
              />
            </div>
            <StatusTabs
              options={statusTabs}
              value={statusFilter}
              onChange={(value: StatusFilter) => setStatusFilter(value)}
              disabled={isLoading}
              className="lg:ml-auto"
            />
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={paginatedData.length} />
          ) : (
            <DataTable
              columns={columns}
              data={paginatedData as Record<string, unknown>[]}
              onEdit={statusFilter !== "trash" ? handleEditClick : undefined}
              onDelete={statusFilter !== "trash" ? handleDeleteClick : undefined}
              onRestore={statusFilter === "trash" ? handleRestoreClick : undefined}
              onPermanentDelete={statusFilter === "trash" ? handleDeleteClick : undefined}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filtered.length} streams
          </span>

          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(filtered.length / 10))}
            onPageChange={setPage}
          />
        </div>
      </div>

      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Stream"
        fields={fields}
        submitLabel="Add Stream"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Stream"
        fields={fields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Stream"
        description={`Are you sure you want to move "${deleteItem?.name ?? ""
          }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={!!restoreItem}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Stream"
        description={`Are you sure you want to restore "${restoreItem?.name ?? ""
          }"? It will be moved back to the active list.`}
        confirmLabel="Restore Stream"
      />

      <ConfirmModal
        isOpen={!!permanentDeleteItem}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Stream"
        description={`Are you sure you want to permanently delete "${permanentDeleteItem?.name ?? ""
          }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default Streams;