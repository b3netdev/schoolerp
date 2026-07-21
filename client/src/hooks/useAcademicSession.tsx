import { useCallback, useState } from "react";
import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";

import {
  setAcademicSessions,
  addAcademicSession as addAcademicSessionAction,
  updateAcademicSession as updateAcademicSessionAction,
  AcademicSessionDelete,
  AcademicSessionRestore,
  AcademicSessionPermanentDelete,
} from "../../redux/slicers/AcademicSessionSlicer";

export interface AcademicSessionPayload {
  id?: number;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  description?: string;
}


const useAcademicSession = () => {
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(true);

  const getAcademicSessions = useCallback(async (status: string = "all") => {
    try {
      setIsLoading(true);
      const result = await api.get(
        "/academic-session/get-academic-sessions",
        {
          params: {
            status,
          },
        }
      );

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
    } finally{
      setIsLoading(false);
    }
  }, [dispatch]);

  const addAcademicSession = useCallback(
    async (payload: AcademicSessionPayload) => {
      try {
        const result = await api.post(
          "/academic-session/add-academic-session",
          payload
        );

        if (result.data?.status === 'success' && result.data?.data) {
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
        const { id, ...updateData } = payload;
        const result = await api.put(
          `/academic-session/update-academic-session/${id}`,
          updateData
        );

        if (result.data?.status === 'success' && result.data?.data) {
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

  const deleteAcademicSession = useCallback(
    async (id: number) => {
      try {
        const result = await api.delete(
          `/academic-session/delete-academic-session/${id}`
        );

        if (result.status === 204 || result.data?.status === 'success') {
          console.log('test1');
          dispatch(AcademicSessionDelete(id));
        }

        return result.data;
      } catch (error) {
        console.error(
          "Failed to delete academic session:",
          error
        );

        return null;
      }
    },
    [dispatch]
  );

  const restoreAcademicSession = useCallback(
    async (id: number) => {
      try {
        const result = await api.patch(
          `/academic-session/restore-academic-session/${id}`
        );

        if (result.status === 200 || result.data?.status === 'success') {
          dispatch(AcademicSessionRestore(id));
          return result.data;
        }

        return null;
      } catch (error) {
        console.error(
          "Failed to restore academic session:",
          error
        );

        return null;
      }
    },
    [dispatch]
  );

  const permanentDeleteAcademicSession = useCallback(
    async (id: number) => {
      try {
        const result = await api.delete(
          `/academic-session/permanent-delete-academic-session/${id}`
        );

        if (result.status === 204 || result.data?.status === 'success') {
          dispatch(AcademicSessionPermanentDelete(id));
        }

        return result.data;
      } catch (error) {
        console.error(
          "Failed to permanently delete academic session:",
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
    deleteAcademicSession,
    restoreAcademicSession,
    permanentDeleteAcademicSession,
  };
};

export default useAcademicSession;