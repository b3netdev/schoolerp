import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "@/lib/api";
import useClassSection from "@/hooks/useClassSection";
import { useAppSelector } from "../../redux/hooks";

type NoticeFor = "student" | "teacher" | "admin";

type ClassOption = {
  id: number;
  class_name: string;
  status: string;
  deleted_at?: string | null;
};

type ClassSectionRelation = {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  deleted_at?: string | null;
};

type Notice = {
  id: number;
  notice_for: NoticeFor;
  title: string;
  description: string;
  class_id: number;
  class_name?: string;
  section_id: number;
  section_name?: string;
  posted_by_name?: string | null;
  created_at: string;
};

type NoticeForm = {
  notice_for: NoticeFor;
  title: string;
  description: string;
};

const emptyForm: NoticeForm = {
  notice_for: "student",
  title: "",
  description: "",
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
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function NoticeBoard() {
  const { getClassSections } = useClassSection();
  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection,
  );

  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [form, setForm] = useState<NoticeForm>(emptyForm);

  const [filterDate, setFilterDate] = useState("");
  const [filterClassId, setFilterClassId] = useState("");
  const [filterSectionId, setFilterSectionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* Same Redux approach used by Timetable.tsx. */
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
      /* Normalize IDs because API values can arrive as strings. */
      .filter((relation) => Number(relation.class_id) === classId)
      .map((relation) => ({
        id: relation.section_id,
        name: relation.section_name,
        relationId: relation.id,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [activeRelations, selectedClassId]);

  const filterSectionOptions = useMemo(() => {
    const classId = Number(filterClassId);
    if (!Number.isInteger(classId) || classId <= 0) return [];

    return activeRelations
      /* Normalize IDs because API values can arrive as strings. */
      .filter((relation) => Number(relation.class_id) === classId)
      .map((relation) => ({
        id: relation.section_id,
        name: relation.section_name,
        relationId: relation.id,
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [activeRelations, filterClassId]);

  const loadClasses = async () => {
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
    try {
      setIsLoading(true);
      setError("");

      const result = await api.get("/notice/get-notices", {
        params: {
          status: "all",
          date: filterDate || undefined,
          class_id: filterClassId ? Number(filterClassId) : undefined,
          section_id: filterSectionId ? Number(filterSectionId) : undefined,
        },
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
    void Promise.all([loadClasses(), getClassSections("all")]);
  }, []);

  useEffect(() => {
    void loadNotices();
  }, [filterDate, filterClassId, filterSectionId]);

  const openAddModal = () => {
    setEditingNotice(null);
    setSelectedClassId("");
    setSelectedSectionId("");
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setSelectedClassId(String(notice.class_id));
    setSelectedSectionId(String(notice.section_id));
    setForm({
      notice_for: notice.notice_for,
      title: notice.title,
      description: notice.description,
    });
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSaving) {
      setIsModalOpen(false);
      setEditingNotice(null);
      setError("");
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedClassId) {
      setError("Please select a class.");
      return;
    }

    if (editingNotice && !selectedSectionId) {
      setError("Please select a section while editing.");
      return;
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    const payload = {
      notice_for: form.notice_for,
      class_id: Number(selectedClassId),
      section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
      title: form.title.trim(),
      description: form.description.trim(),
    };

    try {
      setIsSaving(true);
      setError("");

      const response = editingNotice
        ? await api.post(`/notice/update-notice/${editingNotice.id}`, payload)
        : await api.post("/notice/add-notice", payload);

      if (!isApiSuccess(response)) {
        throw new Error(response.data?.message || "Unable to save notice.");
      }

      if (editingNotice) {
        const updatedNotice = response.data?.data as Notice | undefined;

        if (!updatedNotice) {
          throw new Error("Updated notice data is missing.");
        }

        setNotices((current) =>
          current.map((notice) =>
            notice.id === updatedNotice.id ? updatedNotice : notice,
          ),
        );
        setMessage("Notice updated successfully.");
      } else {
        const createdNotices = Array.isArray(response.data?.data)
          ? (response.data.data as Notice[])
          : [];

        /* One row for selected section, multiple rows for all sections. */
        setNotices((current) => [...createdNotices, ...current]);
        setMessage(response.data?.message || "Notice posted successfully.");
      }

      setIsModalOpen(false);
      setEditingNotice(null);
      setSelectedClassId("");
      setSelectedSectionId("");
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
      const response = await api.delete(`/notice/delete-notice/${id}`);

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
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Communication</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Notice Board</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create and manage notices for classes and sections.</p>
        </div>
        <button type="button" onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus size={18} /> Add Notice
        </button>
      </div>

      {message && <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && !isModalOpen && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2"><Search size={18} className="text-primary" /><div><h2 className="font-semibold">Filter Notices</h2><p className="text-sm text-muted-foreground">Search by date, class, or section.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium">Date<input type="date" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30" /></label>
          <label className="text-sm font-medium">Class<select value={filterClassId} onChange={(event) => { setFilterClassId(event.target.value); setFilterSectionId(""); }} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"><option value="">All Classes</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium">Section<select value={filterSectionId} disabled={!filterClassId} onChange={(event) => setFilterSectionId(event.target.value)} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:ring-2 focus:ring-primary/30"><option value="">All Sections</option>{filterSectionOptions.map((item) => <option key={item.relationId} value={item.id}>{item.name}</option>)}</select></label>
          <button type="button" onClick={() => { setFilterDate(""); setFilterClassId(""); setFilterSectionId(""); }} className="self-end rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Clear Filters</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Notice List</h2><p className="mt-1 text-sm text-muted-foreground">{notices.length} notice{notices.length === 1 ? "" : "s"} found</p></div><FileText size={22} className="text-primary" /></div>
        {isLoading ? <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground"><LoaderCircle size={20} className="animate-spin" /> Loading notices...</div> : notices.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No notices found.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Title</th><th className="px-5 py-3 font-medium">For</th><th className="px-5 py-3 font-medium">Class</th><th className="px-5 py-3 font-medium">Section</th><th className="px-5 py-3 font-medium">Posted By</th><th className="px-5 py-3 text-right font-medium">Action</th></tr></thead><tbody>{notices.map((notice) => <tr key={notice.id} className="border-t hover:bg-muted/30"><td className="whitespace-nowrap px-5 py-4">{formatDate(notice.created_at)}</td><td className="max-w-[300px] px-5 py-4"><p className="font-medium">{notice.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notice.description}</p></td><td className="px-5 py-4 capitalize">{notice.notice_for}</td><td className="px-5 py-4">{notice.class_name || `Class ${notice.class_id}`}</td><td className="px-5 py-4">{notice.section_name || `Section ${notice.section_id}`}</td><td className="px-5 py-4">{notice.posted_by_name || "Admin"}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openEditModal(notice)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-primary hover:bg-primary/10"><Pencil size={16} /> Edit</button><button type="button" disabled={deletingId === notice.id} onClick={() => handleDelete(notice.id)} className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 disabled:opacity-60"><Trash2 size={16} />{deletingId === notice.id ? "Deleting..." : "Delete"}</button></div></td></tr>)}</tbody></table></div>}
      </div>

      {isModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background shadow-xl"><div className="flex items-start justify-between border-b px-6 py-5"><div><h2 className="text-xl font-semibold">{editingNotice ? "Edit Notice" : "Add Notice"}</h2><p className="mt-1 text-sm text-muted-foreground">{editingNotice ? "Changes apply only to this notice." : "Leave section empty to post to every section in the class."}</p></div><button type="button" onClick={closeModal} disabled={isSaving} className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X size={20} /></button></div><form onSubmit={handleSave} className="space-y-5 p-6">{error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}<div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Notice For<select value={form.notice_for} onChange={(event) => setForm((current) => ({ ...current, notice_for: event.target.value as NoticeFor }))} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"><option value="student">Students</option><option value="teacher">Teachers</option><option value="admin">Admins</option></select></label><label className="text-sm font-medium">Class <span className="text-destructive">*</span><select value={selectedClassId} onChange={(event) => { setSelectedClassId(event.target.value); if (!editingNotice) setSelectedSectionId(""); }} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30"><option value="">Select Class</option>{classOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label className="block text-sm font-medium">Section {editingNotice ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(Optional)</span>}<select value={selectedSectionId} disabled={!selectedClassId} onChange={(event) => setSelectedSectionId(event.target.value)} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none disabled:cursor-not-allowed disabled:opacity-60 focus:ring-2 focus:ring-primary/30"><option value="">{editingNotice ? "Select Section" : "All sections in this class"}</option>{sectionOptions.map((item) => <option key={item.relationId} value={item.id}>{item.name}</option>)}</select></label><label className="block text-sm font-medium">Notice Title <span className="text-destructive">*</span><input type="text" maxLength={100} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 block w-full rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30" placeholder="Enter notice title" /></label><label className="block text-sm font-medium">Description <span className="text-destructive">*</span><textarea rows={6} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 block w-full resize-none rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-primary/30" placeholder="Write notice details..." /></label><div className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={closeModal} disabled={isSaving} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">Cancel</button><button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{isSaving && <LoaderCircle size={16} className="animate-spin" />}{isSaving ? "Saving..." : editingNotice ? "Update Notice" : "Post Notice"}</button></div></form></div></div>}
    </div>
  );
}
