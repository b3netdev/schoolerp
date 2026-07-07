import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";

type Teacher = {
  id?: number;

  employee_code?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;

  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;

  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  employment_type?: string;
  status?: string;

  basic_salary?: number;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  profile_image?: string;
  remarks?: string;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type TeacherTableRow = Teacher & {
  full_name: string;
  initials: string;
};

const columns: Column[] = [
  { key: "full_name", label: "Teacher", type: "avatar-text" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "qualification", label: "Qualification" },
  { key: "specialization", label: "Specialization" },
  { key: "employment_type", label: "Employment Type" },
  { key: "status", label: "Status", type: "badge" },
  { key: "actions", label: "Actions", type: "actions" },
];

const fields: FieldDef[] = [
  // Basic teacher details
  {
    key: "first_name",
    label: "First Name",
    required: true,
    placeholder: "e.g. Alan",
  },
  {
    key: "last_name",
    label: "Last Name",
    placeholder: "e.g. Turing",
  },
  {
    key: "email",
    label: "Email",
    type: "email",
    placeholder: "teacher@school.edu",
  },
  {
    key: "phone",
    label: "Phone",
    type: "tel",
    placeholder: "9876543210",
  },
  {
    key: "alternate_phone",
    label: "Alternate Phone",
    type: "tel",
    placeholder: "9876543210",
  },

  // Personal details
  {
    key: "gender",
    label: "Gender",
    type: "select",
    options: ["male", "female", "other"],
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    type: "date",
  },
  {
    key: "blood_group",
    label: "Blood Group",
    type: "select",
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  },
  {
    key: "marital_status",
    label: "Marital Status",
    type: "select",
    options: ["single", "married", "divorced", "widowed"],
  },

  // Address details
  {
    key: "current_address",
    label: "Current Address",
    type: "textarea",
    placeholder: "Enter current address",
  },
  {
    key: "permanent_address",
    label: "Permanent Address",
    type: "textarea",
    placeholder: "Enter permanent address",
  },
  {
    key: "city",
    label: "City",
    placeholder: "e.g. Kolkata",
  },
  {
    key: "state",
    label: "State",
    placeholder: "e.g. West Bengal",
  },
  {
    key: "country",
    label: "Country",
    placeholder: "e.g. India",
  },
  {
    key: "pincode",
    label: "Pincode",
    placeholder: "e.g. 700001",
  },

  // Professional details
  {
    key: "qualification",
    label: "Qualification",
    placeholder: "e.g. M.Sc, B.Ed",
  },
  {
    key: "specialization",
    label: "Specialization",
    placeholder: "e.g. Mathematics",
  },
  {
    key: "experience_years",
    label: "Experience Years",
    type: "number",
    placeholder: "e.g. 5",
  },
  {
    key: "joining_date",
    label: "Joining Date",
    type: "date",
  },
  {
    key: "employment_type",
    label: "Employment Type",
    type: "select",
    options: ["full_time", "part_time", "contract"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive", "resigned"],
  },

  // Salary / HR details
  {
    key: "basic_salary",
    label: "Basic Salary",
    type: "number",
    placeholder: "e.g. 25000",
  },
  {
    key: "bank_name",
    label: "Bank Name",
    placeholder: "e.g. HDFC Bank",
  },
  {
    key: "bank_account_number",
    label: "Bank Account Number",
    placeholder: "Enter account number",
  },
  {
    key: "ifsc_code",
    label: "IFSC Code",
    placeholder: "e.g. HDFC0001234",
  },
  {
    key: "pan_number",
    label: "PAN Number",
    placeholder: "e.g. ABCDE1234F",
  },

  // Emergency contact
  {
    key: "emergency_contact_name",
    label: "Emergency Contact Name",
    placeholder: "e.g. John Doe",
  },
  {
    key: "emergency_contact_phone",
    label: "Emergency Contact Phone",
    type: "tel",
    placeholder: "9876543210",
  },
  {
    key: "emergency_contact_relation",
    label: "Emergency Contact Relation",
    placeholder: "e.g. Father",
  },
  {
    key: "remarks",
    label: "Remarks",
    type: "textarea",
    placeholder: "Enter remarks",
  },
];

function getFullName(teacher: Teacher): string {
  return `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim();
}

function makeInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || "";
  const last = lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase();
}

function teacherToInitialValues(teacher: Teacher): Record<string, string> {
  return {
    employee_code: teacher.employee_code || "",
    first_name: teacher.first_name || "",
    last_name: teacher.last_name || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    alternate_phone: teacher.alternate_phone || "",

    gender: teacher.gender || "",
    date_of_birth: teacher.date_of_birth || "",
    blood_group: teacher.blood_group || "",
    marital_status: teacher.marital_status || "",

    current_address: teacher.current_address || "",
    permanent_address: teacher.permanent_address || "",
    city: teacher.city || "",
    state: teacher.state || "",
    country: teacher.country || "",
    pincode: teacher.pincode || "",

    qualification: teacher.qualification || "",
    specialization: teacher.specialization || "",
    experience_years: teacher.experience_years?.toString() || "",
    joining_date: teacher.joining_date || "",
    employment_type: teacher.employment_type || "",
    status: teacher.status || "active",

    basic_salary: teacher.basic_salary?.toString() || "",
    bank_name: teacher.bank_name || "",
    bank_account_number: teacher.bank_account_number || "",
    ifsc_code: teacher.ifsc_code || "",
    pan_number: teacher.pan_number || "",

    emergency_contact_name: teacher.emergency_contact_name || "",
    emergency_contact_phone: teacher.emergency_contact_phone || "",
    emergency_contact_relation: teacher.emergency_contact_relation || "",

    profile_image: teacher.profile_image || "",
    remarks: teacher.remarks || "",
  };
}

function buildTeacherPayload(values: Record<string, string>): Omit<Teacher, "id"> {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone,
    alternate_phone: values.alternate_phone,

    gender: values.gender,
    date_of_birth: values.date_of_birth,
    blood_group: values.blood_group,
    marital_status: values.marital_status,

    current_address: values.current_address,
    permanent_address: values.permanent_address,
    city: values.city,
    state: values.state,
    country: values.country,
    pincode: values.pincode,

    qualification: values.qualification,
    specialization: values.specialization,
    experience_years: Number(values.experience_years || 0),
    joining_date: values.joining_date,
    employment_type: values.employment_type,
    status: values.status || "active",

    basic_salary: values.basic_salary ? Number(values.basic_salary) : undefined,
    bank_name: values.bank_name,
    bank_account_number: values.bank_account_number,
    ifsc_code: values.ifsc_code,
    pan_number: values.pan_number,

    emergency_contact_name: values.emergency_contact_name,
    emergency_contact_phone: values.emergency_contact_phone,
    emergency_contact_relation: values.emergency_contact_relation,

    profile_image: values.profile_image,
    remarks: values.remarks,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };
}

export default function Teachers() {
  const [data, setData] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<Teacher | null>(null);
  const [editItem, setEditItem] = useState<Teacher | null>(null);
  const [deleteItem, setDeleteItem] = useState<Teacher | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const tableData: TeacherTableRow[] = data.map((teacher) => ({
    ...teacher,
    full_name: getFullName(teacher),
    initials: makeInitials(teacher.first_name, teacher.last_name),
  }));

  const filtered = tableData.filter((teacher) => {
    const keyword = search.toLowerCase();

    return (
      teacher.full_name.toLowerCase().includes(keyword) ||
      teacher.email?.toLowerCase().includes(keyword) ||
      teacher.phone?.toLowerCase().includes(keyword) ||
      teacher.qualification?.toLowerCase().includes(keyword) ||
      teacher.specialization?.toLowerCase().includes(keyword)
    );
  });

  const handleAdd = (values: Record<string, string>) => {
    const newTeacher: Teacher = {
      ...buildTeacherPayload(values),
    };

    setData((prev) => [newTeacher, ...prev]);
    console.log(newTeacher,"newTeacher")
    setAddOpen(false);
  };

  const handleEdit = (values: Record<string, string>) => {
    if (!editItem) return;

    const updatedTeacher: Teacher = {
      ...editItem,
      ...buildTeacherPayload(values),
      id: editItem.id,
      created_at: editItem.created_at,
      updated_at: new Date().toISOString(),
    };

    setData((prev) =>
      prev.map((teacher) =>
        teacher.id === editItem.id ? updatedTeacher : teacher
      )
    );

    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteItem) return;

    setData((prev) =>
      prev.filter((teacher) => teacher.id !== deleteItem.id)
    );

    setDeleteItem(null);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Teachers" }]} />

      <PageHeader
        title="Teachers"
        description={`${data.length} teaching staff members`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-teacher-btn"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="teachers-search"
            />
          </div>
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            onView={(row) => setViewItem(row as unknown as Teacher)}
            onEdit={(row) => setEditItem(row as unknown as Teacher)}
            onDelete={(row) => setDeleteItem(row as unknown as Teacher)}
          />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {filtered.length} of {data.length} teachers
          </span>

          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(filtered.length / 10))}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* View Teacher */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Teacher Details"
        size="lg"
      >
        {viewItem && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Employee Code" value={viewItem.employee_code} />
            <Info label="Name" value={getFullName(viewItem)} />
            <Info label="Email" value={viewItem.email} />
            <Info label="Phone" value={viewItem.phone} />
            <Info label="Alternate Phone" value={viewItem.alternate_phone} />
            <Info label="Gender" value={viewItem.gender} />
            <Info label="Date of Birth" value={viewItem.date_of_birth} />
            <Info label="Blood Group" value={viewItem.blood_group} />
            <Info label="Marital Status" value={viewItem.marital_status} />
            <Info label="Current Address" value={viewItem.current_address} />
            <Info label="Permanent Address" value={viewItem.permanent_address} />
            <Info label="City" value={viewItem.city} />
            <Info label="State" value={viewItem.state} />
            <Info label="Country" value={viewItem.country} />
            <Info label="Pincode" value={viewItem.pincode} />
            <Info label="Qualification" value={viewItem.qualification} />
            <Info label="Specialization" value={viewItem.specialization} />
            <Info
              label="Experience Years"
              value={viewItem.experience_years?.toString()}
            />
            <Info label="Joining Date" value={viewItem.joining_date} />
            <Info label="Employment Type" value={viewItem.employment_type} />
            <Info label="Status" value={viewItem.status} />
            <Info
              label="Basic Salary"
              value={viewItem.basic_salary?.toString()}
            />
            <Info label="Bank Name" value={viewItem.bank_name} />
            <Info
              label="Bank Account Number"
              value={viewItem.bank_account_number}
            />
            <Info label="IFSC Code" value={viewItem.ifsc_code} />
            <Info label="PAN Number" value={viewItem.pan_number} />
            <Info
              label="Emergency Contact Name"
              value={viewItem.emergency_contact_name}
            />
            <Info
              label="Emergency Contact Phone"
              value={viewItem.emergency_contact_phone}
            />
            <Info
              label="Emergency Contact Relation"
              value={viewItem.emergency_contact_relation}
            />
            <Info label="Remarks" value={viewItem.remarks} />
          </div>
        )}
      </Modal>

      {/* Add Teacher */}
      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Teacher"
        fields={fields}
        submitLabel="Add Teacher"
      />

      {/* Edit Teacher */}
      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Teacher"
        fields={fields}
        initialValues={
          editItem ? teacherToInitialValues(editItem) : undefined
        }
        submitLabel="Save Changes"
      />

      {/* Delete Teacher */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        description={`Are you sure you want to remove "${deleteItem ? getFullName(deleteItem) : ""}" from the system? This action cannot be undone.`}
        confirmLabel="Delete Teacher"
      />
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground break-words">
        {value || "-"}
      </p>
    </div>
  );
}