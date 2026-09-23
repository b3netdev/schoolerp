import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { toast } from "sonner";
import api from "@/lib/api";

interface ClassItem {
  id: number;
  class_name: string;
}

interface Grade {
  id: number;
  grade: string;
  class_id: number;
  class_name?: string;
  range_from: number | null;
  range_to: number | null;
  remarks: string | null;
  description: string | null;
  deleted_at: string | null;
}

interface GradeDraft {
  key: string;
  grade: string;
  range_from: string;
  range_to: string;
  remarks: string;
  description: string;
}

const createGradeDraft = (): GradeDraft => ({
  key: crypto.randomUUID(),
  grade: "",
  range_from: "",
  range_to: "",
  remarks: "",
  description: "",
});

export default function GradeManagement() {
  const [classes, setClasses] = useState<
    ClassItem[]
  >([]);

  const [grades, setGrades] = useState<
    Grade[]
  >([]);

  const [classId, setClassId] = useState("");

  const [status, setStatus] = useState<
    "active" | "trash"
  >("active");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isAddOpen, setIsAddOpen] =
    useState(false);

  const [draftClassId, setDraftClassId] =
    useState("");

  const [drafts, setDrafts] = useState<
    GradeDraft[]
  >([]);

  const [editItem, setEditItem] =
    useState<Grade | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<Grade | null>(null);

  const loadClasses = async () => {
    try {
      const response = await api.get(
        "/class/get-classes",
        {
          params: {
            status: "active",
          },
        },
      );

      setClasses(
        Array.isArray(response.data?.data)
          ? response.data.data
          : [],
      );
    } catch {
      setClasses([]);
      toast.error("Unable to load classes.");
    }
  };

  const loadGrades = async () => {
    if (!classId) {
      setGrades([]);
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.get(
        "/grade/get-grades",
        {
          params: {
            class_id: Number(classId),
            status,
          },
        },
      );

      setGrades(
        Array.isArray(response.data?.data)
          ? response.data.data
          : [],
      );
    } catch (error: any) {
      setGrades([]);

      toast.error(
        error?.response?.data?.message ||
          "Unable to load grades.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, []);

  useEffect(() => {
    void loadGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, status]);

  const openBulkModal = () => {
    setDraftClassId(classId);
    setDrafts([createGradeDraft()]);
    setIsAddOpen(true);
  };

  const updateDraft = (
    key: string,
    field: keyof Omit<GradeDraft, "key">,
    value: string,
  ) => {
    setDrafts((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const submitBulkGrades = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!draftClassId) {
      toast.error("Please select a class.");
      return;
    }

    for (const item of drafts) {
      if (!item.grade.trim()) {
        toast.error(
          "Every grade row needs a grade name.",
        );
        return;
      }

      if (
        item.range_from &&
        item.range_to &&
        Number(item.range_from) >
          Number(item.range_to)
      ) {
        toast.error(
          `Invalid mark range for ${item.grade}.`,
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const response = await api.post(
        "/grade/add-grades-bulk",
        {
          class_id: Number(draftClassId),
          grades: drafts.map((item) => ({
            grade: item.grade.trim(),
            range_from: item.range_from
              ? Number(item.range_from)
              : null,
            range_to: item.range_to
              ? Number(item.range_to)
              : null,
            remarks:
              item.remarks.trim() || null,
            description:
              item.description.trim() || null,
          })),
        },
      );

      toast.success(
        response.data?.message ||
          "Grades added successfully.",
      );

      setClassId(draftClassId);
      setStatus("active");
      setIsAddOpen(false);

      await loadGrades();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to add grades.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitEdit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!editItem) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await api.patch(
        `/grade/update-grade/${editItem.id}`,
        {
          grade: editItem.grade.trim(),
          class_id: editItem.class_id,
          range_from: editItem.range_from,
          range_to: editItem.range_to,
          remarks:
            editItem.remarks?.trim() || null,
          description:
            editItem.description?.trim() || null,
        },
      );

      toast.success(
        response.data?.message ||
          "Grade updated successfully.",
      );

      setEditItem(null);

      await loadGrades();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to update grade.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const softDelete = async () => {
    if (!deleteItem) {
      return;
    }

    try {
      const response = await api.delete(
        `/grade/delete-grade/${deleteItem.id}`,
      );

      toast.success(
        response.data?.message ||
          "Grade moved to trash.",
      );

      setDeleteItem(null);

      await loadGrades();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to delete grade.",
      );
    }
  };

  const restoreGrade = async (id: number) => {
    try {
      const response = await api.patch(
        `/grade/restore-grade/${id}`,
      );

      toast.success(
        response.data?.message ||
          "Grade restored successfully.",
      );

      await loadGrades();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to restore grade.",
      );
    }
  };

  const hardDeleteGrade = async (id: number) => {
    const confirmed = window.confirm(
      "Permanently delete this grade?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.delete(
        `/grade/hard-delete-grade/${id}`,
      );

      toast.success(
        response.data?.message ||
          "Grade permanently deleted.",
      );

      await loadGrades();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "Unable to permanently delete grade.",
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Grade Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Create and manage class-wise grade ranges.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-end md:justify-between">
          <div className="w-full max-w-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Class
            </label>

            <select
              value={classId}
              onChange={(event) =>
                setClassId(event.target.value)
              }
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">
                Select class to view grades
              </option>

              {classes.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.class_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={openBulkModal}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Add Grades
          </button>
        </div>

        <div className="flex gap-2 border-b border-slate-200 px-5 pt-4">
          {(["active", "trash"] as const).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
                  status === item
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {item === "active"
                  ? "Active"
                  : "Trash"}
              </button>
            ),
          )}
        </div>

        {!classId ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Select a class to view its grades.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">SL</th>
                  <th className="px-5 py-4">Grade</th>
                  <th className="px-5 py-4">Range</th>
                  <th className="px-5 py-4">Remarks</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      Loading grades...
                    </td>
                  </tr>
                ) : grades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-slate-500"
                    >
                      No grades found.
                    </td>
                  </tr>
                ) : (
                  grades.map((item, index) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        {index + 1}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {item.grade}
                      </td>

                      <td className="px-5 py-4">
                        {item.range_from ?? "-"} -{" "}
                        {item.range_to ?? "-"}
                      </td>

                      <td className="px-5 py-4">
                        {item.remarks ?? "-"}
                      </td>

                      <td className="px-5 py-4">
                        {item.description ?? "-"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {status === "active" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditItem(item)
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                            >
                              <Pencil className="size-3.5" />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeleteItem(item)
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                restoreGrade(item.id)
                              }
                              className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              Restore
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                hardDeleteGrade(item.id)
                              }
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <form
            onSubmit={submitBulkGrades}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Add Grades
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add multiple grade ranges for one class.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
              >
                <X className="size-5 text-slate-500" />
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class *
              </label>

              <select
                value={draftClassId}
                onChange={(event) =>
                  setDraftClassId(event.target.value)
                }
                className="h-10 w-full max-w-md rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.class_name}
                  </option>
                ))}
              </select>

              <div className="mt-6 space-y-3">
                {drafts.map((item, index) => (
                  <div
                    key={item.key}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="font-semibold text-slate-700">
                        Grade {index + 1}
                      </p>

                      {drafts.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDrafts((current) =>
                              current.filter(
                                (grade) =>
                                  grade.key !==
                                  item.key,
                              ),
                            )
                          }
                          className="text-sm font-semibold text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-5">
                      <input
                        value={item.grade}
                        onChange={(event) =>
                          updateDraft(
                            item.key,
                            "grade",
                            event.target.value,
                          )
                        }
                        placeholder="Grade (A+)"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.range_from}
                        onChange={(event) =>
                          updateDraft(
                            item.key,
                            "range_from",
                            event.target.value,
                          )
                        }
                        placeholder="Range From"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      />

                      <input
                        type="number"
                        min="0"
                        value={item.range_to}
                        onChange={(event) =>
                          updateDraft(
                            item.key,
                            "range_to",
                            event.target.value,
                          )
                        }
                        placeholder="Range To"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      />

                      <input
                        value={item.remarks}
                        onChange={(event) =>
                          updateDraft(
                            item.key,
                            "remarks",
                            event.target.value,
                          )
                        }
                        placeholder="Remarks"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      />

                      <input
                        value={item.description}
                        onChange={(event) =>
                          updateDraft(
                            item.key,
                            "description",
                            event.target.value,
                          )
                        }
                        placeholder="Description"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setDrafts((current) => [
                    ...current,
                    createGradeDraft(),
                  ])
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
              >
                <Plus className="size-4" />
                Add Grade Row
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Save Grades
              </button>
            </div>
          </form>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <form
            onSubmit={submitEdit}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Edit Grade
              </h2>

              <button
                type="button"
                onClick={() => setEditItem(null)}
              >
                <X className="size-5 text-slate-500" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={editItem.grade}
                onChange={(event) =>
                  setEditItem({
                    ...editItem,
                    grade: event.target.value,
                  })
                }
                placeholder="Grade"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />

              <input
                value={editItem.remarks ?? ""}
                onChange={(event) =>
                  setEditItem({
                    ...editItem,
                    remarks: event.target.value,
                  })
                }
                placeholder="Remarks"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />

              <input
                type="number"
                value={editItem.range_from ?? ""}
                onChange={(event) =>
                  setEditItem({
                    ...editItem,
                    range_from: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                placeholder="Range From"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />

              <input
                type="number"
                value={editItem.range_to ?? ""}
                onChange={(event) =>
                  setEditItem({
                    ...editItem,
                    range_to: event.target.value
                      ? Number(event.target.value)
                      : null,
                  })
                }
                placeholder="Range To"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
              />

              <textarea
                value={editItem.description ?? ""}
                onChange={(event) =>
                  setEditItem({
                    ...editItem,
                    description: event.target.value,
                  })
                }
                placeholder="Description"
                className="min-h-24 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditItem(null)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Update Grade
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800">
              Delete Grade
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Move "{deleteItem.grade}" to trash?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={softDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}