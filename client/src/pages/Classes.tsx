import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import useClass from "@/hooks/useClass";
import { useAppSelector } from "../../redux/hooks";

type ClassItem = {
  id?: number;
  class_name: string;
  status: string;
  description: string;
};

const columns: Column[] = [
  { key: "class_name", label: "Class Name", type: "avatar-text" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
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
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    key: "description",
    label: "Description",
    required: false,
    placeholder: "Enter class description",
    type: "textarea",
  },
];

const Classes = () => {
  const { getClasses, addclass, updateclass } = useClass();

  const [data, setData] = useState<ClassItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { classes } = useAppSelector((state) => state.class);

  const [editItem, setEditItem] = useState<ClassItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<ClassItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getClasses();
  }, []);

  useEffect(() => {
    if (Array.isArray(classes)) {
      const formattedClasses: ClassItem[] = classes.map(
        (item: Partial<ClassItem>, index: number) => ({
          id: Number(item.id ?? index + 1),
          class_name: String(item.class_name ?? ""),
          status: String(item.status ?? "active"),
          description: String(item.description ?? ""),
        })
      );

      setData(formattedClasses);
    }
  }, [classes]);

  const filtered = data.filter(
    (classItem) =>
      classItem.class_name.toLowerCase().includes(search.toLowerCase()) ||
      classItem.status.toLowerCase().includes(search.toLowerCase()) ||
      classItem.description.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filtered.slice((page - 1) * 10, page * 10);

  const handleDelete = () => {
    if (!deleteItem) return;

    setData((prev) =>
      prev.filter((classItem) => classItem.id !== deleteItem.id)
    );

    setDeleteItem(null);
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem) return;

    const payload = {
      id: editItem.id,
      class_name: values.class_name,
      status: values.status || "active",
      description: values.description,
    };

    await updateclass(payload);

    setEditItem(null);
  };

  const handleAdd = async (values: Record<string, string>) => {
    const payload = {
      class_name: values.class_name,
      status: values.status || "active",
      description: values.description,
    };

    setAddOpen(false);

    await addclass(payload);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedClass = data.find((classItem) => classItem.id === rowId);

    if (selectedClass) {
      setEditItem(selectedClass);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedClass = data.find((classItem) => classItem.id === rowId);

    if (selectedClass) {
      setDeleteItem(selectedClass);
    }
  };

  const editInitialValues: Record<string, string> | undefined = editItem
    ? {
      class_name: editItem.class_name,
      status: editItem.status,
      description: editItem.description,
    }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Classes" }]} />

      <PageHeader
        title="Classes"
        description={`${data.length} class records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
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
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="classes-search"
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
            Showing {paginatedData.length} of {filtered.length} classes
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
        title="Add New Class"
        fields={fields}
        submitLabel="Add Class"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Class"
        fields={fields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        description={`Are you sure you want to remove "${deleteItem?.class_name ?? ""
          }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Class"
      />
    </div>
  );
};

export default Classes;