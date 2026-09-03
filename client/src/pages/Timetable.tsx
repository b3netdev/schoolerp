import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Clock3, Eye, LoaderCircle, Plus, Trash2, X } from "lucide-react";

import api from "@/lib/api";
import useClassSection from "@/hooks/useClassSection";
import useTeacher from "@/hooks/useTeacher";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setSubjects, type Subject } from "../../redux/slicers/subjectSlicer";

type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6;

type Day = {
  value: DayOfWeek;
  label: string;
};

type ClassSectionRelation = {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream?: string | null;
  deleted_at?: string | null;
};

type ClassOption = {
  id: number;
  class_name: string;
  status: "active" | "inactive";
  deleted_at?: string | null;
};

type Routine = {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number | null;
  teacher_name: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room_number: string | null;
  remarks: string | null;
};

type TimeSlot = {
  id: string;
  startTime: string;
  endTime: string;
};

type RoutineForm = {
  subject_id: string;
  teacher_id: string;
  start_time: string;
  end_time: string;
  room_number: string;
  remarks: string;
};

const days: Day[] = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const defaultSlots: TimeSlot[] = [
  { id: "08:00-08:45", startTime: "08:00", endTime: "08:45" },
  { id: "08:45-09:30", startTime: "08:45", endTime: "09:30" },
  { id: "09:45-10:30", startTime: "09:45", endTime: "10:30" },
  { id: "10:30-11:15", startTime: "10:30", endTime: "11:15" },
  { id: "11:30-12:15", startTime: "11:30", endTime: "12:15" },
  { id: "12:15-13:00", startTime: "12:15", endTime: "13:00" },
];

const emptyRoutineForm: RoutineForm = {
  subject_id: "",
  teacher_id: "",
  start_time: "",
  end_time: "",
  room_number: "",
  remarks: "",
};

const SUBJECTS_API = "/subjects";
const CLASSES_API = "/class";

const toInputTime = (value: string) => value.slice(0, 5);

const getSlotId = (startTime: string, endTime: string) =>
  `${toInputTime(startTime)}-${toInputTime(endTime)}`;

const getDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return "—";

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const totalMinutes =
    endHour * 60 + endMinute - (startHour * 60 + startMinute);

  if (totalMinutes <= 0) return "Invalid time";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours ? `${hours}h ` : ""}${minutes}m`;
};

const getErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return "Something went wrong. Please try again.";
};

export default function Timetable() {
  const dispatch = useAppDispatch();
  const { getClassSections } = useClassSection();
  const { getTeachers } = useTeacher();

  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection,
  );
  const { teachers } = useAppSelector((state) => state.teacher);
  const subjects = useAppSelector((state) => state.subject.subjects);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>(defaultSlots);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoutineLoading, setIsRoutineLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isStudentViewOpen, setIsStudentViewOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: Day;
    slot: TimeSlot;
    routine: Routine | null;
  } | null>(null);
  const [form, setForm] = useState<RoutineForm>(emptyRoutineForm);

  const activeRelations = useMemo(
    () =>
      (classSectionRelations as ClassSectionRelation[]).filter(
        (relation) => !relation.deleted_at,
      ),
    [classSectionRelations],
  );

  const classOptions = useMemo(
    () =>
      classes
        .filter((item) => item.status === "active" && !item.deleted_at)
        .map((item) => ({ id: item.id, name: item.class_name }))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [classes],
  );

  const sectionOptions = useMemo(() => {
    const classId = Number(selectedClassId);

    if (!Number.isInteger(classId) || classId <= 0) return [];

    return activeRelations
      .filter((relation) => relation.class_id === classId)
      .map((relation) => ({
        id: relation.section_id,
        name: relation.section_name,
        relationId: relation.id,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [activeRelations, selectedClassId]);

  const selectedClass = classOptions.find(
    (item) => item.id === Number(selectedClassId),
  );
  const selectedSection = sectionOptions.find(
    (item) => item.id === Number(selectedSectionId),
  );

  const selectedClassSectionRelation = activeRelations.find(
    (relation) =>
      relation.class_id === Number(selectedClassId) &&
      relation.section_id === Number(selectedSectionId),
  );

  const subjectOptions = useMemo(
    () =>
      (subjects as Subject[]).filter(
        (subject) =>
          subject.class_section_id === selectedClassSectionRelation?.id,
      ),
    [selectedClassSectionRelation?.id, subjects],
  );

  const mergeSlotsWithRoutines = (routineRows: Routine[]) => {
    const loadedSlots = routineRows.map((routine) => ({
      id: getSlotId(routine.start_time, routine.end_time),
      startTime: toInputTime(routine.start_time),
      endTime: toInputTime(routine.end_time),
    }));

    const uniqueSlots = new Map<string, TimeSlot>();
    [...defaultSlots, ...loadedSlots].forEach((slot) => {
      uniqueSlots.set(slot.id, slot);
    });

    return Array.from(uniqueSlots.values()).sort((first, second) =>
      first.startTime.localeCompare(second.startTime),
    );
  };

  const loadSubjects = async () => {
    try {
      const result = await api.get(`${SUBJECTS_API}/get-subjects`, {
        params: { status: "all" },
      });

      if (!result?.data?.success) {
        dispatch(setSubjects([]));
        setError(result?.data?.message || "Unable to load subjects.");
        return;
      }

      dispatch(setSubjects(result.data?.data ?? []));
    } catch (requestError) {
      dispatch(setSubjects([]));
      setError(getErrorMessage(requestError));
    }
  };

  const loadClasses = async () => {
    try {
      const result = await api.get(`${CLASSES_API}/get-classes`, {
        params: { status: "active" },
      });

      if (!result?.data?.success) {
        setClasses([]);
        setError(result?.data?.message || "Unable to load classes.");
        return;
      }

      setClasses(Array.isArray(result.data.data) ? result.data.data : []);
    } catch (requestError) {
      setClasses([]);
      setError(getErrorMessage(requestError));
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadClasses(),
        getClassSections("all"),
        getTeachers("active"),
        loadSubjects(),
      ]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoutines = async (classId: string, sectionId: string) => {
    if (!classId || !sectionId) {
      setRoutines([]);
      setSlots(defaultSlots);
      return;
    }

    try {
      setIsRoutineLoading(true);
      setError("");

      const result = await api.get("/routine/get-routines", {
        params: {
          class_id: Number(classId),
          section_id: Number(sectionId),
        },
      });

      if (!result?.data?.success) {
        setRoutines([]);
        setSlots(defaultSlots);
        setError(result?.data?.message || "Unable to load routines.");
        return;
      }

      const routineRows = Array.isArray(result.data.data)
        ? (result.data.data as Routine[])
        : [];

      setRoutines(routineRows);
      setSlots(mergeSlotsWithRoutines(routineRows));
    } catch (requestError) {
      setRoutines([]);
      setSlots(defaultSlots);
      setError(getErrorMessage(requestError));
    } finally {
      setIsRoutineLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    setSelectedSectionId("");
    setRoutines([]);
    setSlots(defaultSlots);
  }, [selectedClassId]);

  useEffect(() => {
    void loadRoutines(selectedClassId, selectedSectionId);
  }, [selectedClassId, selectedSectionId]);

  const getRoutine = (day: DayOfWeek, slot: TimeSlot) =>
    routines.find(
      (routine) =>
        routine.day_of_week === day &&
        toInputTime(routine.start_time) === slot.startTime &&
        toInputTime(routine.end_time) === slot.endTime,
    ) ?? null;

  const updateSlot = (
    slotId: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSlots((current) =>
      current.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              [field]: value,
              id:
                field === "startTime"
                  ? getSlotId(value, slot.endTime)
                  : getSlotId(slot.startTime, value),
            }
          : slot,
      ),
    );
  };

  const addSlot = () => {
    const nextNumber = slots.length + 1;
    setSlots((current) => [
      ...current,
      {
        id: `new-slot-${nextNumber}`,
        startTime: "",
        endTime: "",
      },
    ]);
  };

  const removeSlot = (slot: TimeSlot) => {
    const slotHasRoutines = routines.some(
      (routine) =>
        toInputTime(routine.start_time) === slot.startTime &&
        toInputTime(routine.end_time) === slot.endTime,
    );

    if (slotHasRoutines) {
      setError(
        "Remove the routines in this time slot before removing the row.",
      );
      return;
    }

    setSlots((current) => current.filter((item) => item.id !== slot.id));
  };

  const openRoutineModal = (day: Day, slot: TimeSlot) => {
    if (!selectedClassId || !selectedSectionId) return;

    const routine = getRoutine(day.value, slot);

    setError("");
    setForm({
      subject_id: routine ? String(routine.subject_id) : "",
      teacher_id: routine?.teacher_id ? String(routine.teacher_id) : "",
      start_time: routine ? toInputTime(routine.start_time) : slot.startTime,
      end_time: routine ? toInputTime(routine.end_time) : slot.endTime,
      room_number: routine?.room_number ?? "",
      remarks: routine?.remarks ?? "",
    });
    setSelectedCell({ day, slot, routine });
  };

  const closeRoutineModal = () => {
    if (!isSaving) setSelectedCell(null);
  };

  const handleSaveRoutine = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCell || !selectedClassId || !selectedSectionId) return;

    if (!form.subject_id || !form.start_time || !form.end_time) {
      setError("Subject, start time, and end time are required.");
      return;
    }

    if (getDuration(form.start_time, form.end_time) === "Invalid time") {
      setError("End time must be after start time.");
      return;
    }

    const payload = {
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
      subject_id: Number(form.subject_id),
      teacher_id: form.teacher_id ? Number(form.teacher_id) : null,
      day_of_week: selectedCell.day.value,
      start_time: form.start_time,
      end_time: form.end_time,
      room_number: form.room_number.trim() || null,
      remarks: form.remarks.trim() || null,
    };

    try {
      setIsSaving(true);
      setError("");

      if (selectedCell.routine) {
        await api.post(
          `/routine/update-routine/${selectedCell.routine.id}`,
          payload,
        );
      } else {
        await api.post("/routine/add-routine", payload);
      }

      setMessage(
        selectedCell.routine
          ? "Routine updated successfully."
          : "Routine added successfully.",
      );
      setSelectedCell(null);
      await loadRoutines(selectedClassId, selectedSectionId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = async () => {
    if (!selectedCell?.routine) return;

    try {
      setIsSaving(true);
      setError("");

      await api.delete(`/routine/delete-routine/${selectedCell.routine.id}`);

      setMessage("Routine removed successfully.");
      setSelectedCell(null);
      await loadRoutines(selectedClassId, selectedSectionId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const canManage = Boolean(selectedClassId && selectedSectionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Academics
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Class Routine
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage the weekly timetable for every class and section.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsStudentViewOpen(true)}
          disabled={!canManage}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/20 bg-card px-4 text-sm font-semibold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="size-4" />
          Student View
        </button>
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold text-card-foreground">
            Class
            <select
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(event.target.value);
                setSelectedSectionId("");
              }}
              disabled={isLoading}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select a class</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm font-semibold text-card-foreground">
            Section
            <select
              value={selectedSectionId}
              onChange={(event) => setSelectedSectionId(event.target.value)}
              disabled={!selectedClassId || isLoading}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select a section</option>
              {sectionOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  Section {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message && (
          <p className="mt-4 rounded-lg border border-primary/15 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
            {message}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
      </section>

      {!canManage ? (
        <section className="grid min-h-80 place-items-center rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <div>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Clock3 className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-foreground">
              Select a class and section
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              The weekly routine will appear after you choose a class and a
              section.
            </p>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:px-5">
            <div>
              <h2 className="font-bold text-card-foreground">
                {selectedClass?.name} · Section {selectedSection?.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {routines.length} routine{" "}
                {routines.length === 1 ? "entry" : "entries"} saved.
              </p>
            </div>

            <button
              type="button"
              onClick={addSlot}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
            >
              <Plus className="size-4" />
              Add Time Slot
            </button>
          </div>

          {isRoutineLoading ? (
            <div className="grid min-h-72 place-items-center text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="size-4 animate-spin" />
                Loading routine…
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1040px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="min-w-52 border-b border-border px-4 py-3 font-semibold">
                      Time
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.value}
                        className="min-w-36 border-b border-l border-border px-3 py-3 text-center font-semibold"
                      >
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slots.map((slot, index) => (
                    <tr key={slot.id} className="align-top">
                      <td className="border-b border-border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-card-foreground">
                            Period {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSlot(slot)}
                            className="text-xs font-semibold text-destructive transition hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <input
                            aria-label={`Period ${index + 1} start time`}
                            type="time"
                            value={slot.startTime}
                            onChange={(event) =>
                              updateSlot(
                                slot.id,
                                "startTime",
                                event.target.value,
                              )
                            }
                            className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
                          />
                          <input
                            aria-label={`Period ${index + 1} end time`}
                            type="time"
                            value={slot.endTime}
                            onChange={(event) =>
                              updateSlot(slot.id, "endTime", event.target.value)
                            }
                            className="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
                          />
                        </div>
                        <p className="mt-2 text-xs font-medium text-muted-foreground">
                          Duration: {getDuration(slot.startTime, slot.endTime)}
                        </p>
                      </td>

                      {days.map((day) => {
                        const routine = getRoutine(day.value, slot);

                        return (
                          <td
                            key={day.value}
                            className="border-b border-l border-border p-2"
                          >
                            <button
                              type="button"
                              onClick={() => openRoutineModal(day, slot)}
                              disabled={!slot.startTime || !slot.endTime}
                              className={`min-h-28 w-full rounded-lg p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                routine
                                  ? "bg-primary/10 hover:bg-primary/15"
                                  : "border border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                              }`}
                            >
                              {routine ? (
                                <>
                                  <p className="text-sm font-bold text-primary">
                                    {routine.subject_name}
                                  </p>
                                  <p className="mt-2 text-xs text-card-foreground">
                                    {routine.teacher_name ||
                                      "Teacher not assigned"}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {routine.room_number
                                      ? `Room ${routine.room_number}`
                                      : "Room not assigned"}
                                  </p>
                                </>
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  + Add routine
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {selectedCell && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Routine form"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
        >
          <form
            onSubmit={handleSaveRoutine}
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-card-foreground">
                  {selectedCell.routine ? "Edit Routine" : "Add Routine"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedClass?.name} · Section {selectedSection?.name} ·{" "}
                  {selectedCell.day.label}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRoutineModal}
                disabled={isSaving}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close routine form"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-card-foreground">
                Start time
                <input
                  required
                  type="time"
                  value={form.start_time}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      start_time: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-card-foreground">
                End time
                <input
                  required
                  type="time"
                  value={form.end_time}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      end_time: event.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Duration:{" "}
              <span className="font-semibold text-card-foreground">
                {getDuration(form.start_time, form.end_time)}
              </span>
            </p>

            <label className="mt-4 block space-y-1.5 text-sm font-semibold text-card-foreground">
              Subject
              <select
                required
                value={form.subject_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject_id: event.target.value,
                  }))
                }
                disabled={isSaving || subjectOptions.length === 0}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">
                  {subjectOptions.length === 0
                    ? "No subject assigned to this class and section"
                    : "Select subject"}
                </option>
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block space-y-1.5 text-sm font-semibold text-card-foreground">
              Assign teacher
              <select
                value={form.teacher_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    teacher_id: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Do not assign a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {`${teacher.first_name} ${teacher.last_name ?? ""}`.trim()}
                    {teacher.employee_code ? ` (${teacher.employee_code})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm font-semibold text-card-foreground">
                Room number
                <input
                  value={form.room_number}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      room_number: event.target.value,
                    }))
                  }
                  placeholder="e.g. 204"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
              <label className="space-y-1.5 text-sm font-semibold text-card-foreground">
                Remarks
                <input
                  value={form.remarks}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      remarks: event.target.value,
                    }))
                  }
                  placeholder="Optional note"
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </label>
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-between gap-3">
              <div>
                {selectedCell.routine && (
                  <button
                    type="button"
                    onClick={handleDeleteRoutine}
                    disabled={isSaving}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeRoutineModal}
                  disabled={isSaving}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-card-foreground transition hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving && <LoaderCircle className="size-4 animate-spin" />}
                  {selectedCell.routine ? "Save Changes" : "Save Routine"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isStudentViewOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Student routine view"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 sm:p-8"
        >
          <div className="mx-auto my-2 max-w-6xl rounded-2xl bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border p-5 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Student View
                </p>
                <h2 className="mt-1 text-2xl font-bold text-card-foreground">
                  {selectedClass?.name} · Section {selectedSection?.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Weekly class routine
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStudentViewOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close student routine view"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="overflow-x-auto p-4 sm:p-6">
              {routines.length === 0 ? (
                <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <div>
                    <p className="font-bold text-card-foreground">
                      No routine available
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your school has not published a routine for this class and
                      section yet.
                    </p>
                  </div>
                </div>
              ) : (
                <table className="min-w-[960px] w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-primary text-xs uppercase tracking-wide text-primary-foreground">
                      <th className="px-4 py-3">Time</th>
                      {days.map((day) => (
                        <th key={day.value} className="px-3 py-3 text-center">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot, index) => (
                      <tr key={slot.id}>
                        <td className="border border-border bg-muted/30 px-4 py-3 text-sm">
                          <p className="font-bold text-card-foreground">
                            Period {index + 1}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {slot.startTime || "—"} – {slot.endTime || "—"}
                          </p>
                        </td>
                        {days.map((day) => {
                          const routine = getRoutine(day.value, slot);

                          return (
                            <td
                              key={day.value}
                              className="border border-border p-2 text-center"
                            >
                              {routine ? (
                                <div className="rounded-lg bg-primary/10 p-2.5">
                                  <p className="text-sm font-bold text-primary">
                                    {routine.subject_name}
                                  </p>
                                  <p className="mt-1 text-xs text-card-foreground">
                                    {routine.teacher_name || "Teacher TBA"}
                                  </p>
                                  {routine.room_number && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Room {routine.room_number}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
