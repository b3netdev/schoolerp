import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";

type ClassSectionRelationItem = {
  id?: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  teacher_id: number;
  teacher_name: string;
};

type OptionItem = {
  id: number;
  label: string;
};

const demoClasses: OptionItem[] = [
  { id: 1, label: "Class One" },
  { id: 2, label: "Class Two" },
  { id: 3, label: "Class Three" },
  { id: 4, label: "Class Four" },
  { id: 5, label: "Class Five" },
];

const demoSections: OptionItem[] = [
  { id: 1, label: "Section A" },
  { id: 2, label: "Section B" },
  { id: 3, label: "Section C" },
  { id: 4, label: "Science" },
  { id: 5, label: "Commerce" },
];

const demoTeachers: OptionItem[] = [
  { id: 1, label: "Tuhin Roy" },
  { id: 2, label: "Ananya Sen" },
  { id: 3, label: "Rahul Sharma" },
  { id: 4, label: "Moumita Das" },
  { id: 5, label: "Amit Mukherjee" },
];

const columns: Column[] = [
  { key: "class_name", label: "Class", type: "avatar-text" },
  { key: "section_name", label: "Section" },
  { key: "teacher_name", label: "Teacher" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  {
    key: "class_id",
    label: "Class",
    type: "select",
    required: true,
    options: demoClasses.map((item) => `${item.id} - ${item.label}`),
  },
  {
    key: "section_id",
    label: "Section",
    type: "select",
    required: true,
    options: demoSections.map((item) => `${item.id} - ${item.label}`),
  },
  {
    key: "teacher_id",
    label: "Teacher",
    type: "select",
    required: true,
    options: demoTeachers.map((item) => `${item.id} - ${item.label}`),
  },
];

const initialRelations: ClassSectionRelationItem[] = [
  {
    id: 1,
    class_id: 1,
    class_name: "Class One",
    section_id: 1,
    section_name: "Section A",
    teacher_id: 1,
    teacher_name: "Tuhin Roy",
  },
  {
    id: 2,
    class_id: 2,
    class_name: "Class Two",
    section_id: 2,
    section_name: "Section B",
    teacher_id: 2,
    teacher_name: "Ananya Sen",
  },
];

function parseOptionId(value: string): number {
  return Number(value.split(" - ")[0]);
}

function findOptionLabel(list: OptionItem[], id: number): string {
  return list.find((item) => item.id === id)?.label || "";
}

function makeOptionValue(id: number, label: string): string {
  return `${id} - ${label}`;
}

function buildRelationPayload(
  values: Record<string, string>
): Omit<ClassSectionRelationItem, "id"> {
  const classId = parseOptionId(values.class_id);
  const sectionId = parseOptionId(values.section_id);
  const teacherId = parseOptionId(values.teacher_id);

  return {
    class_id: classId,
    class_name: findOptionLabel(demoClasses, classId),

    section_id: sectionId,
    section_name: findOptionLabel(demoSections, sectionId),

    teacher_id: teacherId,
    teacher_name: findOptionLabel(demoTeachers, teacherId),
  };
}

export default function ClassSectionRelation() {
  const [data, setData] =
    useState<ClassSectionRelationItem[]>(initialRelations);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editItem, setEditItem] =
    useState<ClassSectionRelationItem | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<ClassSectionRelationItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const itemsPerPage = 10;

  const filtered = data.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      item.class_name.toLowerCase().includes(keyword) ||
      item.section_name.toLowerCase().includes(keyword) ||
      item.teacher_name.toLowerCase().includes(keyword)
    );
  });

  const paginatedData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const handleAdd = async (values: Record<string, string>) => {
    const payload = buildRelationPayload(values);

    const newRelation: ClassSectionRelationItem = {
      id: Date.now(),
      ...payload,
    };

    setData((prev) => [newRelation, ...prev]);
    setAddOpen(false);
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem) return;

    const payload = buildRelationPayload(values);

    const updatedRelation: ClassSectionRelationItem = {
      ...editItem,
      ...payload,
    };

    setData((prev) =>
      prev.map((item) =>
        item.id === editItem.id ? updatedRelation : item
      )
    );

    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;

    setData((prev) => prev.filter((item) => item.id !== deleteItem.id));
    setDeleteItem(null);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedItem = data.find((item) => item.id === rowId);

    if (selectedItem) {
      setEditItem(selectedItem);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);
    const selectedItem = data.find((item) => item.id === rowId);

    if (selectedItem) {
      setDeleteItem(selectedItem);
    }
  };

  const editInitialValues: Record<string, string> | undefined = editItem
    ? {
        class_id: makeOptionValue(editItem.class_id, editItem.class_name),
        section_id: makeOptionValue(editItem.section_id, editItem.section_name),
        teacher_id: makeOptionValue(editItem.teacher_id, editItem.teacher_name),
      }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Class Section Relation" }]} />

      <PageHeader
        title="Class Section Relation"
        description={`${data.length} class-section-teacher records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-class-section-relation-btn"
          >
            <Plus className="w-4 h-4" />
            Add Relation
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search class, section, teacher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="class-section-relation-search"
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
            Showing {paginatedData.length} of {filtered.length} records
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
        title="Add Class Section Relation"
        fields={fields}
        submitLabel="Add Relation"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Class Section Relation"
        fields={fields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Relation"
        description={`Are you sure you want to remove "${
          deleteItem
            ? `${deleteItem.class_name} - ${deleteItem.section_name} - ${deleteItem.teacher_name}`
            : ""
        }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Relation"
      />
    </div>
  );
}