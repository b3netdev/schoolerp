import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { parents as initialParents } from "@/data/dummyData";

type Parent = typeof initialParents[0];

const columns: Column[] = [
  { key: "parentName", label: "Parent Name", type: "avatar-text" },
  { key: "studentName", label: "Student Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "relationship", label: "Relationship" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  { key: "parentName", label: "Parent Name", required: true, placeholder: "e.g. Robert Johnson" },
  { key: "studentName", label: "Student Name", required: true, placeholder: "e.g. Alice Johnson" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "555-0000" },
  { key: "email", label: "Email", type: "email", placeholder: "parent@example.com" },
  {
    key: "relationship", label: "Relationship", type: "select",
    options: ["Father", "Mother", "Guardian", "Sibling"],
  },
];

export default function Parents() {
  const [data, setData] = useState<Parent[]>(initialParents);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editItem, setEditItem] = useState<Parent | null>(null);
  const [deleteItem, setDeleteItem] = useState<Parent | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filtered = data.filter(p =>
    p.parentName.toLowerCase().includes(search.toLowerCase()) ||
    p.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (values: Record<string, string>) => {
    const newParent: Parent = {
      id: Date.now(),
      parentName: values.parentName,
      studentName: values.studentName,
      phone: values.phone,
      email: values.email,
      relationship: values.relationship || "Guardian",
    };
    setData(prev => [newParent, ...prev]);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;
    setData(prev =>
      prev.map(p => p.id === editItem.id ? { ...p, ...values } : p)
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData(prev => prev.filter(p => p.id !== deleteItem.id));
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Parents" }]} />
      <PageHeader
        title="Parents"
        description={`${data.length} parent records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-parent-btn"
          >
            <Plus className="w-4 h-4" /> Add Parent
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search parents..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="parents-search"
            />
          </div>
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={filtered.map(p => ({ ...p, name: p.parentName })) as unknown as Record<string, unknown>[]}
            onEdit={row => setEditItem(data.find(p => p.id === (row as unknown as Parent).id) ?? null)}
            onDelete={row => setDeleteItem(data.find(p => p.id === (row as unknown as Parent).id) ?? null)}
          />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {data.length} parents
          </span>
          <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
        </div>
      </div>

      {/* Add */}
      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Parent"
        fields={fields}
        submitLabel="Add Parent"
      />

      {/* Edit */}
      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Parent"
        fields={fields}
        initialValues={editItem as unknown as Record<string, string>}
        submitLabel="Save Changes"
      />

      {/* Delete */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Parent"
        description={`Are you sure you want to remove "${deleteItem?.parentName}" from the system? This action cannot be undone.`}
        confirmLabel="Delete Parent"
      />
    </div>
  );
}
