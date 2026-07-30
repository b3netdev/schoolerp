import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, LoaderCircle } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { FormModal, FieldDef, FormValues } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusTabs, StatusTabOption } from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";
import { useAppSelector } from "../../redux/hooks";
import useStudent, {
  StudentStatusFilter,
  AddStudentPayload,
} from "@/hooks/useStudent";
import useSettings from "@/hooks/useSettngs";
import useClassSection from "@/hooks/useClassSection";
import type { Student } from "../../redux/slicers/studentSlicer";

type StudentTableRow = Student & { full_name: string };

const statusTabs: StatusTabOption<StudentStatusFilter>[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "trash", label: "Trash" },
];

const columns: Column[] = [
  { key: "student_code", label: "Student Code" },
  { key: "full_name", label: "Student", type: "avatar-text" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status", type: "badge" },
];

type StudentCodeRules =
  | { generationType: "auto" }
  | { generationType: "manual"; prefix: string; digitLength: number };

type SettingRecord = { key: string; value?: string | number | boolean | null };

function normalizeSettings(response: unknown): SettingRecord[] {
  if (Array.isArray(response)) return response as SettingRecord[];
  return [];
}

function getFullName(student: Student): string {
  return `${student.first_name || ""} ${student.last_name || ""}`.trim();
}

const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
  (value) => ({ label: value, value }),
);

const categoryOptions = ["General", "OBC", "SC", "ST", "EWS", "Other"].map(
  (value) => ({ label: value, value }),
);

// student_meta is a dynamic key/value store (no fixed columns), so these
// are just the field definitions the UI collects — adding another one here
// never requires a migration.
const META_FIELD_GROUPS: { section: string; fields: FieldDef[] }[] = [
  {
    section: "Personal Information",
    fields: [
      { key: "date_of_birth", label: "Date of Birth", type: "date" },
      {
        key: "gender",
        label: "Gender",
        type: "select",
        options: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
      },
      {
        key: "blood_group",
        label: "Blood Group",
        type: "select",
        options: bloodGroupOptions,
      },
      { key: "profile_image", label: "Profile Image URL", type: "text" },
      { key: "nationality", label: "Nationality", type: "text" },
      { key: "religion", label: "Religion", type: "text" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: categoryOptions,
      },
      { key: "mother_tongue", label: "Mother Tongue", type: "text" },
    ],
  },
  {
    section: "Contact Information",
    fields: [
      { key: "alternate_phone", label: "Alternate Phone", type: "tel" },
      { key: "current_address", label: "Current Address", type: "textarea" },
      { key: "permanent_address", label: "Permanent Address", type: "textarea" },
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "postal_code", label: "Postal Code", type: "text" },
    ],
  },
  {
    section: "Parent Information",
    fields: [
      { key: "father_name", label: "Father's Name", type: "text" },
      { key: "father_phone", label: "Father's Phone", type: "tel" },
      { key: "father_email", label: "Father's Email", type: "email" },
      { key: "father_occupation", label: "Father's Occupation", type: "text" },
      { key: "mother_name", label: "Mother's Name", type: "text" },
      { key: "mother_phone", label: "Mother's Phone", type: "tel" },
      { key: "mother_email", label: "Mother's Email", type: "email" },
      { key: "mother_occupation", label: "Mother's Occupation", type: "text" },
    ],
  },
  {
    section: "Guardian Information",
    fields: [
      { key: "guardian_name", label: "Guardian Name", type: "text" },
      { key: "guardian_relation", label: "Guardian Relation", type: "text" },
      { key: "guardian_phone", label: "Guardian Phone", type: "tel" },
      { key: "guardian_email", label: "Guardian Email", type: "email" },
      { key: "guardian_occupation", label: "Guardian Occupation", type: "text" },
      { key: "guardian_address", label: "Guardian Address", type: "textarea" },
    ],
  },
  {
    section: "Previous Education",
    fields: [
      { key: "previous_school_name", label: "Previous School Name", type: "text" },
      { key: "previous_class", label: "Previous Class", type: "text" },
      {
        key: "previous_school_address",
        label: "Previous School Address",
        type: "textarea",
      },
      {
        key: "transfer_certificate_no",
        label: "Transfer Certificate No.",
        type: "text",
      },
    ],
  },
  {
    section: "Medical Information",
    fields: [
      { key: "medical_condition", label: "Medical Condition", type: "textarea" },
      { key: "allergies", label: "Allergies", type: "textarea" },
      { key: "medications", label: "Medications", type: "textarea" },
      { key: "doctor_name", label: "Doctor Name", type: "text" },
      { key: "doctor_phone", label: "Doctor Phone", type: "tel" },
      {
        key: "emergency_contact_name",
        label: "Emergency Contact Name",
        type: "text",
      },
      {
        key: "emergency_contact_phone",
        label: "Emergency Contact Phone",
        type: "tel",
      },
    ],
  },
];

const META_FIELDS: FieldDef[] = META_FIELD_GROUPS.flatMap((group) =>
  group.fields.map((field) => ({ ...field, section: group.section })),
);

const META_FIELD_KEYS = META_FIELDS.map((field) => field.key);

function buildMetaPayload(
  values: FormValues,
): Record<string, string | number | boolean> {
  const meta: Record<string, string | number | boolean> = {};

  META_FIELD_KEYS.forEach((key) => {
    const value = values[key];

    if (value !== undefined && value !== "") {
      meta[key] = value;
    }
  });

  return meta;
}

export default function Students() {
  const {
    getStudents,
    addStudentRecord,
    updateStudentRecord,
    deleteStudentRecord,
    restoreStudentRecord,
    hardDeleteStudentRecord,
  } = useStudent();

  const { getSettingsbyKey } = useSettings();
  const getSettingsByKeyRef = useRef(getSettingsbyKey);

  useEffect(() => {
    getSettingsByKeyRef.current = getSettingsbyKey;
  }, [getSettingsbyKey]);

  const { getClassSections } = useClassSection();

  const students = useAppSelector((state) => state.student.students);
  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all");

  const [editItem, setEditItem] = useState<Student | null>(null);
  const [deleteItem, setDeleteItem] = useState<Student | null>(null);
  const [restoreItem, setRestoreItem] = useState<Student | null>(null);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState<Student | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [studentCodeRules, setStudentCodeRules] = useState<StudentCodeRules>({
    generationType: "auto",
  });
  const [codeSettingsLoading, setCodeSettingsLoading] = useState(false);
  const [codeSettingsError, setCodeSettingsError] = useState("");

  const itemsPerPage = 10;

  const loadStudents = async (status: StudentStatusFilter) => {
    try {
      setIsLoading(true);
      await getStudents(status);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    getClassSections("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentFormOpen = addOpen || Boolean(editItem);

  useEffect(() => {
    if (!studentFormOpen) return;

    let active = true;

    const loadStudentCodeSettings = async () => {
      setCodeSettingsLoading(true);
      setCodeSettingsError("");

      try {
        const response = await getSettingsByKeyRef.current("students");
        if (!active) return;

        const settings = normalizeSettings(response);

        const generationType = String(
          settings.find((s) => s.key === "student_code_generated_by")?.value ?? "",
        )
          .trim()
          .toLowerCase();

        if (generationType === "auto") {
          setStudentCodeRules({ generationType: "auto" });
          return;
        }

        if (generationType !== "manual") {
          throw new Error("student_code_generated_by must be auto or manual");
        }

        const prefix = String(
          settings.find((s) => s.key === "student_code_prefix")?.value ?? "",
        )
          .trim()
          .toUpperCase();

        if (!prefix) {
          throw new Error("Student code prefix is not configured");
        }

        const digitLength = Number(
          settings.find((s) => s.key === "student_code_length")?.value,
        );

        if (!Number.isInteger(digitLength) || digitLength <= 0) {
          throw new Error("Student code length must be a positive integer");
        }

        setStudentCodeRules({ generationType: "manual", prefix, digitLength });
      } catch (error) {
        if (!active) return;
        setCodeSettingsError(
          error instanceof Error
            ? error.message
            : "Unable to load student code settings",
        );
      } finally {
        if (active) setCodeSettingsLoading(false);
      }
    };

    void loadStudentCodeSettings();

    return () => {
      active = false;
    };
    // getSettingsbyKey is intentionally excluded — useSettings() returns a
    // new function identity every render, so depending on it directly would
    // re-run this effect (and re-flip codeSettingsLoading) on every render
    // while the form is open. getSettingsByKeyRef always has the latest one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentFormOpen]);

  const classSectionOptions = useMemo(
    () =>
      classSectionRelations.map((item) => ({
        label: `${item.class_name} - ${item.section_name}${
          item.teacher_name ? ` (${item.teacher_name})` : ""
        }`,
        value: String(item.id),
      })),
    [classSectionRelations],
  );

  const addFields: FieldDef[] = useMemo(() => {
    const fields: FieldDef[] = [
      { key: "first_name", label: "First Name", required: true },
      { key: "last_name", label: "Last Name" },
      {
        key: "email",
        label: "Email",
        type: "email",
        checkExistAt: [{ at: "student" }],
      },
      {
        key: "phone",
        label: "Phone",
        type: "tel",
        checkExistAt: [{ at: "student" }],
      },
      {
        key: "password",
        label: "Password",
        type: "password",
        required: true,
        placeholder: "Minimum 6 characters",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
      {
        key: "class_section_id",
        label: "Class & Section",
        type: "select",
        options: classSectionOptions,
      },
      ...META_FIELDS,
    ];

    if (studentCodeRules.generationType === "manual") {
      fields.splice(2, 0, {
        key: "student_code",
        label: `Student Code (${studentCodeRules.prefix}...)`,
        required: true,
        placeholder: `Enter ${studentCodeRules.digitLength} digits`,
        checkExistAt: [{ at: "student" }],
      });
    }

    return fields;
  }, [classSectionOptions, studentCodeRules]);

  const editFields: FieldDef[] = useMemo(
    () => [
      { key: "first_name", label: "First Name", required: true },
      { key: "last_name", label: "Last Name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      {
        key: "password",
        label: "New Password",
        type: "password",
        placeholder: "Leave blank to keep unchanged",
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
      ...META_FIELDS,
    ],
    [],
  );

  const tableData: StudentTableRow[] = useMemo(
    () => students.map((student) => ({ ...student, full_name: getFullName(student) })),
    [students],
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return tableData;

    return tableData.filter(
      (student) =>
        student.student_code.toLowerCase().includes(keyword) ||
        student.full_name.toLowerCase().includes(keyword) ||
        student.email?.toLowerCase().includes(keyword) ||
        student.phone?.toLowerCase().includes(keyword),
    );
  }, [search, tableData]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedData = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const buildAddPayload = (values: FormValues): AddStudentPayload => ({
    first_name: String(values.first_name ?? "").trim(),
    last_name: String(values.last_name ?? "").trim() || undefined,
    student_code:
      studentCodeRules.generationType === "manual"
        ? String(values.student_code ?? "").trim()
        : undefined,
    email: String(values.email ?? "").trim() || undefined,
    phone: String(values.phone ?? "").trim() || undefined,
    password: String(values.password ?? ""),
    status: String(values.status ?? "active"),
    class_section_id: values.class_section_id
      ? Number(values.class_section_id)
      : undefined,
    meta: buildMetaPayload(values),
  });

  const handleAdd = async (values: FormValues) => {
    if (codeSettingsLoading || codeSettingsError) return;

    const payload = buildAddPayload(values);
    const result = await addStudentRecord(payload);

    if (result) {
      setAddOpen(false);
      await loadStudents(statusFilter);
    }
  };

  const handleEdit = async (values: FormValues) => {
    if (!editItem) return;

    const payload = {
      id: editItem.id,
      first_name: String(values.first_name ?? "").trim(),
      last_name: String(values.last_name ?? "").trim() || undefined,
      email: String(values.email ?? "").trim() || undefined,
      phone: String(values.phone ?? "").trim() || undefined,
      password: String(values.password ?? "").trim() || undefined,
      status: String(values.status ?? "active"),
      meta: buildMetaPayload(values),
    };

    const result = await updateStudentRecord(payload);

    if (result) {
      setEditItem(null);
      await loadStudents(statusFilter);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    const result = await deleteStudentRecord(deleteItem.id);
    if (result) {
      setDeleteItem(null);
      await loadStudents(statusFilter);
    }
  };

  const handleRestore = async () => {
    if (!restoreItem) return;
    const result = await restoreStudentRecord(restoreItem.id);
    if (result) {
      setRestoreItem(null);
      await loadStudents(statusFilter);
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteItem) return;
    const result = await hardDeleteStudentRecord(permanentDeleteItem.id);
    if (result) {
      setPermanentDeleteItem(null);
      await loadStudents(statusFilter);
    }
  };

  const handleEditClick = (row: Record<string, unknown>) => {
    if (statusFilter === "trash") return;
    const selected = students.find((student) => student.id === Number(row.id));
    if (selected) setEditItem(selected);
  };

  const handleDeleteClick = (row: Record<string, unknown>) => {
    const selected = students.find((student) => student.id === Number(row.id));
    if (!selected) return;

    if (statusFilter === "trash") {
      setPermanentDeleteItem(selected);
    } else {
      setDeleteItem(selected);
    }
  };

  const handleRestoreClick = (row: Record<string, unknown>) => {
    const selected = students.find((student) => student.id === Number(row.id));
    if (selected) setRestoreItem(selected);
  };

  const editInitialValues: FormValues | undefined = editItem
    ? {
        first_name: editItem.first_name ?? "",
        last_name: editItem.last_name ?? "",
        email: editItem.email ?? "",
        phone: editItem.phone ?? "",
        password: "",
        status: editItem.status ?? "active",
        ...META_FIELD_KEYS.reduce<FormValues>((values, key) => {
          const metaValue = editItem.meta?.[key];
          values[key] =
            metaValue === undefined || metaValue === null
              ? ""
              : String(metaValue);
          return values;
        }, {}),
      }
    : undefined;

  return (
    <div>
      <Breadcrumb items={[{ label: "Students" }]} />

      <PageHeader
        title="Students"
        description={`${students.length} student records`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-student-btn"
          >
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="students-search"
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
            <ListingSkeleton columns={columns.length} rows={paginatedData.length} />
          ) : (
            <DataTable
              columns={columns}
              data={paginatedData as unknown as Record<string, unknown>[]}
              onEdit={statusFilter !== "trash" ? handleEditClick : undefined}
              onDelete={statusFilter !== "trash" ? handleDeleteClick : undefined}
              onRestore={statusFilter === "trash" ? handleRestoreClick : undefined}
              onPermanentDelete={statusFilter === "trash" ? handleDeleteClick : undefined}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {filtered.length} students
          </span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Student"
        fields={addFields}
        submitLabel={
          codeSettingsLoading ? "Loading settings..." : "Add Student"
        }
      />
      {addOpen && codeSettingsLoading && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-md">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading student code settings...
        </div>
      )}
      {addOpen && codeSettingsError && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-md">
          {codeSettingsError}
        </div>
      )}

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Student"
        fields={editFields}
        initialValues={editInitialValues}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to move "${deleteItem ? getFullName(deleteItem) : ""}" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      <ConfirmModal
        isOpen={!!restoreItem}
        onClose={() => setRestoreItem(null)}
        onConfirm={handleRestore}
        title="Restore Student"
        description={`Are you sure you want to restore "${restoreItem ? getFullName(restoreItem) : ""}"? It will be moved back to the active list.`}
        confirmLabel="Restore Student"
      />

      <ConfirmModal
        isOpen={!!permanentDeleteItem}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently Delete Student"
        description={`Are you sure you want to permanently delete "${permanentDeleteItem ? getFullName(permanentDeleteItem) : ""}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}
