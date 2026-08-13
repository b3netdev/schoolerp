import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { DataTable, type Column } from "@/components/tables/DataTable";
import {
  FormModal,
  type FieldDef,
  type FormValues,
} from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import {
  StatusTabs,
  type StatusTabOption,
} from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

import { useAppSelector } from "../../redux/hooks";
import useStudent from "@/hooks/useStudent";
import useClassSection from "@/hooks/useClassSection";

type StudentClassRelationStatusFilter = "all" | "trash";

type StudentClassRelationItem = {
  id: number;
  student_id: number;
  student_name: string;
  student_code: string;

  class_section_id: number;
  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id: number | null;
  teacher_name: string;

  academic_year_id: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type StudentOption = {
  id: number;
  first_name?: string;
  last_name?: string | null;
  student_code?: string;
  status?: string;
  deleted_at?: string | null;
};

type ClassSectionOption = {
  id: number;
  class_name?: string;
  section_name?: string;
  section_stream?: string | null;
  teacher_name?: string | null;
  deleted_at?: string | null;
};

type StudentClassRelationTableRow = StudentClassRelationItem & {
  class_section_name: string;
  display_teacher_name: string;
};

const STUDENT_CLASS_RELATION_API = "/student-class-relation";

const statusTabs: StatusTabOption<StudentClassRelationStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "trash", label: "Trash" },
];

const columns: Column[] = [
  { key: "student_code", label: "Student Code" },
  { key: "student_name", label: "Student", type: "avatar-text" },
  { key: "class_section_name", label: "Class & Section" },
  { key: "display_teacher_name", label: "Class Teacher" },
];

function describeRelation(item: StudentClassRelationItem | null): string {
  if (!item) return "";

  return `${item.student_name} (${item.student_code}) - Class ${item.class_name}, Section ${item.section_name}`;
}

export default function StudentClassRelation() {
  const { getStudents } = useStudent();
  const { getClassSections } = useClassSection();

  const students = useAppSelector(
    (state) => state.student.students,
  ) as StudentOption[];

  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection,
  );

  const [relations, setRelations] = useState<StudentClassRelationItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [statusFilter, setStatusFilter] =
    useState<StudentClassRelationStatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);

  const [editItem, setEditItem] =
    useState<StudentClassRelationItem | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<StudentClassRelationItem | null>(null);

  const [restoreItem, setRestoreItem] =
    useState<StudentClassRelationItem | null>(null);

  const [permanentDeleteItem, setPermanentDeleteItem] =
    useState<StudentClassRelationItem | null>(null);

  const itemsPerPage = 10;

  const loadRelations = async (
    status: StudentClassRelationStatusFilter,
  ) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `${STUDENT_CLASS_RELATION_API}/get-student-class-relations`,
        {
          params: { status },
        },
      );

      setRelations(response.data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch student class relations:", error);
      setRelations([]);
      toast.error("Unable to load student class relations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRelations(statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    void getStudents("active");
    void getClassSections("all");
  }, []);

  const studentOptions = useMemo(() => {
    return students
      .filter(
        (student) =>
          student.status !== "inactive" && !student.deleted_at,
      )
      .map((student) => {
        const fullName =
          `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();

        return {
          value: String(student.id),
          label: `${fullName}${
            student.student_code ? ` (${student.student_code})` : ""
          }`,
        };
      });
  }, [students]);

  const classSectionOptions = useMemo(() => {
    return (classSectionRelations as ClassSectionOption[])
      .filter((item) => !item.deleted_at)
      .map((item) => {
        const stream = item.section_stream
          ? ` (${item.section_stream})`
          : "";

        const teacher = item.teacher_name
          ? ` - ${item.teacher_name}`
          : "";

        return {
          value: String(item.id),
          label: `Class ${item.class_name ?? ""} - Section ${
            item.section_name ?? ""
          }${stream}${teacher}`,
        };
      });
  }, [classSectionRelations]);

  // Student cannot be changed in edit because your backend update API
  // only accepts class_section_id.
  const addFields: FieldDef[] = useMemo(
    () => [
      {
        key: "student_id",
        label: "Student",
        type: "select",
        required: true,
        options: studentOptions,
      },
      {
        key: "class_section_id",
        label: "Class & Section",
        type: "select",
        required: true,
        options: classSectionOptions,
      },
    ],
    [studentOptions, classSectionOptions],
  );

 const editFields: FieldDef[] = useMemo(
  () => [
    {
      key: "student_id",
      label: "Student",
      type: "select",
      required: true,
      options: studentOptions,
    },
    {
      key: "class_section_id",
      label: "Class & Section",
      type: "select",
      required: true,
      options: classSectionOptions,
    },
  ],
  [studentOptions, classSectionOptions],
);

  const tableData: StudentClassRelationTableRow[] = useMemo(() => {
    return relations.map((item) => {
      const stream = item.section_stream
        ? ` (${item.section_stream})`
        : "";

      return {
        ...item,
        class_section_name: `Class ${item.class_name} - Section ${item.section_name}${stream}`,
        display_teacher_name: item.teacher_name || "Not assigned",
      };
    });
  }, [relations]);

  const filteredRelations = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tableData;

    return tableData.filter((item) => {
      return (
        item.student_name.toLowerCase().includes(keyword) ||
        item.student_code.toLowerCase().includes(keyword) ||
        item.class_name.toLowerCase().includes(keyword) ||
        item.section_name.toLowerCase().includes(keyword) ||
        item.display_teacher_name.toLowerCase().includes(keyword)
      );
    });
  }, [search, tableData]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRelations.length / itemsPerPage),
  );

  const paginatedData = filteredRelations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handleAdd = async (values: FormValues) => {
    try {
      const response = await api.post(
        `${STUDENT_CLASS_RELATION_API}/add-student-class-relation`,
        {
          student_id: Number(values.student_id),
          class_section_id: Number(values.class_section_id),
        },
      );

      toast.success(response.data?.message || "Student enrolled successfully.");
      setAddOpen(false);
      await loadRelations(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to enroll student.",
      );
    }
  };

  const handleEdit = async (values: FormValues) => {
    if (!editItem) return;

    try {
      const response = await api.post(
        `${STUDENT_CLASS_RELATION_API}/update-student-class-relation`,
        {
          id: editItem.id,
          class_section_id: Number(values.class_section_id),
        },
      );

      toast.success(response.data?.message || "Student assignment updated.");
      setEditItem(null);
      await loadRelations(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to update assignment.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const response = await api.delete(
        `${STUDENT_CLASS_RELATION_API}/delete-student-class-relation/${deleteItem.id}`,
      );

      toast.success(response.data?.message || "Moved to trash successfully.");
      setDeleteItem(null);
      await loadRelations(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to move record to trash.",
      );
    }
  };

  const handleRestore = async () => {
    if (!restoreItem) return;

    try {
      const response = await api.patch(
        `${STUDENT_CLASS_RELATION_API}/restore-student-class-relation/${restoreItem.id}`,
      );

      toast.success(response.data?.message || "Student assignment restored.");
      setRestoreItem(null);
      await loadRelations(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Unable to restore assignment.",
      );
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;

    try {
      const response = await api.delete(
        `${STUDENT_CLASS_RELATION_API}/hard-delete-student-class-relation/${permanentDeleteItem.id}`,
      );

      toast.success(
        response.data?.message || "Student assignment deleted permanently.",
      );

      setPermanentDeleteItem(null);
      await loadRelations(statusFilter);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to permanently delete assignment.",
      );
    }
  };

  const findRelationFromRow = (row: Record<string, unknown>) => {
    return relations.find((item) => item.id === Number(row.id));
  };

  const editInitialValues: FormValues | undefined = editItem

    ? {
       student_id: String(editItem.student_id),
        class_section_id: String(editItem.class_section_id),
      }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Student Class Relation" }]} />

      <PageHeader
        title="Student Class Relation"
        description={`${relations.length} student class records`}
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            data-testid="add-student-class-relation-btn"
          >
            <Plus className="h-4 w-4" />
            Enroll Student
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search student, class, section..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="student-class-relation-search"
              />
            </div>

            <StatusTabs
              options={statusTabs}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              disabled={isLoading}
              className="lg:ml-auto"
            />
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={itemsPerPage} />
          ) : (
            <DataTable
              columns={columns}
              data={
                paginatedData as unknown as Record<string, unknown>[]
              }
              onEdit={
                statusFilter === "all"
                  ? (row) => {
                      const item = findRelationFromRow(row);
                      if (item) setEditItem(item);
                    }
                  : undefined
              }
              onDelete={
                statusFilter === "all"
                  ? (row) => {
                      const item = findRelationFromRow(row);
                      if (item) setDeleteItem(item);
                    }
                  : undefined
              }
              onRestore={
                statusFilter === "trash"
                  ? (row) => {
                      const item = findRelationFromRow(row);
                      if (item) setRestoreItem(item);
                    }
                  : undefined
              }
              onPermanentDelete={
                statusFilter === "trash"
                  ? (row) => {
                      const item = findRelationFromRow(row);
                      if (item) setPermanentDeleteItem(item);
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filteredRelations.length} records
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
        title="Enroll Student in Class"
        fields={addFields}
        submitLabel="Enroll Student"
      />

      <FormModal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Student Class Assignment"
        fields={editFields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Move Student Assignment to Trash"
        description={`Are you sure you want to move "${describeRelation(
          deleteItem,
        )}" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={Boolean(restoreItem)}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Student Assignment"
        description={`Are you sure you want to restore "${describeRelation(
          restoreItem,
        )}"?`}
        confirmLabel="Restore Assignment"
      />

      <ConfirmModal
        isOpen={Boolean(permanentDeleteItem)}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Assignment"
        description={`Are you sure you want to permanently delete "${describeRelation(
          permanentDeleteItem,
        )}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}