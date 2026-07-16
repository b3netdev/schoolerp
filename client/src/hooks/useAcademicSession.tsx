import { useCallback } from "react";
import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";

import {
  setAcademicSessions,
  addAcademicSession as addAcademicSessionAction,
  updateAcademicSession as updateAcademicSessionAction,
} from "../../redux/slicers/academicSessionSlicer";

export interface AcademicSessionPayload {
  id?: number;
  session_name: string;
  status?: string;
  description?: string;
}

const useAcademicSession = () => {
  const dispatch = useAppDispatch();

  const getAcademicSessions = useCallback(async () => {
    try {
      const result = await api.get(
        "/academic-session/get-academic-sessions"
      );

      // Supports:
      // { success: true, data: [...] }
      // and directly returned arrays.
      const sessions = result.data?.data ?? result.data;

      dispatch(
        setAcademicSessions(
          Array.isArray(sessions) ? sessions : []
        )
      );

      return result.data;
    } catch (error) {
      console.error(
        "Failed to fetch academic sessions:",
        error
      );

      return null;
    }
  }, [dispatch]);

  const addAcademicSession = useCallback(
    async (payload: AcademicSessionPayload) => {
      try {
        const result = await api.post(
          "/academic-session/add-academic-session",
          payload
        );

        if (result.data?.success && result.data?.data) {
          dispatch(
            addAcademicSessionAction(result.data.data)
          );
        }

        return result.data;
      } catch (error) {
        console.error(
          "Failed to add academic session:",
          error
        );

        return null;
      }
    },
    [dispatch]
  );

  const updateAcademicSession = useCallback(
    async (payload: AcademicSessionPayload) => {
      try {
        const result = await api.post(
          "/academic-session/update-academic-session",
          payload
        );

        if (result.data?.success && result.data?.data) {
          dispatch(
            updateAcademicSessionAction(result.data.data)
          );
        }

        return result.data;
      } catch (error) {
        console.error(
          "Failed to update academic session:",
          error
        );

        return null;
      }
    },
    [dispatch]
  );

  return {
    getAcademicSessions,
    addAcademicSession,
    updateAcademicSession,
  };
};

export default useAcademicSession;