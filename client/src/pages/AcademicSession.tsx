import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import useAcademicSession from "@/hooks/useAcademicSession";
import { useAppSelector } from "../../redux/hooks";

type AcademicSessionItem = {
  id?: number;
  session_name: string;
  status: string;
  description: string;
};

const columns: Column[] = [
  { key: "session_name", label: "Session Name", type: "avatar-text" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
];

const fields: FieldDef[] = [
  {
    key: "session_name",
    label: "Session Name",
    required: true,
    placeholder: "2023-2024",
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

const AcademicSession = () => {
  const { getAcademicSessions, addAcademicSession, updateAcademicSession } = useAcademicSession();

  const [data, setData] = useState<AcademicSessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const academicSessions = useAppSelector(
  (state) => (state as any).academicSessions?.data
);

  const [editItem, setEditItem] = useState<AcademicSessionItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AcademicSessionItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    getAcademicSessions();
  }, []);

   useEffect(() => {
  const sessions = Array.isArray(academicSessions)
    ? academicSessions
    : [];

  const formattedSessions: AcademicSessionItem[] =
    sessions.map(
      (
        item: Partial<AcademicSessionItem>,
        index: number
      ) => ({
        id: Number(item.id ?? index + 1),
        session_name: String(
          item.session_name ?? ""
        ),
        status: String(item.status ?? "active"),
        description: String(
          item.description ?? ""
        ),
      })
    );

  setData(formattedSessions);
}, [academicSessions]);

  const filtered = data.filter(
    (sessionItem) =>
      sessionItem.session_name.toLowerCase().includes(search.toLowerCase()) ||
      sessionItem.status.toLowerCase().includes(search.toLowerCase()) ||
      sessionItem.description.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedData = filtered.slice((page - 1) * 10, page * 10);

  const handleDelete = () => {
    if (!deleteItem) return;

    setData((prev) =>
      prev.filter((sessionItem) => sessionItem.id !== deleteItem.id)
    );

    setDeleteItem(null);
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem) return;

    const payload = {
      id: editItem.id,
      session_name: values.session_name,
      status: values.status || "active",
      description: values.description,
    };

    await updateAcademicSession(payload);

    setEditItem(null);
  };

  const handleAdd = async (values: Record<string, string>) => {
    const payload = {
      session_name: values.session_name,
      status: values.status || "active",
      description: values.description,
    };

    setAddOpen(false);

    await addAcademicSession(payload);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setEditItem(selectedSession);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setDeleteItem(selectedSession);
    }
  };

  const editInitialValues: Record<string, string> | undefined = editItem
    ? {
      session_name: editItem.session_name,
      status: editItem.status,
      description: editItem.description,
    }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Academic Sessions" }]} />

      <PageHeader
        title="Academic Sessions"
        description={`${data.length} academic session records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-class-btn"
          >
            <Plus className="w-4 h-4" />
            Add Academic Session
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search academic sessions..."
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
            Showing {paginatedData.length} of {filtered.length} academic sessions
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
        title="Add New Academic Session"
        fields={fields}
        submitLabel="Add Academic Session"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Academic Session"
        fields={fields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Academic Session"
        description={`Are you sure you want to remove "${deleteItem?.session_name ?? ""
          }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Academic Session"
      />
    </div>
  );
};

export default AcademicSession;