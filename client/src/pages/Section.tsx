import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef, FormValues } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { parents as initialParents } from "@/data/dummyData";
import useSection from "@/hooks/useSection";
import { useAppSelector } from "../../redux/hooks";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

type Section = {
  id?: number;
  name: string;
  stream: string;
  status: string;
  description: string;
};

const columns: Column[] = [
  { key: "name", label: "Section Name", type: "avatar-text" },
  { key: "stream", label: "Stream Name" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status", type: "status" },
];

const fields: FieldDef[] = [
  {
    key: "name",
    label: "Section Name",
    required: true,
    placeholder: "A",
  },
  {
    key: "stream",
    label: "Stream Name",
    required: false,
    placeholder: "Physics",
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
  {
    key: "description",
    label: "Description",
    required: false,
    placeholder: "description",
    type: "textarea"
  },
];

const initialSections: Section[] = (
  initialParents as unknown as Array<Partial<Section>>
).map((item, index) => ({
  id: Number(item.id ?? index + 1),
  name: String(item.name ?? ""),
  stream: String(item.stream ?? ""),
  status: String(item.status ?? "active"),
  description: String(item.description ?? ""),
}));

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

const Sections = () => {
  const { getSection, addsection, updatesection, deletesection, restoresection, hardDeletesection } = useSection();

  const [data, setData] = useState<Section[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { sections } = useAppSelector((state) => state.section);

  const [editItem, setEditItem] = useState<Section | null>(null);
  const [deleteItem, setDeleteItem] = useState<Section | null>(null);
  const [restoreItem, setRestoreItem] = useState<Section | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Section | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadSections = async (status: StatusFilter) => {
    try {
      setIsLoading(true);
      await getSection(status);
    } catch (error) {
      console.error("Failed to fetch sections:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSections(statusFilter);
  }, [statusFilter]);


  useEffect(() => {
    if (Array.isArray(sections)) {
      const formattedSections: Section[] = sections.map(
        (item: Partial<Section>, index: number) => ({
          id: Number(item.id ?? index + 1),
          name: String(item.name ?? ""),
          stream: String(item.stream ?? ""),
          status: String(item.status ?? "active"),
          description: String(item?.description ?? ""),
        })
      );

      setData(formattedSections);
    }
  }, [sections]);

  const filtered = data.filter(
    (section) =>
      section.name.toLowerCase().includes(search.toLowerCase()) ||
      section.stream.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filtered.slice((page - 1) * 10, page * 10);

  const handleDelete = async () => {
    if (!deleteItem) return;

    await deletesection(deleteItem.id!);
    setDeleteItem(null);
    await loadSections(statusFilter);
  };

  const handleRestore = async () => {
    if (!restoreItem) return;

    await restoresection(restoreItem.id!);
    setRestoreItem(null);
    await loadSections(statusFilter);
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;

    await hardDeletesection(permanentDeleteItem.id!);
    setPermanentDeleteItem(null);
    await loadSections(statusFilter);
  };

  const handleEdit = async (values: FormValues) => {
    if (!editItem) return;
    const payload = {
      id: editItem.id,
      name: String(values.name),
      stream: String(values.stream),
      status: String(values.status) || "active",
      description: String(values.description)
    }
    await updatesection(payload)

    setEditItem(null);
    await loadSections(statusFilter);
  };

  const handleAdd = async (values: FormValues) => {
    const payload = {
      name: String(values.name),
      stream: String(values.stream),
      status: String(values.status) || "active",
      description: String(values.description)
    };
    
    await addsection(payload);
    setAddOpen(false);
    await loadSections(statusFilter);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSection = data.find((section) => section.id === rowId);

    if (selectedSection) {
      // Only allow editing for non-trashed items
      if (statusFilter !== "trash") {
        setEditItem(selectedSection);
      }
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSection = data.find((section) => section.id === rowId);

    if (selectedSection) {
      if (statusFilter === "trash") {
        // In trash, show permanent delete option
        setPermanentDeleteItem(selectedSection);
      } else {
        // Normal view, soft delete
        setDeleteItem(selectedSection);
      }
    }
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSection = data.find((section) => section.id === rowId);

    if (selectedSection) {
      setRestoreItem(selectedSection);
    }
  };

  const editInitialValues: FormValues | undefined = editItem
    ? {
      name: editItem.name,
      stream: editItem.stream,
      status: editItem.status,
      description: editItem.description,
    }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Sections" }]} />

      <PageHeader
        title="Sections"
        description={`${data.length} section records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
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
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="sections-search"
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
            Showing {paginatedData.length} of {filtered.length} sections
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
        title="Add New Section"
        fields={fields}
        submitLabel="Add Section"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Section"
        fields={fields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Section"
        description={`Are you sure you want to move "${deleteItem?.name ?? ""
          }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={!!restoreItem}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Section"
        description={`Are you sure you want to restore "${restoreItem?.name ?? ""
          }"? It will be moved back to the active list.`}
        confirmLabel="Restore Section"
      />

      <ConfirmModal
        isOpen={!!permanentDeleteItem}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Section"
        description={`Are you sure you want to permanently delete "${permanentDeleteItem?.name ?? ""
          }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
};

export default Sections;