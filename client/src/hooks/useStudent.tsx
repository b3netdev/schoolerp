import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
  setStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "../../redux/slicers/studentSlicer";

export interface AddStudentPayload {
  first_name: string;
  last_name?: string;
  student_code?: string;
  email?: string;
  phone?: string;
  password?: string;
  status?: string;

  /** References an existing class_section_relation row (class + section + teacher for the current year). */
  class_section_id?: number;

  /** Dynamic profile fields (student_meta is a key/value store) — any keys the UI wants to collect. */
  meta?: Record<string, string | number | boolean | null>;
}

export interface UpdateStudentPayload extends AddStudentPayload {
  id: number;
}

export type StudentStatusFilter = "all" | "active" | "inactive" | "trash";

const useStudent = () => {
  const dispatch = useAppDispatch();

  const getStudents = async (status: StudentStatusFilter = "all") => {
    try {
      const result = await api.get("/student/get-students", {
        params: { status },
      });

      if (result?.data?.success) {
        dispatch(setStudents(result.data.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addStudentRecord = async (payload: AddStudentPayload) => {
    try {
      const result = await api.post("/student/add-student", payload);

      if (result?.data?.success) {
        dispatch(addStudent(result.data.data));
        return result.data.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateStudentRecord = async (payload: UpdateStudentPayload) => {
    try {
      const result = await api.post("/student/update-student", payload);

      if (result?.data?.success) {
        dispatch(updateStudent(result.data.data));
        return result.data.data;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteStudentRecord = async (id: number) => {
    try {
      const result = await api.delete(`/student/delete-student/${id}`);

      if (result?.data?.success) {
        dispatch(deleteStudent(id));
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const restoreStudentRecord = async (id: number) => {
    try {
      const result = await api.post(`/student/restore-student/${id}`);

      if (result?.data?.success) {
        dispatch(deleteStudent(id));
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const hardDeleteStudentRecord = async (id: number) => {
    try {
      const result = await api.delete(`/student/permanent-delete-student/${id}`);

      if (result?.data?.success) {
        dispatch(deleteStudent(id));
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return {
    getStudents,
    addStudentRecord,
    updateStudentRecord,
    deleteStudentRecord,
    restoreStudentRecord,
    hardDeleteStudentRecord,
  };
};

export default useStudent;
