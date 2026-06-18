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
import { students as initialStudents } from "@/data/dummyData";
import { BookOpen, Users } from "lucide-react";

type Student = typeof initialStudents[0];

const columns: Column[] = [
  { key: "name", label: "Student", type: "avatar-text" },
  { key: "rollNo", label: "Roll No" },
  { key: "class", label: "Class" },
  { key: "section", label: "Section" },
  { key: "parentName", label: "Parent Name" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status", type: "badge" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Full Name", required: true, placeholder: "e.g. Alice Johnson" },
  { key: "rollNo", label: "Roll No", required: true, placeholder: "e.g. S101" },
  {
    key: "class", label: "Class", type: "select", required: true,
    options: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
  },
  {
    key: "section", label: "Section", type: "select", required: true,
    options: ["A", "B", "C"],
  },
  { key: "parentName", label: "Parent Name", required: true },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0000" },
  { key: "email", label: "Email", type: "email", placeholder: "student@example.com" },
  {
    key: "status", label: "Status", type: "select",
    options: ["Active", "Inactive"],
  },
];

function makeInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Students() {
  const [data, setData] = useState<Student[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<Student | null>(null);
  const [editItem, setEditItem] = useState<Student | null>(null);
  const [deleteItem, setDeleteItem] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = data.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (values: Record<string, string>) => {
    const newStudent: Student = {
      id: Date.now(),
      name: values.name,
      rollNo: values.rollNo,
      class: values.class,
      section: values.section,
      parentName: values.parentName,
      phone: values.phone,
      email: values.email,
      status: values.status || "Active",
      initials: makeInitials(values.name),
    };
    setData(prev => [newStudent, ...prev]);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;
    setData(prev =>
      prev.map(s =>
        s.id === editItem.id
          ? { ...s, ...values, initials: makeInitials(values.name) }
          : s
      )
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData(prev => prev.filter(s => s.id !== deleteItem.id));
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Students" }]} />
      <PageHeader
        title="Students"
        description={`${data.length} students enrolled`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-student-btn"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="students-search"
            />
          </div>
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            onView={row => setViewItem(row as unknown as Student)}
            onEdit={row => setEditItem(row as unknown as Student)}
            onDelete={row => setDeleteItem(row as unknown as Student)}
          />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {data.length} students
          </span>
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
        </div>
      </div>

      {/* View profile */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Student Profile" size="sm">
        {viewItem && (
          <ProfileInfoCard
            name={viewItem.name}
            role={`${viewItem.class} — Section ${viewItem.section}`}
            email={viewItem.email}
            phone={viewItem.phone}
            status={viewItem.status}
            initials={viewItem.initials}
            extra={[
              { icon: <BookOpen className="w-4 h-4" />, label: "Roll Number", value: viewItem.rollNo },
              { icon: <Users className="w-4 h-4" />, label: "Parent", value: viewItem.parentName },
            ]}
          />
        )}
      </Modal>

      {/* Add */}
      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Student"
        fields={fields}
        submitLabel="Add Student"
      />

      {/* Edit */}
      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Student"
        fields={fields}
        initialValues={editItem as unknown as Record<string, string>}
        submitLabel="Save Changes"
      />

      {/* Delete */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to remove "${deleteItem?.name}" from the system? This action cannot be undone.`}
        confirmLabel="Delete Student"
      />
    </div>
  );
}
