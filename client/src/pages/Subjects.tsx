import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { DataTable, type Column } from "@/components/tables/DataTable";
import {
  FormModal,
  type FieldDef,
  type FormValues,
} from "@/components/common/FormModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { Pagination } from "@/components/common/Pagination";
import { PageHeader } from "@/components/common/PageHeader";
import {
  StatusTabs,
  type StatusTabOption,
} from "@/components/common/StatusTabs";
import { ListingSkeleton } from "@/components/tables/ListingSkeleton";

import {
  useAppDispatch,
  useAppSelector,
} from "../../redux/hooks";

import {
  addSubject,
  updateSubject,
  deleteSubject,
  setSubjectsPageData,
  setSubjects,
  type Subject,
} from "../../redux/slicers/subjectSlicer";

import useClassSection from "@/hooks/useClassSection";

type SubjectStatusFilter = "all" | "trash";

interface ClassSectionRelation {
  id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream: string | null;
  teacher_id: number | null;
  teacher_name: string;
  employee_code: string | null;
  academic_year_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface SubjectType {
  id: number;
  title: string;
  deleted_at?: string | null;
}

type SubjectTableRow = Subject & {
  class_section_name: string;
  subject_type_name: string;
};

const SUBJECTS_API = "/subjects";
const SUBJECT_TYPES_API = "/subject-type";

const statusTabs: StatusTabOption<SubjectStatusFilter>[] = [
  {
    value: "all",
    label: "All",
  },
  {
    value: "trash",
    label: "Trash",
  },
];

const columns: Column[] = [
  {
    key: "name",
    label: "Subject Name",
  },
  {
    key: "subject_type_name",
    label: "Subject Type",
  },
  {
    key: "class_section_name",
    label: "Class & Section",
  },
  {
    key: "display_order",
    label: "Display Order",
  },
  {
    key: "description",
    label: "Description",
  },
];

export default function Subjects() {
  const dispatch = useAppDispatch();

  const subjects = useAppSelector(
    (state) => state.subject.subjects,
  );
  const pagination = useAppSelector(
    (state) => state.subject.pagination,
  );

  const { classSectionRelations } = useAppSelector(
    (state) => state.classSection,
  );

  const { getClassSections } = useClassSection();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [subjectTypes, setSubjectTypes] = useState<
    SubjectType[]
  >([]);
  const [selectedClassId, setSelectedClassId] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("selectedSubjectClassId") ?? ""
      : "",
  );
  const [selectedSectionId, setSelectedSectionId] = useState(() =>
    typeof window !== "undefined"
      ? sessionStorage.getItem("selectedSubjectSectionId") ?? ""
      : "",
  );

  const [statusFilter, setStatusFilter] =
    useState<SubjectStatusFilter>("all");

  const [addOpen, setAddOpen] = useState(false);

  const [editItem, setEditItem] =
    useState<Subject | null>(null);

  const [deleteItem, setDeleteItem] =
    useState<Subject | null>(null);

  const [restoreItem, setRestoreItem] =
    useState<Subject | null>(null);

  const [
    permanentDeleteItem,
    setPermanentDeleteItem,
  ] = useState<Subject | null>(null);

  const classOptions = useMemo(
    () =>
      Array.from(
        new Map(
          classSectionRelations.map((item) => [String(item.class_id), item.class_name]),
        ).entries(),
      ).map(([id, name]) => ({ id, name })),
    [classSectionRelations],
  );

  const sectionOptions = useMemo(
    () =>
      classSectionRelations
        .filter((item) => String(item.class_id) === selectedClassId)
        .map((item) => ({
          id: String(item.section_id),
          name: item.section_name,
        })),
    [classSectionRelations, selectedClassId],
  );

  /** Load active subject types for the form dropdown. */
  const loadSubjectTypes = async () => {
    try {
      const response = await api.get(
        `${SUBJECT_TYPES_API}/get-subject-types`,
        {
          params: {
            status: "active",
          },
        },
      );

      const data = response.data?.data;

      /** Supports array and paginated API response formats. */
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.subjectTypes)
          ? data.subjectTypes
          : [];

      setSubjectTypes(list);
    } catch (error) {
      console.error(
        "Failed to fetch subject types:",
        error,
      );

      setSubjectTypes([]);
      toast.error("Unable to load subject types.");
    }
  };

  /**
   * Load class/section relations
   */
  useEffect(() => {
    void getClassSections("all");
    void loadSubjectTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load subjects
   */
  const loadSubjects = async (
    status: SubjectStatusFilter,
    currentPage = page,
    currentLimit = itemsPerPage,
    classId = selectedClassId ? Number(selectedClassId) : undefined,
    sectionId = selectedSectionId ? Number(selectedSectionId) : undefined,
  ) => {
    try {
      setIsLoading(true);

      const response = await api.get(
        `${SUBJECTS_API}/get-subjects`,
        {
          params: {
            status,
            page: currentPage,
            limit: currentLimit,
            ...(classId ? { class_id: classId } : {}),
            ...(sectionId ? { section_id: sectionId } : {}),
          },
        },
      );

      const payload = response.data?.data;
      if (response.data?.success && payload) {
        dispatch(setSubjectsPageData(payload));
        if (currentPage > payload.totalPages) {
          setPage(Math.max(1, payload.totalPages));
        }
        return;
      }

      dispatch(setSubjects([]));
    } catch (error) {
      console.error(
        "Failed to fetch subjects:",
        error,
      );

      dispatch(setSubjects([]));

      toast.error(
        "Unable to load subjects.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedClassId) {
      setSelectedSectionId("");
      sessionStorage.setItem("selectedSubjectSectionId", "");
      return;
    }

    const savedSectionId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("selectedSubjectSectionId") ?? ""
        : "";

    const matchesClass = classSectionRelations.some(
      (relation) =>
        Number(relation.class_id) === Number(selectedClassId) &&
        Number(relation.section_id) === Number(savedSectionId),
    );

    if (matchesClass) {
      setSelectedSectionId(savedSectionId);
      return;
    }

    setSelectedSectionId("");
    sessionStorage.setItem("selectedSubjectSectionId", "");
  }, [selectedClassId, classSectionRelations]);

  useEffect(() => {
    void loadSubjects(
      statusFilter,
      page,
      itemsPerPage,
      selectedClassId ? Number(selectedClassId) : undefined,
      selectedSectionId ? Number(selectedSectionId) : undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, itemsPerPage, selectedClassId, selectedSectionId]);

  /**
   * Class Section dropdown
   */
  const classSectionOptions = useMemo(() => {
    return (
      classSectionRelations as ClassSectionRelation[]
    )
      .filter(
        (relation) =>
          !relation.deleted_at,
      )
      .map((relation) => ({
        value: String(
          relation.id,
        ),

        label: `Class ${relation.class_name} - Section ${
          relation.section_name
        }${
          relation.section_stream
            ? ` (${relation.section_stream})`
            : ""
        }`,
      }));
  }, [classSectionRelations]);

  const subjectTypeOptions = useMemo(
    () => [
      {
        value: "",
        label: "Select subject type",
      },
      ...subjectTypes
        .filter((subjectType) => !subjectType.deleted_at)
        .map((subjectType) => ({
          value: String(subjectType.id),
          label: subjectType.title,
        })),
    ],
    [subjectTypes],
  );

  /**
   * Subject form fields
   */
  const subjectFields: FieldDef[] =
    useMemo(
      () => [
        {
          key: "class_section_id",
          label: "Class & Section",
          type: "select",
          required: true,
          options:
            classSectionOptions,
        },
        {
          key: "subject_type_id",
          label: "Subject Type",
          type: "select",
          required: false,
          options: subjectTypeOptions,
        },
        {
          key: "name",
          label: "Subject Name",
          type: "text",
          required: true,
          placeholder:
            "Enter subject name",
        },
        {
          key: "display_order",
          label: "Display Order",
          type: "number",
          required: false,
          placeholder:
            "Enter display order",
        },
        {
          key: "description",
          label: "Description",
          type: "textarea",
          placeholder:
            "Enter subject description",
        },
      ],
      [classSectionOptions, subjectTypeOptions],
    );

  /**
   * Build table data
   */
  const tableData:
    SubjectTableRow[] = useMemo(
    () => {
      return subjects?.map(
        (subject) => {
          const classSection =
            classSectionOptions.find(
              (option) =>
                Number(
                  option.value,
                ) ===
                subject.class_section_id,
            );

          return {
            ...subject,

            class_section_name:
              classSection?.label ??
              "Not assigned",

            subject_type_name:
              subject.subject_type_title ??
              "Not assigned",

            /**
             * Keep NULL display
             * order visually empty.
             */
            display_order:
              subject.display_order ??
              null,
          };
        },
      ) ?? [];
    },
    [
      subjects,
      classSectionOptions,
    ],
  );

  /**
   * Search
   */
  const filteredSubjects =
    useMemo(() => {
      const keyword = search
        .trim()
        .toLowerCase();

      if (!keyword) {
        return tableData;
      }

      return tableData.filter(
        (subject) => {
          return (
            subject.name
              .toLowerCase()
              .includes(keyword) ||
            subject.subject_type_name
              .toLowerCase()
              .includes(keyword) ||
            subject.description
              ?.toLowerCase()
              .includes(keyword) ||
            subject.class_section_name
              .toLowerCase()
              .includes(keyword)
          );
        },
      );
    }, [search, tableData]);

  /**
   * Pagination
   */
  const totalPages = Math.max(
    1,
    pagination.totalPages || 1,
  );

  const paginatedData =
    filteredSubjects;

  /**
   * ADD SUBJECT
   */
  const handleAdd = async (
    values: FormValues,
  ) => {
    try {
      const rawDisplayOrder =
        values.display_order;

      const hasDisplayOrder =
        rawDisplayOrder !==
          undefined &&
        rawDisplayOrder !== null &&
        String(
          rawDisplayOrder,
        ).trim() !== "";

      /**
       * Do NOT do:
       *
       * Number(values.display_order)
       *
       * because:
       *
       * Number("") === 0
       */
      const payload: {
        class_section_id: number;
        subject_type_id: number | null;
        name: string;
        description: string | null;
        display_order?: number;
      } = {
        class_section_id: Number(
          values.class_section_id,
        ),

        subject_type_id:
          values.subject_type_id &&
          String(values.subject_type_id).trim() !== ""
            ? Number(values.subject_type_id)
            : null,

        name: String(
          values.name ?? "",
        ).trim(),

        description:
          String(
            values.description ??
              "",
          ).trim() || null,
      };

      /**
       * Only include display_order
       * when something was entered.
       */
      if (hasDisplayOrder) {
        payload.display_order =
          Number(
            rawDisplayOrder,
          );
      }

      console.log(
        "ADD SUBJECT PAYLOAD:",
        payload,
      );

      const response =
        await api.post(
          `${SUBJECTS_API}/add-subject`,
          payload,
        );

      const createdSubject =
        response.data
          ?.data as Subject;

      if (
        statusFilter === "all" &&
        createdSubject
      ) {
        dispatch(
          addSubject(
            createdSubject,
          ),
        );
      }

      toast.success(
        response.data?.message ||
          "Subject added successfully.",
      );

      setAddOpen(false);

      /**
       * Reload because backend
       * orders subjects by
       * display_order.
       */
      await loadSubjects(
        statusFilter,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to add subject.",
      );
    }
  };

  /**
   * UPDATE SUBJECT
   */
  const handleEdit = async (
    values: FormValues,
  ) => {
    if (!editItem) {
      return;
    }

    try {
      const rawDisplayOrder =
        values.display_order;

      const hasDisplayOrder =
        rawDisplayOrder !==
          undefined &&
        rawDisplayOrder !== null &&
        String(
          rawDisplayOrder,
        ).trim() !== "";

      const payload: {
        class_section_id: number;
        subject_type_id: number | null;
        name: string;
        description: string | null;
        display_order?: number;
      } = {
        class_section_id: Number(
          values.class_section_id,
        ),

        subject_type_id:
          values.subject_type_id &&
          String(values.subject_type_id).trim() !== ""
            ? Number(values.subject_type_id)
            : null,

        name: String(
          values.name ?? "",
        ).trim(),

        description:
          String(
            values.description ??
              "",
          ).trim() || null,
      };

      /**
       * Only send display_order
       * when input contains value.
       *
       * Empty field will NOT
       * become 0.
       */
      if (hasDisplayOrder) {
        payload.display_order =
          Number(
            rawDisplayOrder,
          );
      }

      console.log(
        "UPDATE SUBJECT PAYLOAD:",
        payload,
      );

      const response =
        await api.post(
          `${SUBJECTS_API}/update-subject/${editItem.id}`,
          payload,
        );

      const updatedSubject =
        response.data
          ?.data as Subject;

      if (updatedSubject) {
        dispatch(
          updateSubject(
            updatedSubject,
          ),
        );
      }

      toast.success(
        response.data?.message ||
          "Subject updated successfully.",
      );

      setEditItem(null);

      /**
       * Reload so updated
       * display order is reflected
       * immediately.
       */
      await loadSubjects(
        statusFilter,
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to update subject.",
      );
    }
  };

  /**
   * SOFT DELETE
   */
  const handleDelete =
    async () => {
      if (!deleteItem) {
        return;
      }

      try {
        const response =
          await api.delete(
            `${SUBJECTS_API}/delete-subject/${deleteItem.id}`,
          );

        dispatch(
          deleteSubject(
            deleteItem.id,
          ),
        );

        toast.success(
          response.data?.message ||
            "Subject moved to trash.",
        );

        setDeleteItem(null);
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to move subject to trash.",
        );
      }
    };

  /**
   * RESTORE
   */
  const handleRestore =
    async () => {
      if (!restoreItem) {
        return;
      }

      try {
        const response =
          await api.post(
            `${SUBJECTS_API}/restore-subject/${restoreItem.id}`,
          );

        dispatch(
          deleteSubject(
            restoreItem.id,
          ),
        );

        toast.success(
          response.data?.message ||
            "Subject restored successfully.",
        );

        setRestoreItem(null);
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to restore subject.",
        );
      }
    };

  /**
   * PERMANENT DELETE
   */
  const handlePermanentDelete =
    async () => {
      if (
        !permanentDeleteItem
      ) {
        return;
      }

      try {
        const response =
          await api.delete(
            `${SUBJECTS_API}/permanent-delete-subject/${permanentDeleteItem.id}`,
          );

        dispatch(
          deleteSubject(
            permanentDeleteItem.id,
          ),
        );

        toast.success(
          response.data?.message ||
            "Subject permanently deleted successfully.",
        );

        setPermanentDeleteItem(
          null,
        );
      } catch (error: any) {
        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to permanently delete subject.",
        );
      }
    };

  /**
   * Find original subject
   * using DataTable row
   */
  const getSubjectFromRow = (
    row: Record<
      string,
      unknown
    >,
  ): Subject | undefined => {
    return subjects.find(
      (subject) =>
        subject.id ===
        Number(row.id),
    );
  };


  const editInitialValues =
    useMemo<
      FormValues | undefined
    >(() => {
      if (!editItem) {
        return undefined;
      }

      return {
        class_section_id:
          String(
            editItem.class_section_id,
          ),

        subject_type_id:
          editItem.subject_type_id
            ? String(editItem.subject_type_id)
            : "",

        name: editItem.name,

        description:
          editItem.description ??
          "",

        display_order:
          editItem.display_order ===
            null ||
          editItem.display_order ===
            undefined
            ? ""
            : String(
                editItem.display_order,
              ),
      };
    }, [editItem]);

  return (
    <div>
      <Breadcrumb
        items={[
          {
            label: "Subjects",
          },
        ]}
      />

      <PageHeader
        title="Subjects"
        description={`${pagination.total} subject records`}
        action={
          <button
            type="button"
            onClick={() =>
              setAddOpen(true)
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Subject
          </button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                type="search"
                placeholder="Search subjects..."
                value={search}
                onChange={(
                  event,
                ) => {
                  setSearch(
                    event.target
                      .value,
                  );

                  setPage(1);
                }}
                className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Class</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    const nextClassId = e.target.value;
                    setSelectedClassId(nextClassId);
                    sessionStorage.setItem("selectedSubjectClassId", nextClassId);
                    setSelectedSectionId("");
                    sessionStorage.setItem("selectedSubjectSectionId", "");
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">All Classes</option>
                  {classOptions.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Section</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => {
                    const nextSectionId = e.target.value;
                    setSelectedSectionId(nextSectionId);
                    sessionStorage.setItem("selectedSubjectSectionId", nextSectionId);
                    setPage(1);
                  }}
                  disabled={!selectedClassId}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">All Sections</option>
                  {sectionOptions.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setItemsPerPage(nextLimit);
                    setPage(1);
                  }}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[5, 10, 20].map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </label>

              <StatusTabs
                options={
                  statusTabs
                }
                value={
                  statusFilter
                }
                disabled={
                  isLoading
                }
                onChange={(
                  value,
                ) => {
                  setStatusFilter(
                    value,
                  );

                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="px-6">
          {isLoading ? (
            <ListingSkeleton
              columns={
                columns.length
              }
              rows={
                itemsPerPage
              }
            />
          ) : (
            <DataTable
              columns={
                columns
              }
              data={
                paginatedData as unknown as Record<
                  string,
                  unknown
                >[]
              }
              onEdit={
                statusFilter ===
                "all"
                  ? (row) => {
                      const subject =
                        getSubjectFromRow(
                          row,
                        );

                      if (
                        subject
                      ) {
                        setEditItem(
                          subject,
                        );
                      }
                    }
                  : undefined
              }
              onDelete={
                statusFilter ===
                "all"
                  ? (row) => {
                      const subject =
                        getSubjectFromRow(
                          row,
                        );

                      if (
                        subject
                      ) {
                        setDeleteItem(
                          subject,
                        );
                      }
                    }
                  : undefined
              }
              onRestore={
                statusFilter ===
                "trash"
                  ? (row) => {
                      const subject =
                        getSubjectFromRow(
                          row,
                        );

                      if (
                        subject
                      ) {
                        setRestoreItem(
                          subject,
                        );
                      }
                    }
                  : undefined
              }
              onPermanentDelete={
                statusFilter ===
                "trash"
                  ? (row) => {
                      const subject =
                        getSubjectFromRow(
                          row,
                        );

                      if (
                        subject
                      ) {
                        setPermanentDeleteItem(
                          subject,
                        );
                      }
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <span className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {pagination.total} subjects
          </span>

          <Pagination
            currentPage={page}
            totalPages={
              totalPages
            }
            onPageChange={
              setPage
            }
          />
        </div>
      </div>

      {/* Add */}

      <FormModal
        isOpen={addOpen}
        onClose={() =>
          setAddOpen(false)
        }
        onSubmit={
          handleAdd
        }
        title="Add New Subject"
        fields={
          subjectFields
        }
        submitLabel="Add Subject"
      />

      {/* Edit */}

      <FormModal
        isOpen={
          Boolean(editItem)
        }
        onClose={() =>
          setEditItem(null)
        }
        onSubmit={
          handleEdit
        }
        title="Edit Subject"
        fields={
          subjectFields
        }
        initialValues={
          editInitialValues
        }
        submitLabel="Save Changes"
      />

      {/* Delete */}

      <ConfirmModal
        isOpen={
          Boolean(deleteItem)
        }
        onClose={() =>
          setDeleteItem(null)
        }
        onConfirm={
          handleDelete
        }
        title="Delete Subject"
        description={`Are you sure you want to move "${
          deleteItem?.name ??
          ""
        }" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      {/* Restore */}

      <ConfirmModal
        isOpen={
          Boolean(restoreItem)
        }
        onClose={() =>
          setRestoreItem(null)
        }
        onConfirm={
          handleRestore
        }
        title="Restore Subject"
        description={`Are you sure you want to restore "${
          restoreItem?.name ??
          ""
        }"?`}
        confirmLabel="Restore Subject"
      />

      {/* Permanent Delete */}

      <ConfirmModal
        isOpen={Boolean(
          permanentDeleteItem,
        )}
        onClose={() =>
          setPermanentDeleteItem(
            null,
          )
        }
        onConfirm={
          handlePermanentDelete
        }
        title="Permanently Delete Subject"
        description={`Are you sure you want to permanently delete "${
          permanentDeleteItem?.name ??
          ""
        }"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
      />
    </div>
  );
}