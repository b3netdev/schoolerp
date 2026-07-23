import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
  setTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  Teacher,
} from "../../redux/slicers/teacherSlice";

export interface AddTeacherPayload {
  first_name: string;
  last_name?: string;
  employee_code?: string;
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
}

export interface UpdateTeacherPayload extends AddTeacherPayload {
  id: number;
}
type TeacherStatusFilter = "all" | "active" | "inactive" | "trash";
const useTeacher = () => {
  const dispatch = useAppDispatch();

  const getTeachers = async (status: TeacherStatusFilter = "all") => {
    try {
      const result = await api.get("/teacher/get-teachers", {
        params: {
          status,
        },
      });

      if (result?.data?.success) {
        dispatch(setTeachers(result.data.data));
      }
    } catch (error) {
      console.log(error);
    }
  };
  const addteacher = async (payload: AddTeacherPayload) => {
    try {
      const result = await api.post("/teacher/add-teacher", payload);

      if (result?.data?.success) {
        dispatch(addTeacher(result.data.data));
        return true
      }
    } catch (error) {
      console.log(error);
      return false
    }
  };

  const updateteacher = async (payload: UpdateTeacherPayload) => {
    try {
      const result = await api.post("/teacher/update-teacher", payload);

      if (result?.data?.success) {
        dispatch(updateTeacher(result.data.data));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteteacher = async (id: number) => {
    try {
      const result = await api.delete(`/teacher/delete-teacher/${id}`);

      if (result?.data?.success) {
        dispatch(deleteTeacher(id));
        return { success: true, message: result.data.message };
      }
      return { success: false, message: 'Failed to delete teacher' };
    } catch (error: any) {
      console.log(error);
      const message = error?.response?.data?.message || 'An error occurred while deleting teacher';
      return { success: false, message };
    }
  };

  const restoreteacher = async (id: number) => {
    try {
      const result = await api.post(`/teacher/restore-teacher/${id}`);

      if (result?.data?.success) {
        dispatch(updateTeacher(result.data.data));
        return { success: true, message: result.data.message };
      }
      return { success: false, message: 'Failed to restore teacher' };
    } catch (error: any) {
      console.log(error);
      const message = error?.response?.data?.message || 'An error occurred while restoring teacher';
      return { success: false, message };
    }
  };

  const permanentdeleteteacher = async (id: number) => {
    try {
      const result = await api.delete(`/teacher/permanent-delete-teacher/${id}`);

      if (result?.data?.success) {
        dispatch(deleteTeacher(id));
        return { success: true, message: result.data.message };
      }
      return { success: false, message: 'Failed to permanently delete teacher' };
    } catch (error: any) {
      console.log(error);
      const message = error?.response?.data?.message || 'An error occurred while permanently deleting teacher';
      return { success: false, message };
    }
  };
  

  return {
    getTeachers,
    addteacher,
    updateteacher,
    deleteteacher,
    restoreteacher,
    permanentdeleteteacher,
  };
};

export default useTeacher;