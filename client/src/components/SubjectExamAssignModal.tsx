import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  LoaderCircle,
  X,
} from "lucide-react";

import { toast } from "sonner";
import api from "@/lib/api";

interface Subject {
  id: number;
  name: string;
  class_section_id: number;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name?: string | null;
  employee_code?: string | null;
}

interface Exam {
  id: number;
  name: string;
  class_id?: number | null;
  class_ids?: number[] | null;
}

interface ExamAssignment {
  teacher_id: number;
  exam_id: number;
  subject_id: number;
  assign_till?: string | null;
}

interface SubjectExamAssignModalProps {
  isOpen: boolean;
  subject: Subject | null;
  classId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60";

const getTeachers = (
  payload: unknown,
): Teacher[] => {
  if (Array.isArray(payload)) {
    return payload as Teacher[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(
      (payload as { teachers?: unknown[] }).teachers,
    )
  ) {
    return (
      payload as { teachers: Teacher[] }
    ).teachers;
  }

  return [];
};

const getExams = (
  payload: unknown,
): Exam[] => {
  if (Array.isArray(payload)) {
    return payload as Exam[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(
      (payload as { exams?: unknown[] }).exams,
    )
  ) {
    return (
      payload as { exams: Exam[] }
    ).exams;
  }

  return [];
};

const getAssignments = (
  payload: unknown,
): ExamAssignment[] => {
  if (Array.isArray(payload)) {
    return payload as ExamAssignment[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray(
      (payload as { assignments?: unknown[] }).assignments,
    )
  ) {
    return (
      payload as { assignments: ExamAssignment[] }
    ).assignments;
  }

  return [];
};

const toDateInputValue = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const getExistingAssignment = (
  assignments: ExamAssignment[],
  subjectId: number,
  classId: number | null,
  exams: Exam[],
): ExamAssignment | null => {
  const subjectAssignments = assignments.filter(
    (assignment) => Number(assignment.subject_id) === subjectId,
  );

  if (subjectAssignments.length === 0) {
    return null;
  }

  if (classId) {
    const classExamIds = new Set(
      exams
        .filter((exam) => isExamForClass(exam, classId))
        .map((exam) => Number(exam.id)),
    );

    const classMatchedAssignment = subjectAssignments.find((assignment) =>
      classExamIds.has(Number(assignment.exam_id)),
    );

    if (classMatchedAssignment) {
      return classMatchedAssignment;
    }
  }

  return subjectAssignments[0] ?? null;
};

const isExamForClass = (
  exam: Exam,
  classId: number,
): boolean => {
  if (Number(exam.class_id) === classId) {
    return true;
  }

  if (
    Array.isArray(exam.class_ids) &&
    exam.class_ids.includes(classId)
  ) {
    return true;
  }

  return false;
};

export function SubjectExamAssignModal({
  isOpen,
  subject,
  classId,
  onClose,
  onSuccess,
}: SubjectExamAssignModalProps) {
  const [teachers, setTeachers] = useState<
    Teacher[]
  >([]);

  const [exams, setExams] = useState<Exam[]>(
    [],
  );

  const [teacherId, setTeacherId] = useState("");
  const [examId, setExamId] = useState("");
  const [assignTill, setAssignTill] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setTeacherId("");
    setExamId("");
    setAssignTill("");

    const loadOptions = async () => {
      try {
        setIsLoading(true);

        const [
          teacherResponse,
          examResponse,
          assignmentResponse,
        ] =
          await Promise.all([
            api.get("/teacher/get-teachers", {
              params: {
                status: "active",
                page: 1,
                limit: 1000,
              },
            }),

            api.get("/exam/get-exams", {
              params: {
                status: "all",
              },
            }),

            api.get("/exam-assign", {
              params: {
                status: "all",
              },
            }),
          ]);

        const teachersList = getTeachers(
          teacherResponse.data?.data,
        );

        const examsList = getExams(
          examResponse.data?.data,
        );

        const assignments = getAssignments(
          assignmentResponse.data?.data,
        );

        const existingAssignment =
          subject &&
          getExistingAssignment(
            assignments,
            subject.id,
            classId,
            examsList,
          );

        setTeachers(teachersList);

        setExams(examsList);

        if (existingAssignment) {
          setTeacherId(
            String(existingAssignment.teacher_id),
          );

          setExamId(
            String(existingAssignment.exam_id),
          );

          setAssignTill(
            toDateInputValue(
              existingAssignment.assign_till,
            ),
          );
        }
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message ||
            "Unable to load teachers or exams.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadOptions();
  }, [classId, isOpen, subject]);

  const availableExams = useMemo(() => {
    if (!classId) {
      return [];
    }

    return exams.filter((exam) =>
      isExamForClass(exam, classId),
    );
  }, [classId, exams]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!subject) {
      return;
    }

    if (!teacherId || !examId) {
      toast.error(
        "Teacher and exam are required.",
      );
      return;
    }

    try {
      setIsSaving(true);

      await api.post("/exam-assign", {
        teacher_id: Number(teacherId),
        exam_id: Number(examId),
        subject_id: subject.id,
        assign_till: assignTill || null,
      });

      toast.success(
        "Exam assigned successfully.",
      );

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to assign exam.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !subject) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Assign Subject to Teacher
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Select a teacher and an exam for this
              subject.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="grid size-9 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-5"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Subject
            </label>

            <input
              value={subject.name}
              readOnly
              className={`${inputClass} cursor-not-allowed bg-muted`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Teacher
              <span className="ml-1 text-destructive">
                *
              </span>
            </label>

            <select
              value={teacherId}
              onChange={(event) =>
                setTeacherId(event.target.value)
              }
              disabled={isLoading || isSaving}
              className={inputClass}
              required
            >
              <option value="">
                {isLoading
                  ? "Loading teachers..."
                  : "Select teacher"}
              </option>

              {teachers.map((teacher) => (
                <option
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.first_name}{" "}
                  {teacher.last_name ?? ""}
                  {teacher.employee_code
                    ? ` (${teacher.employee_code})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Exam
              <span className="ml-1 text-destructive">
                *
              </span>
            </label>

            <select
              value={examId}
              onChange={(event) =>
                setExamId(event.target.value)
              }
              disabled={
                isLoading ||
                isSaving ||
                availableExams.length === 0
              }
              className={inputClass}
              required
            >
              <option value="">
                {isLoading
                  ? "Loading exams..."
                  : availableExams.length === 0
                    ? "No exam found for this class"
                    : "Select exam"}
              </option>

              {availableExams.map((exam) => (
                <option
                  key={exam.id}
                  value={exam.id}
                >
                  {exam.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-foreground">
              Assign Till
            </label>

            <input
              type="date"
              value={assignTill}
              onChange={(event) =>
                setAssignTill(event.target.value)
              }
              disabled={isSaving}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
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
              disabled={
                isLoading ||
                isSaving ||
                availableExams.length === 0
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && (
                <LoaderCircle className="size-4 animate-spin" />
              )}

              Assign Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}