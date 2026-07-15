import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";

import { DataTable, Column } from "@/components/tables/DataTable";
import { Modal } from "@/components/common/Modal";
import { FormModal, FieldDef } from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";

import { useAppSelector } from "../../redux/hooks";

import useTeacher, { type AddTeacherPayload } from "@/hooks/useTeacher";
import useClass from "@/hooks/useClass";

import type { Teacher } from "../../redux/slicers/teacherSlice";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TeacherTableRow = Teacher & {
  full_name: string;
  initials: string;
};

type StatusFilter = "all" | "active" | "inactive";

type StatusFilterOption = {
  value: StatusFilter;
  label: string;
};

const columns: Column[] = [
  { key: "employee_code", label: "Employee Code" },
  { key: "full_name", label: "Teacher", type: "avatar-text" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "qualification", label: "Qualification" },
  { key: "specialization", label: "Specialization" },
  { key: "employment_type", label: "Employment Type" },
  { key: "status", label: "Status", type: "badge" },
];

const buttonGroup: StatusFilterOption[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

const fields: FieldDef[] = [
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
    key: "employee_code",
    label: "Employee Code",
    placeholder: "e.g. E12345",
    checkExistAt:[{at:"teacher"}]

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

function safeValue(value: unknown): string {
  if (value === undefined || value === null) return "";

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value);
}

function teacherToInitialValues(teacher: Teacher): Record<string, string> {
  return {
    first_name: safeValue(teacher.first_name),
    last_name: safeValue(teacher.last_name),
    employee_code: safeValue(teacher.employee_code),
    email: safeValue(teacher.email),
    phone: safeValue(teacher.phone),
    alternate_phone: safeValue(teacher.alternate_phone),

    gender: safeValue(teacher.gender),
    date_of_birth: safeValue(teacher.date_of_birth),
    blood_group: safeValue(teacher.blood_group),
    marital_status: safeValue(teacher.marital_status),

    current_address: safeValue(teacher.current_address),
    permanent_address: safeValue(teacher.permanent_address),
    city: safeValue(teacher.city),
    state: safeValue(teacher.state),
    country: safeValue(teacher.country),
    pincode: safeValue(teacher.pincode),

    qualification: safeValue(teacher.qualification),
    specialization: safeValue(teacher.specialization),
    experience_years: safeValue(teacher.experience_years),
    joining_date: safeValue(teacher.joining_date),
    employment_type: safeValue(teacher.employment_type),
    status: safeValue(teacher.status) || "active",

    basic_salary: safeValue(teacher.basic_salary),
    bank_name: safeValue(teacher.bank_name),
    bank_account_number: safeValue(teacher.bank_account_number),
    ifsc_code: safeValue(teacher.ifsc_code),
    pan_number: safeValue(teacher.pan_number),

    emergency_contact_name: safeValue(teacher.emergency_contact_name),
    emergency_contact_phone: safeValue(teacher.emergency_contact_phone),
    emergency_contact_relation: safeValue(teacher.emergency_contact_relation),

    profile_image: safeValue(teacher.profile_image),
    remarks: safeValue(teacher.remarks),
  };
}

function buildTeacherPayload(values: Record<string, string>): AddTeacherPayload {
  return {
    first_name: values.first_name,
    last_name: values.last_name || undefined,
    employee_code: values.employee_code || undefined,
    email: values.email || undefined,
    phone: values.phone || undefined,
    alternate_phone: values.alternate_phone || undefined,

    gender: values.gender || undefined,
    date_of_birth: values.date_of_birth || undefined,
    blood_group: values.blood_group || undefined,
    marital_status: values.marital_status || undefined,

    current_address: values.current_address || undefined,
    permanent_address: values.permanent_address || undefined,
    city: values.city || undefined,
    state: values.state || undefined,
    country: values.country || undefined,
    pincode: values.pincode || undefined,

    qualification: values.qualification || undefined,
    specialization: values.specialization || undefined,
    experience_years: values.experience_years
      ? Number(values.experience_years)
      : 0,
    joining_date: values.joining_date || undefined,
    employment_type: values.employment_type || undefined,
    status: values.status || "active",

    basic_salary: values.basic_salary
      ? Number(values.basic_salary)
      : undefined,
    bank_name: values.bank_name || undefined,
    bank_account_number: values.bank_account_number || undefined,
    ifsc_code: values.ifsc_code || undefined,
    pan_number: values.pan_number || undefined,

    emergency_contact_name: values.emergency_contact_name || undefined,
    emergency_contact_phone: values.emergency_contact_phone || undefined,
    emergency_contact_relation: values.emergency_contact_relation || undefined,

    profile_image: values.profile_image || undefined,
    remarks: values.remarks || undefined,
  };
}

export default function Teachers() {
  const teachers = useAppSelector((state) => state.teacher.teachers);
  const { classes } = useAppSelector((state) => state.class);

  const { getTeachers, addteacher, updateteacher, deleteteacher } =
    useTeacher();

  const { getClasses } = useClass();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [viewItem, setViewItem] = useState<Teacher | null>(null);
  const [editItem, setEditItem] = useState<Teacher | null>(null);
  const [deleteItem, setDeleteItem] = useState<Teacher | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const itemsPerPage = 10;

  useEffect(() => {
    getTeachers("all");
    getClasses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tableData: TeacherTableRow[] = teachers.map((teacher) => ({
    ...teacher,
    full_name: getFullName(teacher),
    initials: makeInitials(teacher.first_name, teacher.last_name),
  }));

  const filtered = tableData.filter((teacher) => {
    const keyword = search.toLowerCase();

    return (
      teacher.employee_code?.toLowerCase().includes(keyword) ||
      teacher.full_name.toLowerCase().includes(keyword) ||
      teacher.email?.toLowerCase().includes(keyword) ||
      teacher.phone?.toLowerCase().includes(keyword) ||
      teacher.qualification?.toLowerCase().includes(keyword) ||
      teacher.specialization?.toLowerCase().includes(keyword)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

  const paginatedTeachers = filtered.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleAdd = async (values: Record<string, string>) => {
    const payload = buildTeacherPayload(values);

    const data = await addteacher(payload);

    if (data) {
      setAddOpen(false);
    }
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editItem?.id) return;

    const payload = {
      id: editItem.id,
      ...buildTeacherPayload(values),
    };

    await updateteacher(payload);

    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteItem?.id) return;

    await deleteteacher(deleteItem.id);

    setDeleteItem(null);
  };

  const selectTabe = async (item: StatusFilterOption) => {
    setStatusFilter(item.value);
    setPage(1);

    await getTeachers(item.value);
  };

  const handleClassChange = (value: string) => {
    setSelectedClassId(value);
    setPage(1);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Teachers" }]} />

      <PageHeader
        title="Teachers"
        description={`${teachers.length} teaching staff members`}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            data-testid="add-teacher-btn"
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add Teacher
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <div className="relative w-full lg:max-w-sm">
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

          <div className="w-full lg:w-[220px]">
            <Select value={selectedClassId} onValueChange={handleClassChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>

                {classes.map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {String(item.class_name ?? "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ButtonGroup>
            {buttonGroup.map((item) => (
              <Button
                key={item.value}
                className="cursor-pointer"
                variant={statusFilter === item.value ? "default" : "outline"}
                size="sm"
                type="button"
                onClick={() => selectTabe(item)}
              >
                {item.label}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <div className="px-6">
          <DataTable
            columns={columns}
            data={paginatedTeachers as unknown as Record<string, unknown>[]}
            onView={(row) => setViewItem(row as unknown as Teacher)}
            onEdit={(row) => setEditItem(row as unknown as Teacher)}
            onDelete={(row) => setDeleteItem(row as unknown as Teacher)}
          />
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedTeachers.length} of {filtered.length} teachers
          </span>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        title="Teacher Details"
        size="lg"
      >
        {viewItem && (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {makeInitials(viewItem.first_name, viewItem.last_name)}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {getFullName(viewItem)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {viewItem.employee_code || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 text-sm">
              <InfoSection title="Basic Information">
                <Info label="Employee Code" value={viewItem.employee_code} />
                <Info label="Name" value={getFullName(viewItem)} />
                <Info label="Email" value={viewItem.email} />
                <Info label="Phone" value={viewItem.phone} />
                <Info
                  label="Alternate Phone"
                  value={viewItem.alternate_phone}
                />
                <Info label="Status" value={viewItem.status} />
              </InfoSection>

              <InfoSection title="Personal Details">
                <Info label="Gender" value={viewItem.gender} />
                <Info
                  label="Date of Birth"
                  value={safeValue(viewItem.date_of_birth)}
                />
                <Info label="Blood Group" value={viewItem.blood_group} />
                <Info label="Marital Status" value={viewItem.marital_status} />
              </InfoSection>

              <InfoSection title="Address Details">
                <Info
                  label="Current Address"
                  value={viewItem.current_address}
                  large
                />
                <Info
                  label="Permanent Address"
                  value={viewItem.permanent_address}
                  large
                />
                <Info label="City" value={viewItem.city} />
                <Info label="State" value={viewItem.state} />
                <Info label="Country" value={viewItem.country} />
                <Info label="Pincode" value={viewItem.pincode} />
              </InfoSection>

              <InfoSection title="Professional Details">
                <Info label="Qualification" value={viewItem.qualification} />
                <Info
                  label="Specialization"
                  value={viewItem.specialization}
                />
                <Info
                  label="Experience Years"
                  value={safeValue(viewItem.experience_years)}
                />
                <Info
                  label="Joining Date"
                  value={safeValue(viewItem.joining_date)}
                />
                <Info
                  label="Employment Type"
                  value={viewItem.employment_type}
                />
              </InfoSection>

              <InfoSection title="Salary / Bank Details">
                <Info
                  label="Basic Salary"
                  value={safeValue(viewItem.basic_salary)}
                />
                <Info label="Bank Name" value={viewItem.bank_name} />
                <Info
                  label="Bank Account Number"
                  value={viewItem.bank_account_number}
                />
                <Info label="IFSC Code" value={viewItem.ifsc_code} />
                <Info label="PAN Number" value={viewItem.pan_number} />
              </InfoSection>

              <InfoSection title="Emergency Contact">
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
              </InfoSection>

              <InfoSection title="Remarks">
                <Info label="Remarks" value={viewItem.remarks} large />
              </InfoSection>
            </div>
          </div>
        )}
      </Modal>

      <FormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        title="Add New Teacher"
        fields={fields}
        submitLabel="Add Teacher"
      />

      <FormModal
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleEdit}
        title="Edit Teacher"
        fields={fields}
        initialValues={editItem ? teacherToInitialValues(editItem) : undefined}
        submitLabel="Save Changes"
      />

      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Teacher"
        description={`Are you sure you want to remove "${deleteItem ? getFullName(deleteItem) : ""
          }" from the system? This action cannot be undone.`}
        confirmLabel="Delete Teacher"
      />
    </div>
  );
}

function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h4 className="mb-4 text-sm font-semibold text-foreground">{title}</h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children}
      </div>
    </section>
  );
}

function Info({
  label,
  value,
  large = false,
}: {
  label: string;
  value?: string | null;
  large?: boolean;
}) {
  return (
    <div className={large ? "md:col-span-2" : ""}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="rounded-lg bg-muted/40 px-3 py-2 font-medium text-foreground break-words min-h-[38px]">
        {value || "-"}
      </p>
    </div>
  );
}