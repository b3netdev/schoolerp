import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { parents as initialParents } from "@/data/dummyData";
import useSection from "@/hooks/useSection";
import { useAppSelector } from "../../redux/hooks";

type Section = {
  id?: number;
  name: string;
  stream: string;
};

const columns: Column[] = [
  { key: "name", label: "Section Name", type: "avatar-text" },
  { key: "stream", label: "Stream Name" },
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
    required: true,
    placeholder: "Nursery",
  },
];

const initialSections: Section[] = (
  initialParents as unknown as Array<Partial<Section>>
).map((item, index) => ({
  id: Number(item.id ?? index + 1),
  name: String(item.name ?? ""),
  stream: String(item.stream ?? ""),
}));

const Sections = () => {
  const { getSection, addsection } = useSection();

  const [data, setData] = useState<Section[]>(initialSections);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { sections } = useAppSelector((state) => state.section);

  const [editItem, setEditItem] = useState<Section | null>(null);
  const [deleteItem, setDeleteItem] = useState<Section | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getSection();
  }, []);

  useEffect(() => {
    if (Array.isArray(sections) && sections.length > 0) {
      const formattedSections: Section[] = sections.map(
        (item: Partial<Section>, index: number) => ({
          id: Number(item.id ?? index + 1),
          name: String(item.name ?? ""),
          stream: String(item.stream ?? ""),
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

  const handleDelete = () => {
    if (!deleteItem) return;

    setData((prev) => prev.filter((section) => section.id !== deleteItem.id));
    setDeleteItem(null);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;

    setData((prev) =>
      prev.map((section) =>
        section.id === editItem.id
          ? {
              ...section,
              name: values.name,
              stream: values.stream,
            }
          : section
      )
    );

    setEditItem(null);
  };

  const handleAdd = async (values: Record<string, string>) => {
    const payload = {
    name: values.name,
    stream: values.stream,
  };
    const newSection: Section = {
      id: Date.now(),
      name: values.name,
      stream: values.stream,
    };

    setData((prev) => [newSection, ...prev]);
    setAddOpen(false);

    await addsection(payload);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSection = data.find((section) => section.id === rowId);

    if (selectedSection) {
      setEditItem(selectedSection);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSection = data.find((section) => section.id === rowId);

    if (selectedSection) {
      setDeleteItem(selectedSection);
    }
  };

  const editInitialValues: Record<string, string> | undefined = editItem
    ? {
        name: editItem.name,
        stream: editItem.stream,
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
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={paginatedData as Record<string, unknown>[]}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
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
        description={`Are you sure you want to remove "${
          deleteItem?.name ?? ""
        }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Section"
      />
    </div>
  );
};

export default Sections;