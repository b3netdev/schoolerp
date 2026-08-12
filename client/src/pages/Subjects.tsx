import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import api from "@/lib/api";

import { DataTable, Column } from "@/components/tables/DataTable";
import {
  FormModal,
  FieldDef,
  FormValues,
} from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import {
  StatusTabs,
  StatusTabOption,
} from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";
import { useAppSelector } from "../../redux/hooks";
import useClassSection from "@/hooks/useClassSection";

type SubjectStatusFilter = "all" | "trash";

interface Subject {
  id: number;
  class_section_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ClassSectionRelation {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream: string | null;
  teacher_id: number | null;
  teacher_name: string;
  employee_code: string | null;
  academic_year_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

type SubjectTableRow = Subject & {
  class_section_name: string;
};

const SUBJECTS_API = "/subjects";

const statusTabs: StatusTabOption<SubjectStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "trash", label: "Trash" },
];

const columns: Column[] = [
  { key: "name", label: "Subject Name" },
  { key: "class_section_name", label: "Class & Section" },
  { key: "description", label: "Description" },
];

export default function Subjects() {
  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection,
  );

  const { getClassSections } = useClassSection();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] =
    useState<SubjectStatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Subject | null>(null);
  const [deleteItem, setDeleteItem] = useState<Subject | null>(null);
  const [restoreItem, setRestoreItem] = useState<Subject | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] =
    useState<Subject | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    void getClassSections("all");
  }, []);

  const loadSubjects = async (status: SubjectStatusFilter) => {
    try {
      setIsLoading(true);

      const response = await api.get(`${SUBJECTS_API}/get-subjects`, {
        params: { status },
      });

      setSubjects(response.data?.data ?? []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      setSubjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSubjects(statusFilter);
  }, [statusFilter]);

  const classSectionOptions = useMemo(() => {
    return (classSectionRelations as ClassSectionRelation[])
      .filter((relation) => !relation.deleted_at)
      .map((relation) => ({
        value: String(relation.id),
        label: `Class ${relation.class_name} - Section ${relation.section_name}${
          relation.section_stream ? ` (${relation.section_stream})` : ""
        }`,
      }));
  }, [classSectionRelations]);

  const subjectFields: FieldDef[] = useMemo(
    () => [
      {
        key: "class_section_id",
        label: "Class & Section",
        type: "select",
        required: true,
        options: classSectionOptions,
      },
      {
        key: "name",
        label: "Subject Name",
        type: "text",
        required: true,
        placeholder: "Enter subject name",
      },
      {
        key: "description",
        label: "Description",
        type: "textarea",
        placeholder: "Enter subject description",
      },
    ],
    [classSectionOptions],
  );

  const tableData: SubjectTableRow[] = useMemo(() => {
    return subjects.map((subject) => {
      const classSection = classSectionOptions.find(
        (option) => Number(option.value) === Number(subject.class_section_id),
      );

      return {
        ...subject,
        class_section_name: classSection?.label ?? "N/A",
      };
    });
  }, [subjects, classSectionOptions]);

  const filteredSubjects = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return tableData;

    return tableData.filter((subject) => {
      return (
        subject.name.toLowerCase().includes(keyword) ||
        subject.description?.toLowerCase().includes(keyword) ||
        subject.class_section_name.toLowerCase().includes(keyword)
      );
    });
  }, [search, tableData]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubjects.length / itemsPerPage),
  );

  const paginatedData = filteredSubjects.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const handleAdd = async (values: FormValues) => {
    try {
      await api.post(`${SUBJECTS_API}/add-subject`, {
        class_section_id: Number(values.class_section_id),
        name: String(values.name ?? "").trim(),
        description: String(values.description ?? "").trim() || null,
      });

      setAddOpen(false);
      await loadSubjects(statusFilter);
    } catch (error) {
      console.error("Failed to add subject:", error);
    }
  };

  const handleEdit = async (values: FormValues) => {
    if (!editItem) return;

    try {
      await api.post(`${SUBJECTS_API}/update-subject/${editItem.id}`, {
        class_section_id: Number(values.class_section_id),
        name: String(values.name ?? "").trim(),
        description: String(values.description ?? "").trim() || null,
      });

      setEditItem(null);
      await loadSubjects(statusFilter);
    } catch (error) {
      console.error("Failed to update subject:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await api.delete(`${SUBJECTS_API}/delete-subject/${deleteItem.id}`);
      setDeleteItem(null);
      await loadSubjects(statusFilter);
    } catch (error) {
      console.error("Failed to delete subject:", error);
    }
  };

  const handleRestore = async () => {
    if (!restoreItem) return;

    try {
      await api.post(`${SUBJECTS_API}/restore-subject/${restoreItem.id}`);
      setRestoreItem(null);
      await loadSubjects(statusFilter);
    } catch (error) {
      console.error("Failed to restore subject:", error);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;

    try {
      await api.delete(
        `${SUBJECTS_API}/permanent-delete-subject/${permanentDeleteItem.id}`,
      );

      setPermanentDeleteItem(null);
      await loadSubjects(statusFilter);
    } catch (error) {
      console.error("Failed to permanently delete subject:", error);
    }
  };

  const getSubjectFromRow = (row: Record<string, unknown>) => {
    return subjects.find((subject) => subject.id === Number(row.id));
  };

  const editInitialValues: FormValues | undefined = editItem
    ? {
        class_section_id: String(editItem.class_section_id),
        name: editItem.name,
        description: editItem.description ?? "",
      }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Subjects" }]} />

      <PageHeader
        title="Subjects"
        description={`${subjects.length} subject records`}
        action={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search subjects..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <StatusTabs
              options={statusTabs}
              value={statusFilter}
              disabled={isLoading}
              className="lg:ml-auto"
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={itemsPerPage} />
          ) : (
            <DataTable
              columns={columns}
              data={paginatedData as unknown as Record<string, unknown>[]}
              onEdit={
                statusFilter === "all"
                  ? (row) => {
                      const subject = getSubjectFromRow(row);
                      if (subject) setEditItem(subject);
                    }
                  : undefined
              }
              onDelete={
                statusFilter === "all"
                  ? (row) => {
                      const subject = getSubjectFromRow(row);
                      if (subject) setDeleteItem(subject);
                    }
                  : undefined
              }
              onRestore={
                statusFilter === "trash"
                  ? (row) => {
                      const subject = getSubjectFromRow(row);
                      if (subject) setRestoreItem(subject);
                    }
                  : undefined
              }
              onPermanentDelete={
                statusFilter === "trash"
                  ? (row) => {
                      const subject = getSubjectFromRow(row);
                      if (subject) setPermanentDeleteItem(subject);
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filteredSubjects.length} subjects
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
        title="Add New Subject"
        fields={subjectFields}
        submitLabel="Add Subject"
      />

      <FormModal
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Subject"
        fields={subjectFields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Subject"
        description={`Are you sure you want to move "${
          deleteItem?.name ?? ""
        }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={Boolean(restoreItem)}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Subject"
        description={`Are you sure you want to restore "${
          restoreItem?.name ?? ""
        }"?`}
        confirmLabel="Restore Subject"
      />

      <ConfirmModal
        isOpen={Boolean(permanentDeleteItem)}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Subject"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem?.name ?? ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}