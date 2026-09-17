import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CalendarClock,
  ClipboardList,
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
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setExams, type Exam } from "../../redux/slicers/examSlicer";
import {
  removeExamAssignment,
  resetExamAssignments,
  setExamAssignments,
  upsertExamAssignment,
  type ExamAssignment,
  type ExamAssignFilter,
} from "../../redux/slicers/examAssignSlicer";
import { setSubjects, type Subject } from "../../redux/slicers/subjectSlicer";
import { setTeachers, type Teacher } from "../../redux/slicers/teacherSlice";

type ModalMode = "create" | "edit" | "view" | null;

type TeacherOption = {
  id: number;
  first_name: string;
  last_name?: string | null;
  employee_code?: string | null;
};

type ExamOption = {
  id: number;
  name: string;
};

type SubjectOption = {
  id: number;
  name: string;
};

type ExamAssignFormValues = {
  teacher_id: string;
  exam_id: string;
  subject_id: string;
  assign_till: string;
};

const emptyForm: ExamAssignFormValues = {
  teacher_id: "",
  exam_id: "",
  subject_id: "",
  assign_till: "",
};

const filters: { label: string; value: ExamAssignFilter }[] = [
  { label: "All", value: "all" },
  { label: "Trash", value: "trash" },
];

const statusTabs: StatusTabOption<ExamAssignFilter>[] = filters;

const columns: Column[] = [
  {
    key: "teacher_name",
    label: "Teacher",
    type: "avatar-text",
  },
  {
    key: "employee_code",
    label: "Employee Code",
  },
  {
    key: "exam_name",
    label: "Exam",
  },
  {
    key: "subject_name",
    label: "Subject",
  },
  {
    key: "assign_till_formatted",
    label: "Assign Till",
  },
];

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60";

const formatDateTime = (value?: string | null) => {
  if (!value) return "No expiry";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toTeacherList = (payload: unknown): Teacher[] => {
  if (Array.isArray(payload)) return payload as Teacher[];

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { teachers?: unknown[] }).teachers)
  ) {
    return (payload as { teachers: Teacher[] }).teachers;
  }

  return [];
};

const toExamList = (payload: unknown): Exam[] => {
  if (Array.isArray(payload)) return payload as Exam[];
  return [];
};

const toSubjectList = (payload: unknown): Subject[] => {
  if (Array.isArray(payload)) return payload as Subject[];

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { subjects?: unknown[] }).subjects)
  ) {
    return (payload as { subjects: Subject[] }).subjects;
  }

  return [];
};

export default function ExamAssign() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const selectedAcademicYearId = useAppSelector(
    (state) => state.academicYear.selectedAcademicYear?.id,
  );
  const teachers = useAppSelector((state) => state.teacher.teachers);
  const exams = useAppSelector((state) => state.exam.exams);
  const subjects = useAppSelector((state) => state.subject.subjects);
  const { assignmentsByFilter, loadedFilters } = useAppSelector(
    (state) => state.examAssign,
  );

  const [filter, setFilter] = useState<ExamAssignFilter>("all");
  const assignments = assignmentsByFilter[filter];
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<ExamAssignment | null>(null);
  const [form, setForm] = useState<ExamAssignFormValues>(emptyForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [error, setError] = useState("");

  const canManage = user?.role === "admin";

  const getErrorMessage = (requestError: unknown, fallback: string) => {
    const apiError = requestError as {
      response?: { data?: { message?: string } };
    };

    return apiError.response?.data?.message ?? fallback;
  };

  const fetchAssignments = async (
    nextFilter: ExamAssignFilter = filter,
  ) => {
    try {
      setIsLoading(true);
      setError("");

      // Only status is sent through query.
      // academic_year_id comes automatically from JWT middleware.
      const result = await api.get("/exam-assign", {
        params: { status: nextFilter },
      });

      dispatch(
        setExamAssignments({
          filter: nextFilter,
          assignments: result.data?.data ?? [],
        }),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to fetch exam assignments."),
      );
      dispatch(
        setExamAssignments({
          filter: nextFilter,
          assignments: [],
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setIsLoadingOptions(true);
      setError("");

      const requests: Promise<void>[] = [];

      if (teachers.length === 0) {
        requests.push(
          api
            .get("/teacher/get-teachers", {
              params: { status: "active", page: 1, limit: 1000 },
            })
            .then((result) => {
              dispatch(setTeachers(toTeacherList(result.data?.data)));
            }),
        );
      }

      if (exams.length === 0) {
        requests.push(
          api
            .post("/exam/get-exams?status=all", {
              default_academic_session: selectedAcademicYearId,
            })
            .then((result) => {
              dispatch(setExams(toExamList(result.data?.data)));
            }),
        );
      }

      if (subjects.length === 0) {
        requests.push(
          api
            .get("/subjects/get-subjects", {
              params: { status: "active" },
            })
            .then((result) => {
              dispatch(setSubjects(toSubjectList(result.data?.data)));
            }),
        );
      }

      if (requests.length === 0) {
        return;
      }

      await Promise.all(requests);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load teacher, exam, or subject data.",
        ),
      );
    } finally {
      setIsLoadingOptions(false);
    }
  };

  useEffect(() => {
    dispatch(resetExamAssignments());
    setPage(1);
  }, [dispatch, selectedAcademicYearId]);

  useEffect(() => {
    if (!selectedAcademicYearId) {
      setIsLoading(false);
      return;
    }

    if (!loadedFilters[filter]) {
      void fetchAssignments(filter);
      return;
    }

    setIsLoading(false);
  }, [filter, loadedFilters, selectedAcademicYearId]);

  useEffect(() => {
    if (
      canManage &&
      selectedAcademicYearId &&
      (teachers.length === 0 || exams.length === 0 || subjects.length === 0)
    ) {
      void fetchOptions();
    }
  }, [
    canManage,
    exams.length,
    selectedAcademicYearId,
    subjects.length,
    teachers.length,
  ]);

  const visibleAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.teacher_name,
        assignment.employee_code,
        assignment.exam_name,
        assignment.subject_name,
      ].some((value) => String(value || "").toLowerCase().includes(query)),
    );
  }, [assignments, search]);

  const paginatedAssignments = useMemo(
    () => visibleAssignments.slice((page - 1) * 10, page * 10),
    [page, visibleAssignments],
  );

  const tableData = useMemo(
    () =>
      paginatedAssignments.map((assignment) => ({
        ...assignment,
        teacher_name: assignment.teacher_name || "—",
        employee_code: assignment.employee_code || "—",
        exam_name: assignment.exam_name || "—",
        subject_name: assignment.subject_name || "—",
        assign_till_formatted: formatDateTime(assignment.assign_till),
      })),
    [paginatedAssignments],
  );

  const closeModal = () => {
    setModalMode(null);
    setSelectedAssignment(null);
    setForm(emptyForm);
    setError("");
  };

  const openCreate = () => {
    setSelectedAssignment(null);
    setForm(emptyForm);
    setError("");
    setModalMode("create");
  };

  const openEdit = (assignment: ExamAssignment) => {
    setSelectedAssignment(assignment);

    setForm({
      teacher_id: String(assignment.teacher_id),
      exam_id: String(assignment.exam_id),
      subject_id: String(assignment.subject_id),
      assign_till: toDateTimeLocal(assignment.assign_till),
    });

    setError("");
    setModalMode("edit");
  };

  const openView = (assignment: ExamAssignment) => {
    setSelectedAssignment(assignment);
    setError("");
    setModalMode("view");
  };

  const updateField = <Key extends keyof ExamAssignFormValues>(
    field: Key,
    value: ExamAssignFormValues[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.teacher_id || !form.exam_id || !form.subject_id) {
      setError("Teacher, exam, and subject are required.");
      return;
    }

    // Do not send academic_year_id.
    const payload = {
      teacher_id: Number(form.teacher_id),
      exam_id: Number(form.exam_id),
      subject_id: Number(form.subject_id),
      assign_till: form.assign_till || null,
    };

    try {
      setIsSaving(true);

      if (modalMode === "create") {
        const result = await api.post("/exam-assign", payload);
        const createdAssignment = result.data?.data as ExamAssignment | undefined;

        if (createdAssignment) {
          dispatch(upsertExamAssignment(createdAssignment));
        }
      }

      if (modalMode === "edit" && selectedAssignment) {
        const result = await api.patch(
          `/exam-assign/${selectedAssignment.id}`,
          payload,
        );
        const updatedAssignment = result.data?.data as ExamAssignment | undefined;

        if (updatedAssignment) {
          dispatch(upsertExamAssignment(updatedAssignment));
        }
      }

      closeModal();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to save exam assignment."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSoftDelete = async (assignment: ExamAssignment) => {
    if (
      !window.confirm(
        `Move "${assignment.exam_name || "this assignment"}" to trash?`,
      )
    ) {
      return;
    }

    try {
      setError("");

      const result = await api.delete(`/exam-assign/${assignment.id}`);
      const deletedAssignment = result.data?.data as ExamAssignment | undefined;

      if (deletedAssignment) {
        dispatch(upsertExamAssignment(deletedAssignment));
      } else {
        dispatch(removeExamAssignment(assignment.id));
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to delete exam assignment."),
      );
    }
  };

  const handleRestore = async (assignment: ExamAssignment) => {
    try {
      setError("");

      const result = await api.patch(`/exam-assign/${assignment.id}/restore`);
      const restoredAssignment = result.data?.data as ExamAssignment | undefined;

      if (restoredAssignment) {
        dispatch(upsertExamAssignment(restoredAssignment));
      } else {
        dispatch(removeExamAssignment(assignment.id));
      }
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to restore exam assignment."),
      );
    }
  };

  const getAssignmentFromRow = (row: Record<string, unknown>) => {
    const id = Number(row.id);

    return assignments.find((assignment) => assignment.id === id) ?? null;
  };

  const handleViewClick = (row: Record<string, unknown>) => {
    const assignment = getAssignmentFromRow(row);

    if (assignment) openView(assignment);
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    const assignment = getAssignmentFromRow(row);

    if (assignment) openEdit(assignment);
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const assignment = getAssignmentFromRow(row);

    if (assignment) void handleSoftDelete(assignment);
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const assignment = getAssignmentFromRow(row);

    if (assignment) void handleRestore(assignment);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Exam Assignment" }]} />

      <PageHeader
        title="Exam Assignment"
        description={`${assignments.length} assignment records`}
        action={
          canManage ? (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              Assign Exam
            </button>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search teacher, exam, subject..."
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
              onChange={(value: ExamAssignFilter) => {
                setFilter(value);
                setPage(1);
              }}
              disabled={isLoading}
              className="lg:ml-auto"
            />
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-6 mt-5 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded p-1 transition hover:bg-destructive/10"
              aria-label="Close error"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton columns={columns.length} rows={10} />
          ) : (
            <DataTable
              columns={columns}
              data={tableData as Record<string, unknown>[]}
              onView={handleViewClick}
              onEdit={
                canManage && filter !== "trash"
                  ? handleEditClick
                  : undefined
              }
              onDelete={
                canManage && filter !== "trash"
                  ? handleDeleteClick
                  : undefined
              }
              onRestore={
                canManage && filter === "trash"
                  ? handleRestoreClick
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedAssignments.length} of{" "}
            {visibleAssignments.length} assignments
          </span>

          <Pagination
            currentPage={page}
            totalPages={Math.max(
              1,
              Math.ceil(visibleAssignments.length / 10),
            )}
            onPageChange={setPage}
          />
        </div>
      </div>

      {modalMode && (
        <ExamAssignModal
          mode={modalMode}
          assignment={selectedAssignment}
          form={form}
          error={error}
          isSaving={isSaving}
          isLoadingOptions={isLoadingOptions}
          teachers={teachers}
          exams={exams}
          subjects={subjects}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={updateField}
        />
      )}
    </div>
  );
}

function ExamAssignModal({
  mode,
  assignment,
  form,
  error,
  isSaving,
  isLoadingOptions,
  teachers,
  exams,
  subjects,
  onClose,
  onSubmit,
  onChange,
}: {
  mode: ModalMode;
  assignment: ExamAssignment | null;
  form: ExamAssignFormValues;
  error: string;
  isSaving: boolean;
  isLoadingOptions: boolean;
  teachers: TeacherOption[];
  exams: ExamOption[];
  subjects: SubjectOption[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: <Key extends keyof ExamAssignFormValues>(
    field: Key,
    value: ExamAssignFormValues[Key],
  ) => void;
}) {
  const isView = mode === "view";

  const title =
    mode === "create"
      ? "Assign Exam"
      : isView
        ? "Exam Assignment Details"
        : "Edit Exam Assignment";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">
              {title}
            </h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {isView
                ? "Review the assignment details."
                : "Fields marked with * are required."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {isView && assignment ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info
                label="Teacher"
                value={assignment.teacher_name || "—"}
              />
              <Info
                label="Employee code"
                value={assignment.employee_code || "—"}
              />
              <Info label="Exam" value={assignment.exam_name || "—"} />
              <Info label="Subject" value={assignment.subject_name || "—"} />
              <Info
                label="Assign till"
                value={formatDateTime(assignment.assign_till)}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-5">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Teacher" required>
                <select
                  value={form.teacher_id}
                  onChange={(event) =>
                    onChange("teacher_id", event.target.value)
                  }
                  className={inputClass}
                  disabled={isSaving || isLoadingOptions}
                  required
                >
                  <option value="">
                    {isLoadingOptions
                      ? "Loading teachers..."
                      : "Select teacher"}
                  </option>

                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name || ""}
                      {teacher.employee_code
                        ? ` (${teacher.employee_code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Exam" required>
                <select
                  value={form.exam_id}
                  onChange={(event) => onChange("exam_id", event.target.value)}
                  className={inputClass}
                  disabled={isSaving || isLoadingOptions}
                  required
                >
                  <option value="">
                    {isLoadingOptions ? "Loading exams..." : "Select exam"}
                  </option>

                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Subject" required>
                <select
                  value={form.subject_id}
                  onChange={(event) =>
                    onChange("subject_id", event.target.value)
                  }
                  className={inputClass}
                  disabled={isSaving || isLoadingOptions}
                  required
                >
                  <option value="">
                    {isLoadingOptions
                      ? "Loading subjects..."
                      : "Select subject"}
                  </option>

                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Assign till">
                <input
                  type="datetime-local"
                  value={form.assign_till}
                  onChange={(event) =>
                    onChange("assign_till", event.target.value)
                  }
                  className={inputClass}
                  disabled={isSaving}
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || isLoadingOptions}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving && <LoaderCircle className="size-4 animate-spin" />}

                {mode === "create" ? "Assign Exam" : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {isView && (
          <div className="flex justify-end border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <CalendarClock className="size-4" />
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>

      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}