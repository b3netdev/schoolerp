import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import DOMPurify from "dompurify";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RichTextEditor } from "@/components/RichTextEditor";
import { noticeApi, type Notice, type NoticeFor } from "@/lib/noticeApi";
import api from "@/lib/api";
import { useAppSelector } from "../../redux/hooks";

type ClassOption = {
  id: number;
  class_name: string;
  status: string;
  deleted_at?: string | null;
};

type NoticeForm = {
  notice_for: NoticeFor[];
  title: string;
  description: string;
  class_ids: number[];
};

const NOTICE_FOR_OPTIONS: Array<{ value: NoticeFor; label: string }> = [
  { value: "student", label: "Students" },
  { value: "teacher", label: "Teachers" },
  { value: "admin", label: "Admins" },
];

const emptyForm: NoticeForm = {
  notice_for: ["student"],
  title: "",
  description: "",
  class_ids: [],
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;

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

const isApiSuccess = (response: { data?: { success?: boolean; status?: string } }) =>
  response.data?.success === true || response.data?.status === "success";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getNoticeForLabel = (values: NoticeFor[]) => {
  if (!values.length) return "Select Notice For";

  return NOTICE_FOR_OPTIONS.filter((item) => values.includes(item.value))
    .map((item) => item.label)
    .join(", ");
};

export default function NoticeBoard() {
  const { user } = useAppSelector((state) => state.auth);
  const selectedAcademicYearId = useAppSelector(
    (state: any) => state.academicYear.selectedAcademicYear?.id,
  );

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState<NoticeForm>(emptyForm);

  const [filterDate, setFilterDate] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = user?.role === "admin";

  const classOptions = useMemo(
    () =>
      classes
        .filter((item) => item.status === "active" && !item.deleted_at)
        .map((item) => ({ id: item.id, name: item.class_name }))
        .sort((first, second) => first.name.localeCompare(second.name)),
    [classes],
  );

  const loadClasses = async () => {
    if (!selectedAcademicYearId) {
      setClasses([]);
      return;
    }

    try {
      const result = await api.get("/class/get-classes", {
        params: { status: "active" },
      });

      if (!isApiSuccess(result)) {
        setClasses([]);
        setError(result.data?.message || "Unable to load classes.");
        return;
      }

      setClasses(Array.isArray(result.data?.data) ? result.data.data : []);
    } catch (requestError) {
      setClasses([]);
      setError(getErrorMessage(requestError));
    }
  };

  const loadNotices = async () => {
    if (!selectedAcademicYearId) {
      setNotices([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const result = await noticeApi.getAll({
        status: "all",
        date: filterDate || undefined,
        class_id: filterClassId ? Number(filterClassId) : undefined,
      });

      if (!isApiSuccess(result)) {
        setNotices([]);
        setError(result.data?.message || "Unable to load notices.");
        return;
      }

      setNotices(Array.isArray(result.data?.data) ? result.data.data : []);
    } catch (requestError) {
      setNotices([]);
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [selectedAcademicYearId]);

  useEffect(() => {
    void loadNotices();
  }, [selectedAcademicYearId, filterDate, filterClassId]);

  useEffect(() => {
    setForm((current) => ({ ...current, class_ids: [] }));
    setFilterClassId("");
  }, [selectedAcademicYearId]);

  const openAddModal = () => {
    setEditingNotice(null);
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setForm({
      notice_for: Array.isArray(notice.notice_for) ? notice.notice_for : [],
      title: notice.title,
      description: notice.description,
      class_ids: Array.isArray(notice.class_ids) ? notice.class_ids : [],
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingNotice(null);
    setError("");
  };

  const openViewModal = (notice: Notice) => {
    setViewingNotice(notice);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingNotice(null);
  };

  const toggleNoticeFor = (target: NoticeFor) => {
    setForm((current) => {
      const exists = current.notice_for.includes(target);
      if (exists) {
        const remaining = current.notice_for.filter((item) => item !== target);
        return {
          ...current,
          notice_for: remaining,
        };
      }

      return {
        ...current,
        notice_for: [...current.notice_for, target],
      };
    });
  };

  const toggleClassId = (classId: number) => {
    setForm((current) => {
      const exists = current.class_ids.includes(classId);

      if (exists) {
        return {
          ...current,
          class_ids: current.class_ids.filter((item) => item !== classId),
        };
      }

      return {
        ...current,
        class_ids: [...current.class_ids, classId],
      };
    });
  };

  const getSelectedClassText = () => {
    if (form.class_ids.length === 0) {
      return "Select Classes";
    }

    const selected = classOptions.filter((item) => form.class_ids.includes(item.id));

    return selected.map((item) => item.name).join(", ");
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const plainDescription = form.description.replace(/<[^>]*>/g, "").trim();

    if (form.notice_for.length === 0) {
      setError("Please select at least one notice audience.");
      return;
    }

    if (!form.title.trim() || !plainDescription) {
      setError("Title and description are required.");
      return;
    }

    if (form.class_ids.length === 0) {
      setError("Please select at least one class.");
      return;
    }

    const payload = {
      notice_for: form.notice_for,
      title: form.title.trim(),
      description: form.description.trim(),
      class_ids: form.class_ids,
    };

    try {
      setIsSaving(true);
      setError("");

      const response = editingNotice
        ? await noticeApi.update(editingNotice.id, payload)
        : await noticeApi.create(payload);

      if (!isApiSuccess(response)) {
        throw new Error(response.data?.message || "Unable to save notice.");
      }

      const savedNotice = response.data?.data as Notice | undefined;

      if (!savedNotice) {
        throw new Error("Notice data is missing in response.");
      }

      if (editingNotice) {
        setNotices((current) =>
          current.map((notice) =>
            notice.id === savedNotice.id ? savedNotice : notice,
          ),
        );
        setMessage("Notice updated successfully.");
      } else {
        setNotices((current) => [savedNotice, ...current]);
        setMessage(response.data?.message || "Notice posted successfully.");
      }

      setIsModalOpen(false);
      setEditingNotice(null);
      setForm(emptyForm);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Move this notice to trash?")) return;

    try {
      setDeletingId(id);
      const response = await noticeApi.remove(id);

      if (!isApiSuccess(response)) {
        throw new Error(response.data?.message || "Unable to delete notice.");
      }

      setNotices((current) => current.filter((notice) => notice.id !== id));
      setMessage("Notice moved to trash successfully.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
            Communication
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Notice Board
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create and manage notices for selected classes.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={18} /> Add Notice
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Search size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold">Filter Notices</h2>
            <p className="text-sm text-muted-foreground">Search by date or class.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-sm font-medium">
            Date
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <label className="text-sm font-medium">
            Class
            <select
              value={filterClassId}
              onChange={(event) => setFilterClassId(event.target.value)}
              className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Classes</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              setFilterDate("");
              setFilterClassId("");
            }}
            className="self-end rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">Notice List</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {notices.length} notice{notices.length === 1 ? "" : "s"} found
            </p>
          </div>
          <FileText size={22} className="text-primary" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <LoaderCircle size={20} className="animate-spin" /> Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No notices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-225 text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">For</th>
                  <th className="px-5 py-3 font-medium">Classes</th>
                  <th className="px-5 py-3 font-medium">Posted By</th>
                  {isAdmin && <th className="px-5 py-3 text-right font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t hover:bg-muted/30">
                    <td className="whitespace-nowrap px-5 py-4">{formatDate(notice.created_at)}</td>
                    <td className="max-w-[320px] px-5 py-4">
                      <p className="font-medium">{notice.title}</p>
                      <div
                        className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(notice.description) }}
                      />
                    </td>
                    <td className="px-5 py-4 capitalize">{notice.notice_for.join(", ")}</td>
                    <td className="px-5 py-4">
                      {notice.class_names?.length
                        ? notice.class_names.join(", ")
                        : notice.class_ids.join(", ")}
                    </td>
                    <td className="px-5 py-4">{notice.posted_by_name || "Admin"}</td>

                    {isAdmin ? (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openViewModal(notice)}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground hover:bg-muted"
                          >
                            <Eye size={16} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(notice)}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-primary hover:bg-primary/10"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === notice.id}
                            onClick={() => handleDelete(notice.id)}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 disabled:opacity-60"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    ) : (
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openViewModal(notice)}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-foreground hover:bg-muted"
                          >
                            <Eye size={16} /> View
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background shadow-xl">
            <div className="flex items-start justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">{editingNotice ? "Edit Notice" : "Add Notice"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editingNotice
                    ? "Update notice audience and classes."
                    : "Select one or more audiences and classes."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-6">
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <label className="text-sm font-medium">
                  Notice For <span className="text-destructive">*</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="mt-1.5 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left font-normal outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <span className="truncate">{getNoticeForLabel(form.notice_for)}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[320px]">
                      {NOTICE_FOR_OPTIONS.map((option) => (
                        <DropdownMenuCheckboxItem
                          key={option.value}
                          checked={form.notice_for.includes(option.value)}
                          onCheckedChange={() => toggleNoticeFor(option.value)}
                        >
                          {option.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>

                <label className="text-sm font-medium">
                  Classes <span className="text-destructive">*</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={!selectedAcademicYearId || classOptions.length === 0}
                        className="mt-1.5 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left font-normal outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="truncate">{getSelectedClassText()}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-65 w-[320px] overflow-y-auto">
                      {classOptions.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 px-2 py-1.5">
                          <Checkbox
                            checked={form.class_ids.includes(item.id)}
                            onCheckedChange={() => toggleClassId(item.id)}
                            id={`class-${item.id}`}
                          />
                          <label htmlFor={`class-${item.id}`} className="cursor-pointer text-sm">
                            {item.name}
                          </label>
                        </div>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>
              </div>

              <label className="block text-sm font-medium">
                Title <span className="text-destructive">*</span>
                <input
                  value={form.title}
                  maxLength={100}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Enter notice title"
                />
              </label>

              <label className="block text-sm font-medium">
                Description <span className="text-destructive">*</span>
                <RichTextEditor
                  value={form.description}
                  onChange={(description: string) =>
                    setForm((current) => ({
                      ...current,
                      description,
                    }))
                  }
                  placeholder="Write notice details..."
                />
              </label>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                  {isSaving ? "Saving..." : editingNotice ? "Update Notice" : "Post Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background shadow-xl">
            <div className="flex items-start justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold">View Notice</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Full notice details.
                </p>
              </div>
              <button
                type="button"
                onClick={closeViewModal}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-1 font-medium">{formatDate(viewingNotice.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Posted By</p>
                  <p className="mt-1 font-medium">{viewingNotice.posted_by_name || "Admin"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notice For</p>
                  <p className="mt-1 font-medium capitalize">{viewingNotice.notice_for.join(", ")}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classes</p>
                  <p className="mt-1 font-medium">
                    {viewingNotice.class_names?.length
                      ? viewingNotice.class_names.join(", ")
                      : viewingNotice.class_ids.join(", ")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</p>
                <p className="mt-2 text-base font-semibold text-foreground">{viewingNotice.title}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                <div
                  className="prose prose-sm mt-2 max-w-none rounded-md border bg-muted/20 p-4 text-foreground"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewingNotice.description) }}
                />
              </div>

              <div className="flex justify-end border-t pt-5">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}