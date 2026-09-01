import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import {
  StatusTabs,
  type StatusTabOption,
} from "@/components/common/StatusTabs";
import { DataTable, type Column } from "@/components/tables/DataTable";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";
import api from "@/lib/api";


import type {Exam as ExamItem,ExamStatus} from "../../redux/slicers/examSlicer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { addExam, deleteExam, setExams, updateExam } from "../../redux/slicers/examSlicer";

type ExamFilter = "all" | "draft" | "published" | "completed" | "cancelled" | "trash";
type ModalMode = "create" | "edit" | "view" | null;

type ExamFormValues = {
  name: string;
  exam_type: string;
  class_id: string;
  start_date: string;
  end_date: string;
  status: ExamStatus;
  description: string;
};

type ClassOption = {
  id: number;
  class_name: string;
};

const emptyForm: ExamFormValues = {
  name: "",
  exam_type: "",
  class_id: "",
  start_date: "",
  end_date: "",
  status: "draft",
  description: "",
};

const filters: { label: string; value: ExamFilter }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Trash", value: "trash" },
];

const columns: Column[] = [
  {
    key: "name",
    label: "Exam Name",
    type: "avatar-text",
  },
  {
    key: "exam_type",
    label: "Exam Type",
  },
  {
    key: "class_name",
    label: "Class",
  },
  {
    key: "exam_dates",
    label: "Schedule",
  },
  {
    key: "status",
    label: "Status",
    type: "status",
  },
  {
    key: "description",
    label: "Description",
  },
];

const statusTabs: StatusTabOption<ExamFilter>[] = filters;

const statusClass: Record<ExamStatus, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  published: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const toInputDate = (value: string) => value ? value.slice(0, 10) : "";

const formatDate = (value: string) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
};

export default function Exam() {
  const dispatch = useAppDispatch();
  const exams = useAppSelector((state) => state.exam.exams);

  const [filter, setFilter] = useState<ExamFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);
  const [form, setForm] = useState<ExamFormValues>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [error, setError] = useState("");

  const getErrorMessage = (requestError: unknown, fallback: string) => {
    const apiError = requestError as {
      response?: { data?: { message?: string } };
    };

    return apiError.response?.data?.message ?? fallback;
  };

  const fetchExams = async (nextFilter: ExamFilter = filter) => {
    try {
      setIsLoading(true);
      setError("");

      const result = await api.get("/exam/get-exams", {
        params: { status: nextFilter },
      });

      if (!result.data?.success) {
        throw new Error(result.data?.message || "Unable to fetch exams.");
      }

      dispatch(setExams(result.data.data ?? []));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to fetch exams."));
      dispatch(setExams([]));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchExams(filter);
  }, [filter]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoadingClasses(true);

        const result = await api.get("/class/get-classes", {
          params: { status: "active" },
        });

        if (!result.data?.success) {
          throw new Error(result.data?.message || "Unable to fetch classes.");
        }

        setClasses(result.data.data ?? []);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Unable to fetch classes."));
      } finally {
        setIsLoadingClasses(false);
      }
    };

    void fetchClasses();
  }, []);

  const visibleExams = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return exams;

    return exams.filter((exam) =>
      [exam.name, exam.exam_type, exam.class_name, exam.status]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [exams, search]);

  const paginatedExams = useMemo(
    () => visibleExams.slice((page - 1) * 10, page * 10),
    [page, visibleExams],
  );

  const tableData = useMemo(
    () =>
      paginatedExams.map((exam) => ({
        ...exam,
        exam_dates: `${formatDate(exam.start_date)} – ${formatDate(exam.end_date)}`,
      })),
    [paginatedExams],
  );

  const closeModal = () => {
    setModalMode(null);
    setSelectedExam(null);
    setForm(emptyForm);
    setError("");
  };

  const openCreate = () => {
    setSelectedExam(null);
    setForm(emptyForm);
    setError("");
    setModalMode("create");
  };

  const openEdit = (exam: ExamItem) => {
    setSelectedExam(exam);
    setForm({
      name: exam.name,
      exam_type: exam.exam_type,
      class_id: String(exam.class_id),
      start_date: toInputDate(exam.start_date),
      end_date: toInputDate(exam.end_date),
      status: exam.status,
      description: exam.description ?? "",
    });
    setError("");
    setModalMode("edit");
  };

  const openView = (exam: ExamItem) => {
    setSelectedExam(exam);
    setError("");
    setModalMode("view");
  };

  const updateField = <Key extends keyof ExamFormValues>(
    field: Key,
    value: ExamFormValues[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.exam_type.trim() || !form.class_id) {
      setError("Exam name, exam type, and class are required.");
      return;
    }

    if (!form.start_date || !form.end_date) {
      setError("Start date and end date are required.");
      return;
    }

    if (form.start_date > form.end_date) {
      setError("End date cannot be before start date.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      exam_type: form.exam_type.trim(),
      class_id: Number(form.class_id),
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      description: form.description.trim() || null,
    };

    try {
      setIsSaving(true);

      if (modalMode === "create") {
        const result = await api.post("/exam/add-exam", payload);

        if (!result.data?.success) {
          throw new Error(result.data?.message || "Unable to create exam.");
        }

        dispatch(addExam(result.data.data));
      }

      if (modalMode === "edit" && selectedExam) {
        const result = await api.post(
          `/exam/update-exam/${selectedExam.id}`,
          payload,
        );

        if (!result.data?.success) {
          throw new Error(result.data?.message || "Unable to update exam.");
        }

        dispatch(updateExam(result.data.data));
      }

      closeModal();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to save exam."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = async (exam: ExamItem) => {
    if (!window.confirm(`Move “${exam.name}” to trash?`)) return;

    try {
      const result = await api.delete(`/exam/delete-exam/${exam.id}`);

      if (!result.data?.success) {
        throw new Error(result.data?.message || "Unable to delete exam.");
      }

      dispatch(deleteExam(exam.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to delete exam."));
    }
  };

  const handleRestore = async (exam: ExamItem) => {
    try {
      const result = await api.patch(`/exam/restore-exam/${exam.id}`);

      if (!result.data?.success) {
        throw new Error(result.data?.message || "Unable to restore exam.");
      }

      if (filter === "trash") {
        dispatch(deleteExam(exam.id));
      } else {
        dispatch(updateExam(result.data.data));
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to restore exam."));
    }
  };

  const handleHardDelete = async (exam: ExamItem) => {
    if (!window.confirm(`Permanently delete “${exam.name}”? This cannot be undone.`)) {
      return;
    }

    try {
      const result = await api.delete(`/exam/hard-delete-exam/${exam.id}`);

      if (!result.data?.success) {
        throw new Error(result.data?.message || "Unable to permanently delete exam.");
      }

      dispatch(deleteExam(exam.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to permanently delete exam."));
    }
  };

  const getExamFromRow = (row: Record<string, unknown>) => {
    const id = Number(row.id);
    return exams.find((exam) => exam.id === id) ?? null;
  };

  const handleViewClick = (row: Record<string, unknown>) => {
    const exam = getExamFromRow(row);
    if (exam) openView(exam);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const exam = getExamFromRow(row);
    if (exam) openEdit(exam);
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const exam = getExamFromRow(row);
    if (exam) void handleSoftDelete(exam);
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const exam = getExamFromRow(row);
    if (exam) void handleRestore(exam);
  };

  const handlePermanentDeleteClick = (row: Record<string, unknown>) => {
    const exam = getExamFromRow(row);
    if (exam) void handleHardDelete(exam);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Exams" }]} />

      <PageHeader
        title="Exams"
        description={`${exams.length} exam records`}
        action={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Add Exam
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search exams..."
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
              value={filter}
              onChange={(value: ExamFilter) => {
                setFilter(value);
                setPage(1);
              }}
              disabled={isLoading}
              className="lg:ml-auto"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="mx-6 mt-5 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={10} />
          ) : (
            <DataTable
              columns={columns}
              data={tableData as Record<string, unknown>[]}
              onEdit={filter !== "trash" ? handleEditClick : undefined}
              onView={handleViewClick}
              onDelete={filter !== "trash" ? handleDeleteClick : undefined}
              onRestore={filter === "trash" ? handleRestoreClick : undefined}
              onPermanentDelete={filter === "trash" ? handlePermanentDeleteClick : undefined}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedExams.length} of {visibleExams.length} exams
          </span>
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(visibleExams.length / 10))}
            onPageChange={setPage}
          />
        </div>
      </div>

      {modalMode && (
        <ExamModal
          mode={modalMode}
          exam={selectedExam}
          form={form}
          error={error}
          isSaving={isSaving}
          classes={classes}
          isLoadingClasses={isLoadingClasses}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={updateField}
        />
      )}
    </div>
  );
}

function ExamModal({
  mode,
  exam,
  form,
  error,
  isSaving,
  classes,
  isLoadingClasses,
  onClose,
  onSubmit,
  onChange,
}: {
  mode: ModalMode;
  exam: ExamItem | null;
  form: ExamFormValues;
  error: string;
  isSaving: boolean;
  classes: ClassOption[];
  isLoadingClasses: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof ExamFormValues>(field: Key, value: ExamFormValues[Key]) => void;
}) {
  const isView = mode === "view";
  const title = mode === "create" ? "Add Exam" : isView ? "Exam Details" : "Edit Exam";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{isView ? "Review the examination information." : "Fields marked with * are required."}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal" className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>

        {isView && exam ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Exam name" value={exam.name} />
              <Info label="Exam type" value={exam.exam_type} />
              <Info label="Class" value={exam.class_name} />
              <Info label="Start date" value={formatDate(exam.start_date)} />
              <Info label="End date" value={formatDate(exam.end_date)} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass[exam.status]}`}>{exam.status}</span>
              </div>
              <Info label="Academic year ID" value={String(exam.academic_year_id)} />
            </div>
            <Info label="Description" value={exam.description || "No description added."} />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5">
            {error && <div role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam name" required>
                <input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="e.g. First Terminal Examination" className={inputClass} disabled={isSaving} required />
              </Field>
              <Field label="Exam type" required>
                <input value={form.exam_type} onChange={(event) => onChange("exam_type", event.target.value)} placeholder="e.g. terminal, monthly" className={inputClass} disabled={isSaving} required />
              </Field>
              <Field label="Class" required>
                <select
                  value={form.class_id}
                  onChange={(event) => onChange("class_id", event.target.value)}
                  className={inputClass}
                  disabled={isSaving || isLoadingClasses}
                  required
                >
                  <option value="">
                    {isLoadingClasses ? "Loading classes..." : "Select a class"}
                  </option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.class_name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start date" required>
                <input type="date" value={form.start_date} onChange={(event) => onChange("start_date", event.target.value)} className={inputClass} disabled={isSaving} required />
              </Field>
              <Field label="End date" required>
                <input type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => onChange("end_date", event.target.value)} className={inputClass} disabled={isSaving} required />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(event) => onChange("status", event.target.value as ExamStatus)} className={inputClass} disabled={isSaving}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Description">
                <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} placeholder="Optional notes about this examination" className={`${inputClass} h-24 resize-y py-2.5`} disabled={isSaving} />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button type="button" onClick={onClose} disabled={isSaving} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60">Cancel</button>
              <button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
                {isSaving && <LoaderCircle className="size-4 animate-spin" />}
                {mode === "create" ? "Create Exam" : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {isView && <div className="flex justify-end border-t border-border px-5 py-4"><button type="button" onClick={onClose} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90">Close</button></div>}
      </div>
    </div>
  );
}

const inputClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60";

function Field({ label, required = false, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-semibold text-foreground">{label}{required && <span className="ml-0.5 text-destructive">*</span>}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-foreground">{value}</p></div>;
}
