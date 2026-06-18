import { useState } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { subjects as initialSubjects } from "@/data/dummyData";

type Subject = typeof initialSubjects[0];

const statusOptions = ["All", "Active", "Inactive"];

const columns: Column[] = [
  { key: "name", label: "Subject Name", type: "avatar-text" },
  { key: "code", label: "Code" },
  { key: "teacher", label: "Teacher" },
  { key: "classes", label: "Classes" },
  { key: "maxMarks", label: "Max Marks" },
  { key: "passMarks", label: "Pass Marks" },
  { key: "status", label: "Status", type: "badge" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Subject Name", required: true, placeholder: "e.g. Mathematics" },
  { key: "code", label: "Subject Code", required: true, placeholder: "e.g. MTH101" },
  {
    key: "teacher", label: "Assigned Teacher", type: "select",
    options: ["Marie Curie", "Isaac Newton", "Jane Goodall", "W. Shakespeare", "Dr. A. Turing", "C. Darwin", "L. da Vinci", "F. Nightingale", "Ada Lovelace"],
  },
  {
    key: "classes", label: "Applicable Classes", type: "select",
    options: ["All Grades", "Grade 9–10", "Grade 10–12", "Grade 11–12", "Grade 9–12"],
  },
  { key: "maxMarks", label: "Max Marks", placeholder: "100" },
  { key: "passMarks", label: "Pass Marks", placeholder: "33" },
  { key: "description", label: "Description", placeholder: "Brief description of the subject" },
  {
    key: "status", label: "Status", type: "select",
    options: ["Active", "Inactive"],
  },
];

/** Use a book icon color based on subject name */
const ICON_COLORS = [
  "bg-blue-100 text-blue-600",
  "bg-purple-100 text-purple-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-cyan-100 text-cyan-600",
];

function getIconColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return ICON_COLORS[Math.abs(h) % ICON_COLORS.length];
}

export default function Subjects() {
  const [data, setData] = useState<Subject[]>(initialSubjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [deleteItem, setDeleteItem] = useState<Subject | null>(null);

  const filtered = data.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.teacher.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdd = (values: Record<string, string>) => {
    setData(prev => [
      {
        id: Date.now(),
        name: values.name,
        code: values.code,
        teacher: values.teacher || "Unassigned",
        classes: values.classes || "All Grades",
        maxMarks: Number(values.maxMarks) || 100,
        passMarks: Number(values.passMarks) || 33,
        status: values.status || "Active",
        description: values.description || "",
      },
      ...prev,
    ]);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;
    setData(prev =>
      prev.map(s =>
        s.id === editItem.id
          ? { ...s, ...values, maxMarks: Number(values.maxMarks) || s.maxMarks, passMarks: Number(values.passMarks) || s.passMarks }
          : s
      )
    );
  };

  const handleDelete = () => {
    if (!deleteItem) return;
    setData(prev => prev.filter(s => s.id !== deleteItem.id));
  };

  const activeCount = data.filter(s => s.status === "Active").length;

  return (
    <div>
      <Breadcrumb items={[{ label: "Subjects" }]} />
      <PageHeader
        title="Subjects"
        description={`${activeCount} active subjects across all classes`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-subject-btn"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Subjects", value: data.length, color: "bg-blue-50 border-blue-100 text-blue-700" },
          { label: "Active", value: data.filter(s => s.status === "Active").length, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
          { label: "Inactive", value: data.filter(s => s.status === "Inactive").length, color: "bg-red-50 border-red-100 text-red-700" },
          { label: "Teachers Assigned", value: new Set(data.map(s => s.teacher)).size, color: "bg-purple-50 border-purple-100 text-purple-700" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border px-4 py-3 ${stat.color}`}>
            <p className="text-2xl font-bold leading-none">{stat.value}</p>
            <p className="text-xs mt-1 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Search + filter bar */}
        <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by name, code or teacher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="subject-search"
            />
          </div>
          <div className="flex gap-1">
            {statusOptions.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`subject-filter-${s.toLowerCase()}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-7 h-7" />}
              title="No subjects found"
              description="No subjects match your current search or filter."
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered.map(s => ({
                ...s,
                name: s.name,
                maxMarks: String(s.maxMarks),
                passMarks: String(s.passMarks),
              })) as unknown as Record<string, unknown>[]}
              onEdit={row => setEditItem(data.find(s => s.id === (row as unknown as Subject).id) ?? null)}
              onDelete={row => setDeleteItem(data.find(s => s.id === (row as unknown as Subject).id) ?? null)}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {data.length} subjects
          </span>
        </div>
      </div>

      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Subject"
        fields={fields}
        submitLabel="Add Subject"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Subject"
        fields={fields}
        initialValues={editItem ? { ...editItem, maxMarks: String(editItem.maxMarks), passMarks: String(editItem.passMarks) } : {}}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        description={`Are you sure you want to remove "${deleteItem?.name}" (${deleteItem?.code})? This cannot be undone.`}
        confirmLabel="Delete Subject"
      />
    </div>
  );
}
