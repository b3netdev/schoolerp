import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { ProfileInfoCard } from "@/components/profile/ProfileInfoCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { teachers as initialTeachers } from "@/data/dummyData";
import { BookOpen } from "lucide-react";

type Teacher = typeof initialTeachers[0];

const columns: Column[] = [
  { key: "name", label: "Teacher", type: "avatar-text" },
  { key: "subject", label: "Subject" },
  { key: "classAssigned", label: "Class Assigned" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "status", label: "Status", type: "badge" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Full Name", required: true, placeholder: "e.g. Dr. Alan Turing" },
  {
    key: "subject", label: "Subject", type: "select", required: true,
    options: ["Mathematics", "Physics", "Biology", "English Literature", "Computer Science", "History", "Art & Design", "Health Sciences", "Programming", "Environmental Science"],
  },
  {
    key: "classAssigned", label: "Class Assigned", type: "select",
    options: ["Grade 9A", "Grade 9B", "Grade 10A", "Grade 10B", "Grade 11A", "Grade 11B", "Grade 12A", "Grade 12B"],
  },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0000" },
  { key: "email", label: "Email", type: "email", placeholder: "teacher@school.edu" },
  {
    key: "status", label: "Status", type: "select",
    options: ["Active", "Inactive"],
  },
];

function makeInitials(name: string): string {
  return name.replace(/^Dr\.\s*/i, "").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Teachers() {
  const [data, setData] = useState<Teacher[]>(initialTeachers);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<Teacher | null>(null);
  const [editItem, setEditItem] = useState<Teacher | null>(null);
  const [deleteItem, setDeleteItem] = useState<Teacher | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = data.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (values: Record<string, string>) => {
    const newTeacher: Teacher = {
      id: Date.now(),
      name: values.name,
      subject: values.subject,
      classAssigned: values.classAssigned,
      phone: values.phone,
      email: values.email,
      status: values.status || "Active",
      initials: makeInitials(values.name),
    };
    setData(prev => [newTeacher, ...prev]);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;
    setData(prev =>
      prev.map(t =>
        t.id === editItem.id
          ? { ...t, ...values, initials: makeInitials(values.name) }
          : t
      )
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData(prev => prev.filter(t => t.id !== deleteItem.id));
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Teachers" }]} />
      <PageHeader
        title="Teachers"
        description={`${data.length} teaching staff members`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-teacher-btn"
          >
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search teachers..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="teachers-search"
            />
          </div>
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            onView={row => setViewItem(row as unknown as Teacher)}
            onEdit={row => setEditItem(row as unknown as Teacher)}
            onDelete={row => setDeleteItem(row as unknown as Teacher)}
          />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {data.length} teachers
          </span>
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
        </div>
      </div>

      {/* View profile */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Teacher Profile" size="sm">
        {viewItem && (
          <ProfileInfoCard
            name={viewItem.name}
            role={viewItem.subject}
            email={viewItem.email}
            phone={viewItem.phone}
            status={viewItem.status}
            initials={viewItem.initials}
            extra={[
              { icon: <BookOpen className="w-4 h-4" />, label: "Class Assigned", value: viewItem.classAssigned },
            ]}
          />
        )}
      </Modal>

      {/* Add */}
      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Teacher"
        fields={fields}
        submitLabel="Add Teacher"
      />

      {/* Edit */}
      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Teacher"
        fields={fields}
        initialValues={editItem as unknown as Record<string, string>}
        submitLabel="Save Changes"
      />

      {/* Delete */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        description={`Are you sure you want to remove "${deleteItem?.name}" from the system? This action cannot be undone.`}
        confirmLabel="Delete Teacher"
      />
    </div>
  );
}
