import { useState } from "react";
import studentApi from "@/lib/studentApi";
import { useAppDispatch } from "../../redux/hooks";
import { setStudentAuth, clearStudentAuth } from "../../redux/slicers/studentAuthSlicer";

type LoginPayload = {
  identifier: string;
  password: string;
};

const useStudentAuth = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [checkAuthLoading, setCheckAuthLoading] = useState(true);

  const studentLogin = async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await studentApi.post("/student-auth/login", payload);

      if (response?.data?.success) {
        dispatch(setStudentAuth(response.data.data));
        return response.data.data;
      }

      return null;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setCheckAuthLoading(true);

      const response = await studentApi.get("/student-auth/check-auth", {
        skipErrorToast: true,
      });

      if (response?.data?.success) {
        dispatch(setStudentAuth(response.data.data));
        return true;
      }

      return false;
    } catch {
      return false;
    } finally {
      setCheckAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await studentApi.post("/student-auth/logout");
    } finally {
      dispatch(clearStudentAuth());
    }
  };

  return {
    studentLogin,
    checkAuth,
    logout,
    loading,
    checkAuthLoading,
    error,
  };
};

export default useStudentAuth;
