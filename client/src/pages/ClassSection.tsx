import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { useAppSelector } from "../../redux/hooks";
import useClassSection from "@/hooks/useClassSection";
import useTeacher from "@/hooks/useTeacher";
import useSection from "@/hooks/useSection";
import useClass from "@/hooks/useClass";

type ClassSectionRelationItem = {
  id: number;

  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id: number;
  teacher_name: string;
  employee_code?: string | null;

  created_at?: string;
  updated_at?: string;
};

type OptionItem = {
  id: number;
  label: string;
};

const columns: Column[] = [
  { key: "class_name", label: "Class", type: "avatar-text" },
  { key: "section_name", label: "Section" },
  { key: "teacher_name", label: "Teacher" },
  { key: "actions", label: "Actions", type: "actions" },
];

function findOptionIdByLabel(list: OptionItem[], label: string): number {
  const selectedItem = list.find((item) => item.label === label);

  return selectedItem ? selectedItem.id : 0;
}

function findOptionLabel(list: OptionItem[], id: number): string {
  return list.find((item) => item.id === id)?.label || "";
}

function makeOptionValue(id: number, label: string): string {
  return label;
}

export default function ClassSectionRelation() {
  const {
    getClassSections,
    addClassSection,
    updateClassSection,
    deleteClassSection,
  } = useClassSection();
  const {
    getTeachers,
  } = useTeacher();
  const { getSection } = useSection();
  const { getClasses } = useClass();

  const { teachers } = useAppSelector((state) => state.teacher);
  const { sections } = useAppSelector((state) => state.section);
  const { classes } = useAppSelector((state) => state.class);


  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection
  );



  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editItem, setEditItem] =
    useState<ClassSectionRelationItem | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<ClassSectionRelationItem | null>(null);

  const [addOpen, setAddOpen] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    getClassSections();
    getTeachers("active");
    getSection();
    getClasses()
  }, []);

  const classOptions: OptionItem[] = classes.map((item) => ({
    id: Number(item.id),
    label: String(item.class_name ?? ""),
  }));

  const sectionOptions: OptionItem[] = sections.map((item) => ({
    id: Number(item.id),
    label: item.stream
      ? `${item.name} (${item.stream})`
      : String(item.name ?? ""),
  }));

  const teacherOptions: OptionItem[] = teachers.map((item) => ({
    id: Number(item.id),
    label: `${item.first_name} ${item.last_name || ""}${item.employee_code ? ` (${item.employee_code})` : ""
      }`.trim(),
  }));

  const fields: FieldDef[] = [
    {
      key: "class_id",
      label: "Class",
      type: "select",
      required: true,
      options: classOptions.map((item) => makeOptionValue(item.id, item.label)),
    },
    {
      key: "section_id",
      label: "Section",
      type: "select",
      required: true,
      options: sectionOptions.map((item) =>
        makeOptionValue(item.id, item.label)
      ),
    },
    {
      key: "teacher_id",
      label: "Teacher",
      type: "select",
      required: true,
      options: teacherOptions.map((item) =>
        makeOptionValue(item.id, item.label)
      ),
    },
  ];
  const buildRelationPayload = (values: Record<string, string>) => {
    const classId = findOptionIdByLabel(classOptions, values.class_id);
    const sectionId = findOptionIdByLabel(sectionOptions, values.section_id);
    const teacherId = findOptionIdByLabel(teacherOptions, values.teacher_id);

    return {
      class_id: classId,
      section_id: sectionId,
      teacher_id: teacherId,
    };
  };
  const filtered = classSectionRelations.filter((item) => {
    const keyword = search.toLowerCase();

    return (
      String(item.class_name ?? "").toLowerCase().includes(keyword) ||
      String(item.section_name ?? "").toLowerCase().includes(keyword) ||
      String(item.teacher_name ?? "").toLowerCase().includes(keyword)
    );
  });

  const paginatedData = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const handleAdd = async (values: Record<string, string>) => {
    const payload = buildRelationPayload(values);
    console.log(payload, "PAYLOAD")

    const result = await addClassSection(payload);

    if (result) {
      setAddOpen(false);
    }
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem) return;

    const payload = {
      id: editItem.id,
      ...buildRelationPayload(values),
    };

    const result = await updateClassSection(payload);

    if (result) {
      setEditItem(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    const result = await deleteClassSection(deleteItem.id);

    if (result) {
      setDeleteItem(null);
    }
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);

    const selectedItem = classSectionRelations.find(
      (item) => item.id === rowId
    );

    if (selectedItem) {
      setEditItem(selectedItem as ClassSectionRelationItem);
    }
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const rowId = Number(row.id);

    const selectedItem = classSectionRelations.find(
      (item) => item.id === rowId
    );

    if (selectedItem) {
      setDeleteItem(selectedItem as ClassSectionRelationItem);
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
        description={`${classSectionRelations.length} class-section-teacher records`}
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
            data={paginatedData.map((item) => ({
              id: item.id,
              class_id: item.class_id,
              class_name: item.class_name,
              section_id: item.section_id,
              section_name: item.section_name,
              teacher_id: item.teacher_id,
              teacher_name: item.teacher_name,
              employee_code: item.employee_code,
              created_at: item.created_at,
              updated_at: item.updated_at,
            }))}
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
        description={`Are you sure you want to remove "${deleteItem
          ? `${deleteItem.class_name} - ${deleteItem.section_name} - ${deleteItem.teacher_name}`
          : ""
          }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Relation"
      />
    </div>
  );
}