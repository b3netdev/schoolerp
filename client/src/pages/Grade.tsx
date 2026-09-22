import { FormEvent, useEffect, useState } from "react";
import axios from "axios";

interface Grade {
  id: number;
  grade: string;
  range_from: number | null;
  range_to: number | null;
  remarks: string | null;
  description: string | null;
}

interface GradeFormData {
  grade: string;
  range_from: string;
  range_to: string;
  remarks: string;
  description: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/grade`;

const initialFormData: GradeFormData = {
  grade: "",
  range_from: "",
  range_to: "",
  remarks: "",
  description: "",
};

const GradeManagement = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [formData, setFormData] =
    useState<GradeFormData>(initialFormData);

  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchGrades = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${API_BASE_URL}/get-grades`);

      setGrades(
        Array.isArray(response.data?.data) ? response.data.data : []
      );
    } catch (error: any) {
      setGrades([]);
      showMessage(
        error?.response?.data?.message || "Unable to fetch grades.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    if (!formData.grade.trim()) {
      showMessage("Grade is required.", "error");
      return;
    }

    if (
      formData.range_from &&
      formData.range_to &&
      Number(formData.range_from) > Number(formData.range_to)
    ) {
      showMessage("Range from cannot be greater than range to.", "error");
      return;
    }

    const payload = {
      grade: formData.grade.trim(),
      range_from: formData.range_from ? Number(formData.range_from) : null,
      range_to: formData.range_to ? Number(formData.range_to) : null,
      remarks: formData.remarks.trim() || null,
      description: formData.description.trim() || null,
    };

    try {
      setSubmitting(true);

      if (editId) {
        await axios.patch(`${API_BASE_URL}/update-grade/${editId}`, payload);
        showMessage("Grade updated successfully.", "success");
      } else {
        await axios.post(`${API_BASE_URL}/add-grade`, payload);
        showMessage("Grade added successfully.", "success");
      }

      resetForm();
      await fetchGrades();
    } catch (error: any) {
      showMessage(
        error?.response?.data?.message || "Unable to save grade.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: Grade) => {
    setEditId(item.id);
    setMessage("");

    setFormData({
      grade: item.grade,
      range_from: item.range_from?.toString() || "",
      range_to: item.range_to?.toString() || "",
      remarks: item.remarks || "",
      description: item.description || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this grade?"
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);

      await axios.delete(`${API_BASE_URL}/delete-grade/${id}`);

      if (editId === id) {
        resetForm();
      }

      showMessage("Grade deleted successfully.", "success");
      await fetchGrades();
    } catch (error: any) {
      showMessage(
        error?.response?.data?.message || "Unable to delete grade.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Grade Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage grade ranges, remarks, and descriptions.
        </p>
      </div>

      {message && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${
            messageType === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">
            {editId ? "Update Grade" : "Add New Grade"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Grade <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className={inputClass}
                placeholder="Example: A+"
                maxLength={10}
                required
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium text-slate-700">
                Range From
              </label>

              <input
                type="number"
                name="range_from"
                value={formData.range_from}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-sm font-medium text-slate-700">
                Range To
              </label>

              <input
                type="number"
                name="range_to"
                value={formData.range_to}
                onChange={handleChange}
                className={inputClass}
                placeholder="100"
                min="0"
                max="100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Remarks
              </label>

              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className={inputClass}
                placeholder="Example: Excellent"
              />
            </div>

            <div className="md:col-span-6">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`${inputClass} min-h-24 resize-y`}
                placeholder="Optional grade description"
                rows={3}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : editId
                ? "Update Grade"
                : "Add Grade"}
            </button>

            {editId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">
            Grade List
          </h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {grades.length} {grades.length === 1 ? "Grade" : "Grades"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">SL</th>
                <th className="px-5 py-4 font-semibold">Grade</th>
                <th className="px-5 py-4 font-semibold">Mark Range</th>
                <th className="px-5 py-4 font-semibold">Remarks</th>
                <th className="px-5 py-4 font-semibold">Description</th>
                <th className="px-5 py-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
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
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 text-slate-500">{index + 1}</td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1 font-bold text-blue-700">
                        {item.grade}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {item.range_from ?? "-"} - {item.range_to ?? "-"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.remarks || "—"}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-slate-600">
                      {item.description || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={submitting}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default GradeManagement;