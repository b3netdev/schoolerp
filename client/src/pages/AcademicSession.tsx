import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Modal } from "@/components/common/Modal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import useAcademicSession from "@/hooks/useAcademicSession";
import { useAppSelector } from "../../redux/hooks";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

type AcademicSessionItem = {
  id?: number;
  name: string;
  start_date: Date;
  end_date: Date;
  status: string;
  description: string;
};

const columns: Column[] = [
  { key: "name", label: "Session Name", type: "avatar-text" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
];

const fields: FieldDef[] = [
  {
    key: "name",
    label: "Session Name",
    required: true,
    placeholder: "Enter session name",
  },
  {
    key: "start_date",
    label: "Start Date",
    required: true,
    type: "date",
  },
  {
    key: "end_date",
    label: "End Date",
    required: true,
    type: "date",
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
    placeholder: "Enter session description",
    type: "textarea",
  },
];

type StatusFilter = "all" | "active" | "inactive" | "trash";

type StatusFilterOption = {
  value: StatusFilter;
  label: string;
};

const buttonGroup: StatusFilterOption[] = [
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

const AcademicSession = () => {
  const { getAcademicSessions, addAcademicSession, updateAcademicSession, deleteAcademicSession, restoreAcademicSession, permanentDeleteAcademicSession } = useAcademicSession();

  const [data, setData] = useState<AcademicSessionItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isLoading, setIsLoading] = useState(true);

const loadAcademicSessions = async (filter: StatusFilter) => {
  try {
    setIsLoading(true);
    await getAcademicSessions(filter);
  } catch (error) {
    console.error("Failed to fetch academic sessions:", error);
  } finally {
    setIsLoading(false);
  }
};

  const academicSessions = useAppSelector(
  (state) => (state as any).academicSession?.academicSessions
);

console.log("Academic Sessions from Redux Store:", academicSessions); // Debugging line

  const [editItem, setEditItem] = useState<AcademicSessionItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AcademicSessionItem | null>(null);
  const [restoreItem, setRestoreItem] = useState<AcademicSessionItem | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<AcademicSessionItem | null>(null);
  const [viewItem, setViewItem] = useState<AcademicSessionItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    void loadAcademicSessions("all");
    // getAcademicSessions("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        name: String(item.name ?? ""),
        start_date: item.start_date ? new Date(item.start_date) : new Date(),
        end_date: item.end_date ? new Date(item.end_date) : new Date(),
        status: String(item.status ?? "active"),
        description: String(item.description ?? ""),
      })
    );

  setData(formattedSessions);
}, [academicSessions]);

  const selectTabe = async (item: StatusFilterOption) => {
    setStatusFilter(item.value);
    setPage(1);

    await loadAcademicSessions(item.value);
  };

  const filtered = data.filter(
    (sessionItem) => {
      const keyword = search.toLowerCase();
      
      return (
        sessionItem.name.toLowerCase().includes(keyword) ||
        sessionItem.status.toLowerCase().includes(keyword) ||
        sessionItem.description.toLowerCase().includes(keyword)
      );
    }
  );

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage).map(item => ({
    ...item,
    start_date: item.start_date instanceof Date ? item.start_date.toLocaleDateString() : item.start_date,
    end_date: item.end_date instanceof Date ? item.end_date.toLocaleDateString() : item.end_date,
  }));

  const handleDelete = async () => {
    if (!deleteItem?.id) return;

    try {
      await deleteAcademicSession(deleteItem.id);

      // Refresh the currently selected list
      await loadAcademicSessions(statusFilter);
    } catch (error) {
      console.error("Failed to delete academic session:", error);
    } finally {
      setDeleteItem(null);
    }
  };

  const handleRestore = async () => {
    if (restoreItem) {
      const result = await restoreAcademicSession(restoreItem.id!);
      setRestoreItem(null);
      
      // If restore was successful, refresh the list
      if (result) {
        await loadAcademicSessions(statusFilter);
      }
    }
  };

  const handlePermanentDelete = async () => {
    if (permanentDeleteItem) {
      await permanentDeleteAcademicSession(permanentDeleteItem.id!);
      setPermanentDeleteItem(null);
      // Refresh the list after permanent delete
      await loadAcademicSessions(statusFilter);
    }
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setRestoreItem(selectedSession);
    }
  };

  const handlePermanentDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setPermanentDeleteItem(selectedSession);
    }
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem) return;

    const payload = {
      id: editItem.id,
      name: values.name,
      start_date: values.start_date,
      end_date: values.end_date,
      status: values.status || "active",
      description: values.description,
    };

    await updateAcademicSession(payload);

    setEditItem(null);
  };

  const handleAdd = async (values: Record<string, string>) => {
    const payload = {
      name: values.name,
      start_date: values.start_date,
      end_date: values.end_date,
      status: values.status || "active",
      description: values.description,
    };

    setAddOpen(false);

    await addAcademicSession(payload);
    await loadAcademicSessions(statusFilter);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setEditItem(selectedSession);
    }
  };

  const handleViewClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setViewItem(selectedSession);
    }
  };

  const handleDeleteClick = async (row: Record<string, unknown>) => {
    // console.log("Delete clicked for row:", row);
    // return
    
    const rowId = Number(row.id);
    const selectedSession = data.find((sessionItem) => sessionItem.id === rowId);

    if (selectedSession) {
      setDeleteItem(selectedSession);
    }
  };

  const editInitialValues: Record<string, string> | undefined = editItem
    ? {
      name: editItem.name,
      start_date: editItem.start_date instanceof Date ? editItem.start_date.toISOString().split('T')[0] : '',
      end_date: editItem.end_date instanceof Date ? editItem.end_date.toISOString().split('T')[0] : '',
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
            data-testid="add-academic-session-btn"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Academic Session
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative w-full lg:max-w-sm">
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
              data-testid="academic-sessions-search"
            />
          </div>

          <ButtonGroup className="lg:ml-auto">
            {buttonGroup.map((item) => (
              <Button
                key={item.value}
                className="cursor-pointer"
                variant={statusFilter === item.value ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={() => selectTabe(item)}
              >
                {item.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={10} />
          ) : (
          <DataTable
            columns={columns}
            data={paginatedData as Record<string, unknown>[]}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onDelete={statusFilter !== "trash" ? handleDeleteClick : undefined}
            onRestore={statusFilter === "trash" ? handleRestoreClick : undefined}
            onPermanentDelete={statusFilter === "trash" ? handlePermanentDeleteClick : undefined}
          />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filtered.length} academic sessions
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
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Academic Session"
        fields={fields}
        submitLabel="Add Academic Session"
      />

      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Academic Session Details"
        size="lg"
      >
        {viewItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Session Name
                </label>
                <p className="mt-1 text-sm text-foreground">{viewItem.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </label>
                <p className="mt-1 text-sm text-foreground capitalize">{viewItem.status}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Start Date
                </label>
                <p className="mt-1 text-sm text-foreground">
                  {viewItem.start_date instanceof Date
                    ? viewItem.start_date.toLocaleDateString()
                    : viewItem.start_date}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  End Date
                </label>
                <p className="mt-1 text-sm text-foreground">
                  {viewItem.end_date instanceof Date
                    ? viewItem.end_date.toLocaleDateString()
                    : viewItem.end_date}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </label>
              <p className="mt-1 text-sm text-foreground">
                {viewItem.description || "No description provided"}
              </p>
            </div>
          </div>
        )}
      </Modal>

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
        description={`Are you sure you want to remove "${deleteItem?.name ?? ""
          }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Academic Session"
      />

      <ConfirmModal
        isOpen={!!restoreItem}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Academic Session"
        description={`Are you sure you want to restore "${restoreItem?.name ?? ""
          }"? This will move it back to active sessions.`}
        confirmLabel="Restore Academic Session"
      />

      <ConfirmModal
        isOpen={!!permanentDeleteItem}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Academic Session"
        description={`Are you sure you want to permanently delete "${permanentDeleteItem?.name ?? ""
          }"? This action cannot be undone and will remove all data permanently.`}
        confirmLabel="Permanently Delete"
      />
    </div>
  );
};

export default AcademicSession;